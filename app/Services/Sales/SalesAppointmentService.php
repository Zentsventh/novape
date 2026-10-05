<?php

declare(strict_types=1);

namespace App\Services\Sales;

use App\Models\CrmActivity;
use App\Models\CrmDeal;
use App\Models\CrmTimelineEvent;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\SalesAgentProfile;
use App\Models\SalesAppointment;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class SalesAppointmentService
{
    /** Public availability contains no customer or employee contact data. */
    public function slots(?int $sellerId = null, ?string $date = null): array
    {
        if ($date !== null) Validator::make(['date' => $date], ['date' => ['required', 'date_format:Y-m-d']])->validate();
        $profiles = SalesAgentProfile::with('user:id,nombres,apellidos')->where('active', true)
            ->whereHas('user', fn ($q) => $q->where('estado', 'activo')->whereHas('roles', fn ($r) => $r->where('nombre', '!=', 'cliente')))
            ->when($sellerId, fn ($q) => $q->where('user_id', $sellerId))->get();
        $slots = [];
        foreach ($profiles as $profile) {
            $today = CarbonImmutable::now($profile->timezone)->startOfDay();
            $first = $date ? CarbonImmutable::parse($date, $profile->timezone) : $today;
            $last = $date ? $first : $today->addDays($profile->booking_days - 1);
            if ($first->lt($today) || $first->gte($today->addDays($profile->booking_days))) continue;
            $busy = SalesAppointment::where('seller_id', $profile->user_id)->where('status', 'confirmed')
                ->where('starts_at', '<', $this->dbTime($last->addDay()))
                ->where('ends_at', '>', $this->dbTime($first))->get(['starts_at', 'ends_at']);
            for ($day = $first; $day->lte($last); $day = $day->addDay()) {
                foreach ($this->daySlots($profile, $day) as [$start, $end]) {
                    if ($busy->contains(fn ($booking) => $start->lt($booking->ends_at) && $end->gt($booking->starts_at))) continue;
                    $slots[] = [
                        'seller_id' => (int) $profile->user_id, 'seller_name' => $profile->display_name,
                        'starts_at' => $start->toIso8601String(), 'ends_at' => $end->toIso8601String(), 'timezone' => $profile->timezone,
                    ];
                }
            }
        }
        usort($slots, fn ($a, $b) => [strtotime($a['starts_at']), $a['seller_id']] <=> [strtotime($b['starts_at']), $b['seller_id']);

        return array_slice($slots, 0, 1000);
    }

    /** The caller supplies a conversation already resolved from its authenticated channel/session. */
    public function book(OmnichannelConversation $conversation, array $data): SalesAppointment
    {
        $data = Validator::make($data, self::bookingRules())->validate();
        abort_unless($conversation->exists && $conversation->contact()->where('is_blocked', false)->exists(), 422, 'La conversación no está disponible para agendar.');
        $profile = $this->profile((int) $data['seller_id']);
        $start = CarbonImmutable::parse($data['starts_at'], $profile->timezone);
        $fingerprint = hash('sha256', json_encode([
            'seller_id' => (int) $data['seller_id'], 'starts_at' => $start->utc()->toIso8601String(),
            'customer_name' => trim($data['customer_name']), 'phone' => trim($data['phone']),
            'email' => $data['email'] ?? null, 'company' => $data['company'] ?? null,
            'interest' => trim($data['interest']), 'quantity' => isset($data['quantity']) ? (int) $data['quantity'] : null,
            'estimated_amount' => isset($data['estimated_amount']) ? number_format((float) $data['estimated_amount'], 2, '.', '') : null,
        ], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($conversation, $data, $start, $fingerprint) {
            // All booking and rescheduling paths serialize on this seller row, including empty calendars.
            $profile = $this->profile((int) $data['seller_id'], true);
            $existing = SalesAppointment::where('conversation_id', $conversation->id)->where('request_id', $data['request_id'])->first();
            if ($existing) {
                if (! hash_equals($existing->request_fingerprint, $fingerprint)) $this->invalid('request_id', 'Esta solicitud ya fue utilizada con otros datos.');
                return $existing;
            }
            $end = $this->assertAvailable($profile, $start);
            $appointment = SalesAppointment::create([
                ...collect($data)->except(['consent', 'starts_at'])->all(),
                'conversation_id' => $conversation->id, 'contact_id' => $conversation->contact_id,
                'request_fingerprint' => $fingerprint, 'starts_at' => $this->dbTime($start), 'ends_at' => $this->dbTime($end),
                'timezone' => $profile->timezone, 'status' => 'confirmed', 'consented_at' => now(),
            ]);
            $this->syncActivity($appointment, 'appointment_booked');

            return $appointment->fresh();
        }, 3);
    }

    public function update(SalesAppointment $appointment, array $data, Usuario $actor): SalesAppointment
    {
        $this->authorize($appointment, $actor);
        $data = Validator::make($data, [
            'status' => ['sometimes', Rule::in(SalesAppointment::STATUSES)],
            'starts_at' => ['sometimes', 'required', 'date'], 'seller_id' => ['sometimes', 'required', 'integer'],
            'consent' => ['sometimes', 'accepted'], 'notes' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'cancellation_reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ])->validate();
        abort_if(isset($data['seller_id']) && (int) $data['seller_id'] !== (int) $appointment->seller_id && ! $actor->esAdmin(), 403);

        return DB::transaction(function () use ($appointment, $data, $actor) {
            // Lock both sellers in a fixed order when moving an appointment to avoid opposing-transfer deadlocks.
            $sellerIds = array_unique([(int) $appointment->seller_id, (int) ($data['seller_id'] ?? $appointment->seller_id)]);
            sort($sellerIds);
            SalesAgentProfile::whereIn('user_id', $sellerIds)->orderBy('user_id')->lockForUpdate()->get();
            $locked = SalesAppointment::whereKey($appointment->id)->lockForUpdate()->firstOrFail();
            $this->authorize($locked, $actor);
            if (! in_array((int) $locked->seller_id, $sellerIds, true)) $this->invalid('seller_id', 'La cita cambió de vendedor; actualiza la agenda e inténtalo nuevamente.');
            $status = $data['status'] ?? $locked->status;
            $reschedule = isset($data['starts_at']) || isset($data['seller_id']) || ($status === 'confirmed' && $locked->status !== 'confirmed');
            if ($reschedule) {
                if (in_array($locked->status, ['completed', 'no_show'], true)) $this->invalid('status', 'La cita finalizada conserva su historial. Crea una nueva cita.');
                if ($status !== 'confirmed') $this->invalid('status', 'Reprograma la cita con estado confirmado.');
                if (! in_array($data['consent'] ?? false, [true, 1, '1', 'yes', 'on', 'true'], true)) $this->invalid('consent', 'Confirma el consentimiento del cliente para el nuevo horario.');
                $profile = $this->profile((int) ($data['seller_id'] ?? $locked->seller_id));
                $start = isset($data['starts_at']) ? CarbonImmutable::parse($data['starts_at'], $profile->timezone) : CarbonImmutable::instance($locked->starts_at);
                $end = $this->assertAvailable($profile, $start, (int) $locked->id);
                $locked->fill(['seller_id' => $profile->user_id, 'starts_at' => $this->dbTime($start), 'ends_at' => $this->dbTime($end), 'timezone' => $profile->timezone, 'consented_at' => now()]);
            } elseif ($status !== $locked->status && $locked->status !== 'confirmed') {
                $this->invalid('status', 'Solo una cita confirmada puede cerrarse o cancelarse.');
            }
            if (in_array($status, ['completed', 'no_show'], true) && $locked->starts_at->isFuture()) $this->invalid('status', 'La cita aún no ha comenzado.');
            $locked->fill(collect($data)->only(['notes', 'cancellation_reason'])->all());
            $locked->status = $status;
            if ($status !== 'cancelled') $locked->cancellation_reason = null;
            $locked->updated_by = $actor->id;
            $locked->save();
            $this->syncActivity($locked, $reschedule ? 'appointment_rescheduled' : 'appointment_updated', $actor->id);

            return $locked->fresh();
        }, 3);
    }

    public function authorize(SalesAppointment $appointment, Usuario $actor): void
    {
        abort_unless($actor->estado === 'activo' && $actor->tienePermiso('crm.gestionar')
            && ($actor->esAdmin() || (int) $appointment->seller_id === (int) $actor->id), 403);
    }

    public static function bookingRules(): array
    {
        return [
            'seller_id' => ['required', 'integer'], 'starts_at' => ['required', 'date'],
            'customer_name' => ['required', 'string', 'max:160'], 'phone' => ['required', 'string', 'regex:/^[0-9+().\s-]{7,30}$/'],
            'email' => ['nullable', 'email', 'max:255'], 'company' => ['nullable', 'string', 'max:180'],
            'interest' => ['required', 'string', 'max:2000'], 'quantity' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'estimated_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99'],
            'request_id' => ['required', 'uuid'], 'consent' => ['required', 'accepted'],
        ];
    }

    /** Reject malformed and overlapping intervals before saving schedules. */
    public function validateSchedule(array $weekly, array $exceptions): void
    {
        foreach ($weekly as $day => $ranges) {
            if (! in_array((string) $day, ['1', '2', '3', '4', '5', '6', '7'], true)) $this->invalid('weekly_schedule', 'Usa los días 1 (lunes) a 7 (domingo).');
            $this->validateRanges($ranges, 'weekly_schedule');
        }
        foreach ($exceptions as $date => $ranges) {
            Validator::make(['exceptions' => $date], ['exceptions' => ['date_format:Y-m-d']])->validate();
            $this->validateRanges($ranges, 'exceptions');
        }
    }

    private function validateRanges(mixed $ranges, string $field): void
    {
        if (! is_array($ranges) || count($ranges) > 6) $this->invalid($field, 'Indica hasta seis franjas por día. Una lista vacía significa ausencia.');
        $previousEnd = null;
        foreach ($ranges as $range) {
            if (! is_array($range)) $this->invalid($field, 'Cada franja requiere inicio y fin.');
            $valid = Validator::make($range, ['start' => ['required', 'date_format:H:i'], 'end' => ['required', 'date_format:H:i', 'after:start']]);
            if ($valid->fails()) $this->invalid($field, 'Revisa los horarios: formato HH:mm y fin posterior al inicio.');
            if ($previousEnd !== null && $range['start'] < $previousEnd) $this->invalid($field, 'Las franjas deben estar ordenadas y no superponerse.');
            $previousEnd = $range['end'];
        }
    }

    private function profile(int $sellerId, bool $lock = false): SalesAgentProfile
    {
        $query = SalesAgentProfile::where('user_id', $sellerId)->where('active', true)
            ->whereHas('user', fn ($q) => $q->where('estado', 'activo')->whereHas('roles', fn ($r) => $r->where('nombre', '!=', 'cliente')));
        $profile = ($lock ? $query->lockForUpdate() : $query)->first();
        if (! $profile) $this->invalid('seller_id', 'Selecciona un vendedor activo con agenda disponible.');

        return $profile;
    }

    private function daySlots(SalesAgentProfile $profile, CarbonImmutable $day): array
    {
        $today = CarbonImmutable::now($profile->timezone)->startOfDay();
        if ($day->lt($today) || $day->gte($today->addDays($profile->booking_days))) return [];
        $ranges = ($profile->exceptions ?? [])[$day->toDateString()] ?? ($profile->weekly_schedule ?? [])[(string) $day->isoWeekday()] ?? [];
        $minimum = CarbonImmutable::now($profile->timezone)->addMinutes($profile->notice_minutes);
        $slots = [];
        foreach ($ranges as $range) {
            $start = CarbonImmutable::parse($day->toDateString().' '.$range['start'], $profile->timezone);
            $limit = CarbonImmutable::parse($day->toDateString().' '.$range['end'], $profile->timezone);
            for (; $start->addMinutes($profile->slot_minutes)->lte($limit); $start = $start->addMinutes($profile->slot_minutes)) {
                if ($start->gte($minimum)) $slots[] = [$start, $start->addMinutes($profile->slot_minutes)];
            }
        }

        return $slots;
    }

    private function assertAvailable(SalesAgentProfile $profile, CarbonImmutable $start, ?int $ignoreId = null): CarbonImmutable
    {
        $end = null;
        foreach ($this->daySlots($profile, $start->setTimezone($profile->timezone)->startOfDay()) as [$candidate, $candidateEnd]) {
            if ($candidate->equalTo($start)) { $end = $candidateEnd; break; }
        }
        if (! $end) $this->invalid('starts_at', 'Este horario no está dentro de la disponibilidad del vendedor.');
        $conflict = SalesAppointment::where('seller_id', $profile->user_id)->where('status', 'confirmed')
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where('starts_at', '<', $this->dbTime($end))->where('ends_at', '>', $this->dbTime($start))->exists();
        if ($conflict) $this->invalid('starts_at', 'Otro cliente reservó este horario. Selecciona uno disponible.');

        return $end;
    }

    private function syncActivity(SalesAppointment $appointment, string $event, ?int $actorId = null): void
    {
        $activity = $appointment->activity;
        $deal = $activity ? CrmDeal::find($activity->deal_id) : CrmDeal::where('omnichannel_conversation_id', $appointment->conversation_id)->where('estado', 'open')->latest('id')->first();
        if (! $deal) return;
        $values = [
            'deal_id' => $deal->id, 'usuario_id' => $appointment->seller_id, 'tipo' => 'reunion',
            'contenido' => 'Cita #'.$appointment->id.' · '.$appointment->customer_name.' · '.$appointment->interest.' · '.$appointment->status,
            'fecha_vencimiento' => $appointment->starts_at, 'completada' => $appointment->status !== 'confirmed',
        ];
        if ($activity) $activity->update($values);
        else { $activity = CrmActivity::create($values); $appointment->update(['crm_activity_id' => $activity->id]); }
        CrmTimelineEvent::create([
            'trackable_type' => CrmDeal::class, 'trackable_id' => $deal->id, 'event_type' => $event,
            'descripcion' => 'Cita comercial #'.$appointment->id.': '.$appointment->status,
            'metadata' => ['appointment_id' => $appointment->id, 'seller_id' => $appointment->seller_id, 'starts_at' => $appointment->starts_at->toIso8601String()],
            'usuario_id' => $actorId,
        ]);
    }

    private function dbTime(CarbonImmutable $time): string
    {
        return $time->setTimezone(config('app.timezone', 'America/Lima'))->format('Y-m-d H:i:s');
    }

    private function invalid(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}

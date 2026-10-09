<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Variante;
use App\Services\Admin\Operations\PanelHealthService;
use App\Services\Orders\PaymentReconciliationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StorefrontOperationsController extends Controller
{
    public function index(PanelHealthService $health)
    {
        return inertia('Admin/Tienda/Operations', [
            'health' => $health->snapshot(),
            'dataQuality' => DB::table('data_quality_issues')->where('status', 'open')->orderBy('issue_key')->get()->map(fn ($issue) => ['key' => $issue->issue_key, 'count' => json_decode($issue->details, true)['count'] ?? 0, 'checked_at' => $issue->updated_at]),
            'catalogIssues' => DB::table('variante as v')->join('producto as p', 'p.id', '=', 'v.producto_id')->whereNull('v.deleted_at')->whereNull('p.deleted_at')
                ->where(fn ($q) => $q->whereNull('v.shipping_length_cm')->orWhereNull('v.shipping_width_cm')->orWhereNull('v.shipping_height_cm')->orWhereNull('p.descripcion')->orWhere('p.descripcion', '')->orWhereNull('p.garantias')->orWhere('p.garantias', ''))
                ->select('p.id', 'p.nombre', 'v.sku', 'p.descripcion', 'p.garantias', 'v.shipping_length_cm', 'v.shipping_width_cm', 'v.shipping_height_cm')->orderBy('v.id')->paginate(20, ['*'], 'catalog_page'),
            'readiness' => [
                'Pagos reales Niubiz' => config('services.niubiz.env') === 'production',
                'Correo externo' => ! in_array(config('mail.default'), ['log', 'array'], true),
                'Proveedor de comprobantes' => (bool) config('services.apiperu.url') && (bool) config('services.apiperu.token') && config('services.apiperu.token') !== 'SIMULACION_TOKEN',
                'Sede y horario de retiro' => count(\App\Services\Shipping\PickupService::options()) > 0,
                'Identificación y condiciones comerciales' => (bool) \App\Models\ConfiguracionSitio::obtener('business_identity') && (bool) \App\Models\ConfiguracionSitio::obtener('return_policy') && (bool) \App\Models\ConfiguracionSitio::obtener('delivery_eta'),
                'Configuración de producción' => app()->environment('production') && ! config('app.debug'),
            ],
            'notifications' => DB::table('order_notification_outbox')->where('status', '!=', 'sent')->orderByDesc('id')->paginate(20, ['*'], 'notifications_page'),
            'tasks' => DB::table('storefront_tasks')->where('status', '!=', 'sent')->where('status', '!=', 'skipped')->orderByDesc('id')->paginate(20, ['*'], 'tasks_page'),
            'payments' => DB::table('payment_reconciliations as p')->join('pedido as o', 'o.id', '=', 'p.pedido_id')
                ->whereIn('p.status', ['authorizing', 'approved', 'needs_review'])->orderByDesc('p.id')
                ->select('p.id', 'p.pedido_id', 'p.purchase_number', 'p.amount', 'p.status', 'p.created_at', 'o.codigo')->paginate(20, ['*'], 'payments_page'),
            'missingDimensions' => Variante::where('activo', true)->where(fn ($q) => $q->whereNull('shipping_length_cm')->orWhereNull('shipping_width_cm')->orWhereNull('shipping_height_cm')->orWhere('peso', '<=', 0))->count(),
        ]);
    }

    public function reconcile(Request $request, int $id, PaymentReconciliationService $service)
    {
        $data = $request->validate(['result' => 'required|in:approved,declined', 'amount' => 'required|numeric|min:0.01', 'currency' => 'required|in:PEN',
            'provider_reference' => 'required|string|max:128', 'evidence' => 'required|string|min:20|max:5000', 'verified' => 'required|accepted']);
        try {
            $service->resolve($id, $data, (int) auth('admin')->id());
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e;
        } catch (\Throwable $e) {
            report($e);
            return back()->with('error', 'La evidencia se conserva. No se pudo aplicar el pago; revisa stock y beneficios antes de reintentar.');
        }
        return back()->with('success', 'Resultado verificado registrado.');
    }

    public function resolveTask(Request $request, int $id)
    {
        $data = $request->validate(['result' => 'required|in:retry,delivered,skipped', 'evidence' => 'required|string|min:20|max:5000']);
        DB::transaction(function () use ($id, $data) {
            $task = DB::table('storefront_tasks')->where('id', $id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($task->status, ['blocked', 'needs_review'], true), 409, 'La tarea ya no requiere resolución.');
            $payload = json_decode($task->payload, true, flags: JSON_THROW_ON_ERROR);
            $payload['resolutions'][] = ['actor' => auth('admin')->id(), 'result' => $data['result'], 'evidence' => $data['evidence'], 'at' => now()->toIso8601String()];
            $newStatus = match ($data['result']) {
                'delivered' => 'sent',
                'skipped' => 'skipped',
                default => 'pending',
            };
            DB::table('storefront_tasks')->where('id', $id)->update(['payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                'status' => $newStatus, 'error' => null, 'available_at' => now(), 'updated_at' => now()]);
        });
        return back()->with('success', 'Resolución registrada. Los reintentos se procesan por la cola de tienda.');
    }

    public function resolveNotification(Request $request, int $id)
    {
        $data = $request->validate(['result' => 'required|in:retry,delivered', 'evidence' => 'required|string|min:20|max:5000']);
        DB::transaction(function () use ($id, $data) {
            $row = DB::table('order_notification_outbox')->where('id', $id)->lockForUpdate()->firstOrFail();
            abort_unless($row->status === 'failed', 409);
            $payload = json_decode($row->payload, true, flags: JSON_THROW_ON_ERROR);
            $payload['resolutions'][] = ['actor' => auth('admin')->id(), 'result' => $data['result'], 'evidence' => $data['evidence'], 'at' => now()->toIso8601String()];
            DB::table('order_notification_outbox')->where('id', $id)->update(['payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                'status' => $data['result'] === 'delivered' ? 'sent' : 'pending', 'error' => null, 'updated_at' => now()]);
        });
        return back()->with('success', 'Resolución de notificación registrada.');
    }
}

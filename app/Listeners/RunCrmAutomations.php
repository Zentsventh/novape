<?php

namespace App\Listeners;

use App\Events\CrmDealMoved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RunCrmAutomations
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(CrmDealMoved $event): void
    {
        $deal = $event->deal;
        $automations = \App\Models\CrmAutomation::where('activo', true)
                            ->where('trigger_type', 'deal_moved')
                            ->get();

        foreach ($automations as $auto) {
            $conditions = $auto->condiciones ?? [];
            // Check if automation requires entering a specific stage
            if (isset($conditions['stage_id']) && $deal->stage_id != $conditions['stage_id']) {
                continue; // Stage doesn't match condition
            }

            // Execute Actions
            foreach ($auto->acciones as $action) {
                if ($action['type'] === 'webhook') {
                    \Illuminate\Support\Facades\Http::post($action['url'], [
                        'event' => 'deal_moved',
                        'deal_id' => $deal->id,
                        'deal_title' => $deal->title,
                        'stage_id' => $deal->stage_id,
                        'value' => $deal->value,
                    ]);
                } elseif ($action['type'] === 'create_task') {
                    \App\Models\CrmActivity::create([
                        'deal_id' => $deal->id,
                        'type' => 'task',
                        'title' => 'Tarea automática: ' . ($action['message'] ?? 'Revisar deal'),
                        'description' => 'Generado por la automatización: ' . $auto->nombre,
                        'status' => 'pending',
                        'due_date' => now()->addDays(1),
                    ]);
                } elseif ($action['type'] === 'send_email') {
                    // Logic to send email to the deal contact
                    if ($deal->company && $deal->company->email) {
                        \Illuminate\Support\Facades\Mail::raw($action['message'], function($msg) use ($deal) {
                            $msg->to($deal->company->email)
                                ->subject('Actualización de tu oportunidad');
                        });
                    }
                }
            }
        }
    }
}

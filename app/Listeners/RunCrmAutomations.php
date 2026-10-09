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
        
        // Use the centralized Automation Engine Service
        \App\Services\Admin\Crm\AutomationEngineService::trigger('deal_moved', $deal, [
            'stage_id' => $deal->stage_id,
            'previous_stage_id' => $event->previousStageId ?? null,
        ]);
        
        // Si el deal se movió a una etapa que significa "Ganado" (por ejemplo stage_id = 4 o 5, asumiendo)
        // se podría disparar 'deal_won' si quisieras.
    }
}

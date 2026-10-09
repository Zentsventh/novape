<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait HasPolymorphicCleanup
{
    /**
     * Boot the trait to add the deleting event listener.
     */
    protected static function bootHasPolymorphicCleanup()
    {
        static::deleting(function ($model) {
            // Only proceed if it's a force delete or the model doesn't use SoftDeletes
            if (method_exists($model, 'isForceDeleting') && !$model->isForceDeleting()) {
                return;
            }

            $modelType = $model->getMorphClass();
            $modelId = $model->getKey();

            // 1. Limpiar logs de actividad polimórficos
            DB::table('actividad_logs')
                ->where('modelo', $modelType)
                ->where('modelo_id', $modelId)
                ->delete();

            // 2. Limpiar eventos de línea de tiempo del CRM
            DB::table('crm_timeline_events')
                ->where('trackable_type', $modelType)
                ->where('trackable_id', $modelId)
                ->delete();
        });
    }
}

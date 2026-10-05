<?php

namespace App\Jobs;

use App\Models\CrmCompany;
use App\Models\CrmDeal;
use App\Models\Usuario;
use App\Services\Admin\Crm\AutomationEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class RunCrmAutomationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public bool $deleteWhenMissingModels = true;

    public int $timeout = 60;

    public array $snapshot;

    public function __construct(public string $triggerType, public Model $model, public array $context = [])
    {
        if ($model instanceof CrmDeal) {
            $model->loadMissing('cliente', 'empresa');
        }
        $this->snapshot = $model->getAttributes();
        if ($model instanceof CrmDeal) {
            $this->snapshot['cliente'] = $model->cliente?->toArray();
            $this->snapshot['empresa'] = $model->empresa?->toArray();
        }
        $this->context['event_id'] ??= (string) Str::uuid();
    }

    public function handle(): void
    {
        $eventModel = $this->model->newInstance();
        $eventModel->setRawAttributes(Arr::except($this->snapshot, ['cliente', 'empresa']));
        $eventModel->exists = true;
        if ($eventModel instanceof CrmDeal) {
            $eventModel->setRelation('cliente', isset($this->snapshot['cliente']) ? new Usuario($this->snapshot['cliente']) : null);
            $eventModel->setRelation('empresa', isset($this->snapshot['empresa']) ? new CrmCompany($this->snapshot['empresa']) : null);
        }
        AutomationEngineService::run($this->triggerType, $eventModel, $this->context);
    }
}

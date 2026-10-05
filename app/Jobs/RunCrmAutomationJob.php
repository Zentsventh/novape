<?php

namespace App\Jobs;

use App\Services\Admin\Crm\AutomationEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;

class RunCrmAutomationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public bool $deleteWhenMissingModels = true;

    public function __construct(public string $triggerType, public Model $model, public array $context = []) {}

    public function handle(): void
    {
        AutomationEngineService::run($this->triggerType, $this->model, $this->context);
    }
}

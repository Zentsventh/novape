<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Engine\Nodes;

use App\Services\Chatbot\Engine\EngineState;
use App\Services\Chatbot\Tools\ToolInterface;

class ActionNode
{
    /** @var ToolInterface[] */
    private array $tools = [];

    public function registerTool(ToolInterface $tool): void
    {
        $this->tools[$tool->getName()] = $tool;
    }

    public function execute(EngineState $state): void
    {
        if (! $state->pendingToolCall) {
            return;
        }

        $parts = [];
        foreach ($state->pendingToolCalls ?: [$state->pendingToolCall] as $functionCall) {
            $functionName = $functionCall['name'];
            $args = $functionCall['args'] ?? [];

            if (! isset($this->tools[$functionName])) {
                $result = "Error: Herramienta '{$functionName}' no encontrada.";
            } else {
                $tool = $this->tools[$functionName];
                try {
                    $result = $tool->execute($args);
                } catch (\Exception $e) {
                    $result = 'No se pudo completar la consulta. Solicita ayuda de un asesor.';
                }
            }

            // Añadir el resultado de la función al historial
            $response = ['name' => $functionName, 'response' => ['result' => $result]];
            if (isset($functionCall['id'])) {
                $response['id'] = $functionCall['id'];
            }
            $parts[] = ['functionResponse' => $response];
        }
        $state->addMessage(['role' => 'user', 'parts' => $parts]);

        // Limpiar el estado de tool call pendiente
        $state->pendingToolCall = null;
        $state->pendingToolCalls = [];
    }
}

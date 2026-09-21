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
        if (!$state->pendingToolCall) {
            return;
        }

        $functionCall = $state->pendingToolCall;
        $functionName = $functionCall['name'];
        $args = $functionCall['args'] ?? [];

        if (!isset($this->tools[$functionName])) {
            $result = "Error: Herramienta '{$functionName}' no encontrada.";
        } else {
            $tool = $this->tools[$functionName];
            try {
                $result = $tool->execute($args);
            } catch (\Exception $e) {
                $result = "Error interno al ejecutar la herramienta: " . $e->getMessage();
            }
        }

        // Añadir el resultado de la función al historial
        $state->addMessage([
            'role' => 'user',
            'parts' => [
                [
                    'functionResponse' => [
                        'name' => $functionName,
                        'response' => ['result' => $result]
                    ]
                ]
            ]
        ]);

        // Limpiar el estado de tool call pendiente
        $state->pendingToolCall = null;
    }
}

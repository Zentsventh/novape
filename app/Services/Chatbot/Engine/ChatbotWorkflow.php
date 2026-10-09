<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Engine;

use App\Services\Chatbot\Engine\Nodes\AgentNode;
use App\Services\Chatbot\Engine\Nodes\ActionNode;

class ChatbotWorkflow
{
    private AgentNode $agentNode;
    private ActionNode $actionNode;

    public function __construct(AgentNode $agentNode, ActionNode $actionNode)
    {
        $this->agentNode = $agentNode;
        $this->actionNode = $actionNode;
    }

    public function run(EngineState $state): string
    {
        while ($state->iteration < $state->maxIterations) {
            $state->iteration++;

            // 1. Ejecutar AgentNode (LLM)
            $this->agentNode->execute($state);

            // Si hay error en la red o en la API, devolvemos el error inmediatamente
            if ($state->errorMessage) {
                return $state->errorMessage;
            }

            // 2. Si el LLM pide usar una tool, ejecutamos ActionNode y seguimos el bucle
            if ($state->pendingToolCall) {
                $this->actionNode->execute($state);
                continue;
            }

            // 3. Si el LLM dio una respuesta de texto, hemos terminado el flujo
            if ($state->finalResponse) {
                return $state->finalResponse;
            }
        }

        return "Lo siento, la operación tomó demasiado tiempo. Por favor intenta de nuevo.";
    }
}

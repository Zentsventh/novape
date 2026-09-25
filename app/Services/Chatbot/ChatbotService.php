<?php

declare(strict_types=1);

namespace App\Services\Chatbot;

use App\Services\Chatbot\Engine\ChatbotWorkflow;
use App\Services\Chatbot\Engine\EngineState;
use App\Services\Chatbot\Engine\Nodes\ActionNode;
use App\Services\Chatbot\Engine\Nodes\AgentNode;
use App\Services\Chatbot\Tools\OrderStatusTool;
use App\Services\Chatbot\Tools\ProductSearchTool;
use App\Services\Chatbot\Tools\UpdateContactInfoTool;
use App\Services\Chatbot\Tools\TransferToAgentTool;

class ChatbotService
{
    /**
     * @param array<int, array<string, string>> $userMessages
     * @param int|null $conversationId
     * @param int|null $contactId
     * @return string
     * @throws \Exception
     */
    public function getReply(array $userMessages, ?int $conversationId = null, ?int $contactId = null): string
    {
        $apiKeys = array_values(array_filter([
            env('GEMINI_API_KEY'),
            env('GEMINI_API_KEY_SECONDARY')
        ]));
        if (empty($apiKeys)) {
            throw new \Exception('API Key de Gemini no configurada en el servidor.');
        }

        // 1. Instanciar e inyectar dependencias (Tools)
        $actionNode = new ActionNode();
        
        $productSearchTool = new ProductSearchTool();
        $orderStatusTool = new OrderStatusTool();
        $updateContactTool = new UpdateContactInfoTool($conversationId, $contactId);
        $transferTool = new TransferToAgentTool($conversationId);
        
        $actionNode->registerTool($productSearchTool);
        $actionNode->registerTool($orderStatusTool);
        $actionNode->registerTool($updateContactTool);
        $actionNode->registerTool($transferTool);

        // 2. Construir el esquema de herramientas para pasárselo al AgentNode
        $toolsSchema = [
            [
                'name' => $productSearchTool->getName(),
                'description' => $productSearchTool->getDescription(),
                'parameters' => $productSearchTool->getParametersSchema()
            ],
            [
                'name' => $orderStatusTool->getName(),
                'description' => $orderStatusTool->getDescription(),
                'parameters' => $orderStatusTool->getParametersSchema()
            ],
            [
                'name' => $updateContactTool->getName(),
                'description' => $updateContactTool->getDescription(),
                'parameters' => $updateContactTool->getParametersSchema()
            ],
            [
                'name' => $transferTool->getName(),
                'description' => $transferTool->getDescription(),
                'parameters' => $transferTool->getParametersSchema()
            ]
        ];

        $systemPrompt = $this->buildSystemPrompt();

        // 3. Crear el AgentNode
        $agentNode = new AgentNode($apiKeys, $systemPrompt, $toolsSchema);

        // 4. Crear el Estado Inicial (formateando los mensajes de entrada)
        $initialMessages = $this->formatMessages($userMessages);
        $state = new EngineState($initialMessages, maxIterations: 4);

        // 5. Orquestar todo en el Motor de Flujos (Workflow)
        $workflow = new ChatbotWorkflow($agentNode, $actionNode);
        
        return $workflow->run($state);
    }

    private function buildSystemPrompt(): string
    {
        return "Eres Novabot, el asistente virtual experto, elegante y ultra-amigable de la tienda e-commerce 'Novape'.
Tu objetivo es ayudar a los clientes a comprar, informar sobre precios, stock, y rastrear sus pedidos.

REGLAS ESTRICTAS:
1. Responde siempre en un tono profesional, servicial y cálido.
2. TIENES HERRAMIENTAS (Tools): Úsalas siempre que el usuario pregunte por productos, precios o estados de pedidos. NUNCA inventes precios ni digas que no puedes buscar.
3. Si el usuario pregunta por un producto, usa la herramienta `buscar_productos`.
4. Si el usuario pregunta por el estado de su pedido, pídele el código (ej. PED-0001) y usa la herramienta `consultar_estado_pedido`.
5. Si el usuario te proporciona datos personales (nombre, DNI, celular, correo) o si identificaste el motivo principal por el cual escribe, DEBES usar la herramienta `actualizar_datos_cliente` para guardar la información.
6. Sé conciso y claro en tus respuestas de texto. Usa formato simple de viñetas si listas productos.
7. Si una herramienta no devuelve resultados, dile amablemente al cliente que no encontraste información.
8. Políticas: Envíos en 24-48h a todo el Perú. Devoluciones hasta 7 días por falla de fábrica. Pagos vía Yape, Plin y Tarjetas.";
    }

    /**
     * Formatea los mensajes del usuario para que cumplan con el esquema de la API de Google Gemini.
     * @param array<int, array<string, string>> $userMessages
     * @return array<int, array<string, mixed>>
     */
    private function formatMessages(array $userMessages): array
    {
        $contents = [];
        foreach ($userMessages as $msg) {
            $contents[] = [
                'role' => $msg['role'] === 'bot' ? 'model' : $msg['role'],
                'parts' => [['text' => $msg['text']]]
            ];
        }
        return $contents;
    }
}

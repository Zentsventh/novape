<?php

namespace App\Services\Omnichannel;

use App\Models\Omnichannel\OmnichannelConversation;

class ChatbotIntentService
{
    /**
     * Extrae la intención y entidades principales de un mensaje
     */
    public function parseMessage(string $message): array
    {
        $message = strtolower($message);
        
        $intent = 'unknown';
        $entities = [];

        // 1. Detectar intención de Hablar con humano
        if (preg_match('/(asesor|persona|humano|hablar con alguien|ayuda real|contacto)/i', $message)) {
            $intent = 'asesor_humano';
        }
        // 2. Detectar intención de Compra
        elseif (preg_match('/(comprar|precio|cuanto cuesta|quiero un|venden)/i', $message)) {
            $intent = 'compra';
            
            // Simular extracción de entidades básicas (ej. producto)
            if (preg_match('/(refrigeradora|televisor|celular|lavadora|laptop|samsung|lg|apple)/i', $message, $matches)) {
                $entities['producto'] = $matches[1];
            }
        }
        // 3. Detectar intención de Seguimiento de Pedido
        elseif (preg_match('/(pedido|rastrear|llega|estado|tracking|envio)/i', $message)) {
            $intent = 'seguimiento_pedido';
            
            if (preg_match('/#?([0-9]{4,8})/', $message, $matches)) {
                $entities['pedido_id'] = $matches[1];
            }
        }
        // 4. Detectar Reclamo / Problema
        elseif (preg_match('/(problema|roto|mal|devolver|reembolso|queja|reclamo|fallo)/i', $message)) {
            $intent = 'reclamo';
        }

        return [
            'intent' => $intent,
            'entities' => $entities
        ];
    }

    /**
     * Genera la respuesta o dispara la acción de transferencia según la intención
     */
    public function handleIntent(string $intent, array $entities, OmnichannelConversation $conversation): string
    {
        switch ($intent) {
            case 'asesor_humano':
            case 'reclamo':
                // Forzar derivación a humano con prioridad alta si es reclamo
                if ($intent === 'reclamo') {
                    $conversation->update(['priority' => 'high']);
                }
                
                app(TicketAssignmentService::class)->handoffToHuman($conversation);
                return "Entiendo. Te estoy transfiriendo con uno de nuestros asesores para que te ayude con esto. Por favor, espera un momento.";

            case 'compra':
                if (isset($entities['producto'])) {
                    return "¡Claro! Veo que estás interesado en {$entities['producto']}. ¿Buscas alguna marca en particular o te muestro nuestras mejores ofertas?";
                }
                return "¡Genial! ¿Qué tipo de producto estás buscando?";

            case 'seguimiento_pedido':
                if (isset($entities['pedido_id'])) {
                    // Aquí iría la lógica de buscar en BD
                    return "Voy a revisar el estado de tu pedido #{$entities['pedido_id']}... ¡Dame un segundo!";
                }
                return "Por favor, indícame tu número de pedido para poder rastrearlo.";

            default:
                return "No estoy seguro de entender a qué te refieres. Puedes decir 'Quiero comprar', 'Consultar mi pedido', o 'Hablar con un asesor'.";
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Tools;

use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use Illuminate\Support\Facades\Log;

class UpdateContactInfoTool implements ToolInterface
{
    public function __construct(
        private ?int $conversationId = null,
        private ?int $contactId = null
    ) {}

    public function getName(): string
    {
        return 'actualizar_datos_cliente';
    }

    public function getDescription(): string
    {
        return 'Actualiza o guarda información del cliente (nombre, celular, dni, correo) y el motivo general de su consulta en la base de datos CRM. Llámala cuando tengas datos clave o hayas identificado por qué escribe.';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'OBJECT',
            'properties' => [
                'nombres' => ['type' => 'STRING', 'description' => 'Nombre y/o apellidos del cliente'],
                'celular' => ['type' => 'STRING', 'description' => 'Número de celular o teléfono'],
                'dni' => ['type' => 'STRING', 'description' => 'Número de DNI u otro documento'],
                'correo' => ['type' => 'STRING', 'description' => 'Correo electrónico'],
                'codigo_pedido' => ['type' => 'STRING', 'description' => 'El código de pedido por el que pregunta'],
                'motivo_general' => ['type' => 'STRING', 'description' => 'Resumen ultra corto (1-3 palabras) del motivo (Ej: "Estado de pedido", "Reclamo", "Consulta de stock")']
            ]
        ];
    }

    public function execute(array $args): mixed
    {
        try {
            if ($this->contactId) {
                $contact = OmnichannelContact::find($this->contactId);
                if ($contact) {
                    if (!empty($args['nombres'])) {
                        $contact->name = $args['nombres'];
                    }
                    if (!empty($args['celular'])) {
                        $contact->phone_number = $args['celular'];
                    }
                    if (!empty($args['correo'])) {
                        $contact->email = $args['correo'];
                    }
                    
                    if (!empty($args['dni'])) {
                        $meta = $contact->metadata ?? [];
                        $meta['dni'] = $args['dni'];
                        $contact->metadata = $meta;
                    }
                    
                    $contact->save();
                }
            }

            if ($this->conversationId) {
                $conversation = OmnichannelConversation::find($this->conversationId);
                if ($conversation) {
                    $subjectParts = [];
                    if (!empty($args['motivo_general'])) {
                        $subjectParts[] = $args['motivo_general'];
                    }
                    if (!empty($args['codigo_pedido'])) {
                        $subjectParts[] = 'Pedido: ' . $args['codigo_pedido'];
                    }
                    
                    if (!empty($subjectParts)) {
                        $conversation->subject = implode(' | ', $subjectParts);
                        $conversation->save();
                    }
                }
            }
            
            return ['success' => true, 'message' => 'Datos actualizados en el CRM. Continúa la conversación.'];
        } catch (\Exception $e) {
            Log::error('Error en UpdateContactInfoTool: ' . $e->getMessage());
            return ['error' => 'No se pudo guardar la información, pero puedes continuar charlando.'];
        }
    }
}

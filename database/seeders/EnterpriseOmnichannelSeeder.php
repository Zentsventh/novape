<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\CrmCase;
use App\Models\Usuario;
use Illuminate\Support\Str;

class EnterpriseOmnichannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Asegurar que haya administradores/staff
        $agentes = Usuario::whereHas('roles', function ($query) {
            $query->whereIn('rol.id', [1, 2]); // Admin o Staff
        })->get();

        if ($agentes->isEmpty()) {
            $agente = Usuario::first();
            if (!$agente) {
                $this->command->warn('No hay usuarios para asignar. Saltando EnterpriseOmnichannelSeeder.');
                return;
            }
            $agentes->push($agente);
        }

        // 2. Crear 10 Conversaciones simulando transferencia a humano
        for ($i = 1; $i <= 10; $i++) {
            $agente = $agentes->random();

            // Contacto
            $contact = OmnichannelContact::create([
                'phone_number' => '+51999' . str_pad((string)rand(10000, 99999), 5, '0', STR_PAD_LEFT),
                'name' => 'Cliente Prueba ' . rand(100, 999),
                'first_interaction_at' => now()->subDays(rand(1, 10)),
                'last_interaction_at' => now(),
            ]);

            // Conversación (Transferida)
            $conversation = OmnichannelConversation::create([
                'contact_id' => $contact->id,
                'channel' => 'web',
                'status' => 'human_active',
                'is_bot_paused' => true,
                'bot_paused_at' => now()->subMinutes(rand(5, 120)),
                'assigned_user_id' => $agente->id,
                'message_count' => 4,
                'last_message_preview' => 'Necesito hablar con un asesor urgente, mi pedido no llega.',
                'last_message_at' => now(),
            ]);

            // Mensajes (Simulación de flujo)
            OmnichannelMessage::insert([
                [
                    'conversation_id' => $conversation->id,
                    'contact_id' => $contact->id,
                    'channel' => 'web',
                    'direction' => 'inbound',
                    'message_type' => 'text',
                    'content' => 'Hola, tengo un problema',
                    'is_ai_generated' => false,
                    'status' => 'read',
                    'created_at' => now()->subMinutes(15),
                    'updated_at' => now()->subMinutes(15),
                ],
                [
                    'conversation_id' => $conversation->id,
                    'contact_id' => $contact->id,
                    'channel' => 'web',
                    'direction' => 'outbound',
                    'message_type' => 'text',
                    'content' => 'Hola, soy Novabot. ¿En qué te ayudo hoy?',
                    'is_ai_generated' => true,
                    'status' => 'sent',
                    'created_at' => now()->subMinutes(14),
                    'updated_at' => now()->subMinutes(14),
                ],
                [
                    'conversation_id' => $conversation->id,
                    'contact_id' => $contact->id,
                    'channel' => 'web',
                    'direction' => 'inbound',
                    'message_type' => 'text',
                    'content' => 'Necesito hablar con un asesor urgente, mi pedido no llega.',
                    'is_ai_generated' => false,
                    'status' => 'read',
                    'created_at' => now()->subMinutes(10),
                    'updated_at' => now()->subMinutes(10),
                ]
            ]);

            // 3. Crear el Ticket (CrmCase) asociado
            CrmCase::create([
                'titulo' => "Problema con pedido - Contacto {$contact->phone_number}",
                'descripcion' => 'Transferido automáticamente por chatbot: "Necesito hablar con un asesor urgente, mi pedido no llega."',
                'tipo' => 'reclamo',
                'estado' => rand(0, 1) ? 'abierto' : 'en_progreso',
                'prioridad' => 'alta',
                'asignado_a' => $agente->id,
                'created_at' => $conversation->bot_paused_at,
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Enterprise Omnichannel Seeder completado. Se generaron 10 tickets/casos asíncronos.');
    }
}

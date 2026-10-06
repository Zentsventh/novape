<?php

namespace App\Console\Commands;

use App\Services\Chatbot\ChatbotService;
use App\Services\Chatbot\ChatbotSettings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChatbotHealth extends Command
{
    protected $signature = 'chatbot:health {--live : Probar una respuesta real de Gemini (consume cuota)} {--embeddings : Probar el índice semántico (consume cuota)}';

    protected $description = 'Comprueba tablas, configuración e indexación del chatbot sin mostrar credenciales';

    public function handle(ChatbotSettings $settings, ChatbotService $chatbot): int
    {
        foreach (['chatbot_settings', 'chatbot_knowledge_sources', 'chatbot_knowledge_chunks', 'jobs'] as $table) {
            if (! Schema::hasTable($table)) {
                $this->error('Falta la tabla '.$table.'. Ejecuta las migraciones.');

                return self::FAILURE;
            }
        }
        $config = $settings->get();
        $configured = (bool) (config('services.gemini.key') || config('services.gemini.secondary_key'));
        $this->table(['Comprobación', 'Estado'], [
            ['API de Gemini', $configured ? 'Clave configurada' : 'Falta clave'],
            ['Modelo', $config['model']],
            ['Búsqueda semántica', $config['semantic_search'] ? 'Activa' : 'Desactivada'],
            ['Fuentes activas', DB::table('chatbot_knowledge_sources')->where('enabled', true)->count()],
            ['Indexaciones pendientes', DB::table('chatbot_knowledge_sources')->whereIn('index_status', ['pending', 'processing'])->count()],
            ['Indexaciones con error', DB::table('chatbot_knowledge_sources')->where('index_status', 'failed')->count()],
        ]);
        if (! $configured) {
            return self::FAILURE;
        }
        if ($this->option('live')) {
            $reply = $chatbot->getReply([['role' => 'user', 'text' => 'Saluda brevemente al cliente en español.']], sandbox: true);
            $this->line($reply);
            if ($reply === $config['fallback']) {
                return self::FAILURE;
            }
        }
        if ($this->option('embeddings')) {
            try {
                $vector = app(\App\Services\Chatbot\EmbeddingService::class)->embed('Información de atención al cliente.', true);
                $this->info('Embeddings: '.count($vector).' dimensiones verificadas.');
            } catch (\Throwable $e) {
                $this->error('No se pudo comprobar el índice semántico. Revisa conexión, certificados y cuota.');
                return self::FAILURE;
            }
        }

        return self::SUCCESS;
    }
}

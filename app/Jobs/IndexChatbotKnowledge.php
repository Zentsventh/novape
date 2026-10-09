<?php

namespace App\Jobs;

use App\Services\Chatbot\EmbeddingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class IndexChatbotKnowledge implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 900;

    public function __construct(public int $sourceId, public int $version) {}

    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function handle(EmbeddingService $embeddings): void
    {
        $source = DB::table('chatbot_knowledge_sources')->where('id', $this->sourceId)->where('version', $this->version)->first();
        if (! $source) {
            return;
        }
        $scope = fn () => DB::table('chatbot_knowledge_sources')->where('id', $this->sourceId)->where('version', $this->version);
        $scope()->update(['index_status' => 'processing', 'index_error' => null]);
        try {
            foreach (DB::table('chatbot_knowledge_chunks')->where('source_id', $this->sourceId)->orderBy('id')->get() as $chunk) {
                if (! $scope()->exists()) {
                    return;
                }
                if ($chunk->embedding && $chunk->embedding_model === config('chatbot.embedding_model')) {
                    continue;
                }
                $vector = $embeddings->embed($chunk->content, false, $source->title);
                DB::table('chatbot_knowledge_chunks')->where('id', $chunk->id)->update([
                    'embedding' => json_encode($vector, JSON_THROW_ON_ERROR), 'embedding_model' => config('chatbot.embedding_model'),
                ]);
            }
            $scope()->update(['index_status' => 'ready', 'indexed_at' => now(), 'index_error' => null]);
        } catch (\Throwable $e) {
            $scope()->update(['index_status' => 'failed', 'index_error' => 'La indexación no pudo completarse. Reintenta o revisa la conexión y la cuota del proveedor.']);
            throw $e;
        }
    }
}

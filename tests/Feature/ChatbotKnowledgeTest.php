<?php

namespace Tests\Feature;

use App\Jobs\IndexChatbotKnowledge;
use App\Models\Usuario;
use App\Services\Chatbot\ChatbotService;
use App\Services\Chatbot\ChatbotSettings;
use App\Services\Chatbot\EmbeddingService;
use App\Services\Chatbot\KnowledgeService;
use Dompdf\Dompdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use ZipArchive;

class ChatbotKnowledgeTest extends TestCase
{
    use RefreshDatabase;

    private function worker(string $role = 'admin'): Usuario
    {
        $user = Usuario::factory()->create();
        $id = DB::table('rol')->where('nombre', $role)->value('id') ?? DB::table('rol')->insertGetId(['nombre' => $role]);
        DB::table('usuario_rol')->insert(['usuario_id' => $user->id, 'rol_id' => $id]);

        return $user;
    }

    public function test_knowledge_requires_active_authorized_staff(): void
    {
        $this->getJson('/admin/api/chatbot-knowledge')->assertUnauthorized();
        $this->actingAs($this->worker('asesor'), 'admin')->postJson('/admin/api/chatbot-knowledge', [])->assertForbidden();
        $admin = $this->worker();
        $admin->update(['estado' => 'inactivo']);
        $this->actingAs($admin, 'admin')->getJson('/admin/api/chatbot-knowledge')->assertForbidden();
    }

    public function test_text_drafts_activation_edit_and_delete_change_retrieval(): void
    {
        $this->actingAs($this->worker(), 'admin');
        $data = ['title' => 'Garantías Novape', 'content' => 'La garantía de refrigeradoras cubre fallas de fabricación durante doce meses.', 'enabled' => false];
        $id = $this->postJson('/admin/api/chatbot-knowledge', $data)->assertCreated()->json('id');
        $this->postJson('/admin/api/chatbot-knowledge/preview', ['question' => 'garantia refrigeradoras'])->assertOk()->assertJsonCount(0, 'sources');
        $this->putJson('/admin/api/chatbot-knowledge/'.$id, array_replace($data, ['enabled' => true]))->assertOk();
        $this->postJson('/admin/api/chatbot-knowledge/preview', ['question' => 'garantia refrigeradoras'])->assertOk()->assertJsonPath('sources.0.source_id', $id);
        $this->putJson('/admin/api/chatbot-knowledge/'.$id, array_replace($data, ['enabled' => true, 'title' => 'Entregas', 'content' => 'Los envíos se coordinan con el cliente antes de despachar a su domicilio.']))->assertOk();
        $this->postJson('/admin/api/chatbot-knowledge/preview', ['question' => 'refrigeradoras'])->assertJsonCount(0, 'sources');
        $this->deleteJson('/admin/api/chatbot-knowledge/'.$id)->assertNoContent();
        $this->assertDatabaseCount('chatbot_knowledge_chunks', 0);
    }

    public function test_plain_text_document_is_extracted_and_reviewable(): void
    {
        $this->actingAs($this->worker(), 'admin');
        $id = $this->post('/admin/api/chatbot-knowledge', ['title' => 'Entregas', 'enabled' => '0', 'file' => UploadedFile::fake()->createWithContent('entregas.txt', 'Coordinamos las entregas en Lima de lunes a viernes con cita previa.')], ['Accept' => 'application/json'])->assertCreated()->json('id');
        $this->getJson('/admin/api/chatbot-knowledge/'.$id)->assertOk()->assertJsonPath('type', 'txt')->assertJsonPath('enabled', 0)->assertJsonPath('content', 'Coordinamos las entregas en Lima de lunes a viernes con cita previa.');
    }

    public function test_docx_paragraphs_are_extracted(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'knowledge');
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
        $zip->addFromString('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Garantía de doce meses para refrigeradoras.</w:t></w:r></w:p></w:body></w:document>');
        $zip->close();
        try {
            $this->actingAs($this->worker(), 'admin')->post('/admin/api/chatbot-knowledge', ['title' => 'Manual', 'enabled' => '0', 'file' => new UploadedFile($path, 'manual.docx', null, null, true)], ['Accept' => 'application/json'])->assertCreated();
            $this->assertDatabaseHas('chatbot_knowledge_sources', ['content' => 'Garantía de doce meses para refrigeradoras.']);
        } finally {
            @unlink($path);
        }
    }

    public function test_invalid_documents_and_empty_text_are_rejected(): void
    {
        $this->actingAs($this->worker(), 'admin');
        foreach (['archivo.php', 'archivo.pdf', 'archivo.docx', 'archivo.txt'] as $name) {
            $this->post('/admin/api/chatbot-knowledge', ['title' => 'Archivo', 'enabled' => '0', 'file' => UploadedFile::fake()->createWithContent($name, 'invalid')], ['Accept' => 'application/json'])->assertUnprocessable();
        }
        $this->postJson('/admin/api/chatbot-knowledge', ['title' => 'Vacío', 'content' => str_repeat(' ', 30), 'enabled' => true])->assertUnprocessable();
        $this->assertDatabaseCount('chatbot_knowledge_sources', 0);
    }

    public function test_pdf_text_is_extracted(): void
    {
        $pdf = new Dompdf;
        $pdf->loadHtml('<p>La garantia cubre fallas de fabrica durante doce meses.</p>');
        $pdf->render();
        $this->actingAs($this->worker(), 'admin')->post('/admin/api/chatbot-knowledge', ['title' => 'Garantía', 'enabled' => '0', 'file' => UploadedFile::fake()->createWithContent('manual.pdf', $pdf->output())], ['Accept' => 'application/json'])->assertCreated();
        $this->assertStringContainsString('doce meses', DB::table('chatbot_knowledge_sources')->value('content'));
    }

    public function test_gemini_receives_only_relevant_active_sources_and_no_fixed_policies(): void
    {
        $knowledge = app(KnowledgeService::class);
        $knowledge->save('Garantía oficial', 'La garantía de refrigeradoras cubre doce meses de fallas de fabricación.', 'text', true);
        $knowledge->save('Borrador secreto', 'La garantía borrador secreto cubre cinco años para refrigeradoras.', 'text', false);
        config(['services.gemini.key' => 'test-key', 'services.gemini.secondary_key' => null]);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => 'Según Garantía oficial, cubre doce meses.']]]]]])]);
        $reply = app(ChatbotService::class)->getReply([['role' => 'user', 'text' => '¿Cuál es la garantía de refrigeradoras?']]);
        $this->assertStringContainsString('doce meses', $reply);
        Http::assertSent(function ($request) {
            $prompt = $request['systemInstruction']['parts'][0]['text'];

            return str_contains($prompt, 'Garantía oficial') && ! str_contains($prompt, 'Borrador secreto') && ! str_contains($prompt, '24-48h');
        });
    }

    public function test_large_document_retrieval_has_bounded_context(): void
    {
        app(KnowledgeService::class)->save('Garantía', str_repeat('Garantía para refrigeradoras y electrodomésticos. ', 1500), 'text', true);
        $sources = app(KnowledgeService::class)->search('garantia refrigeradoras');
        $this->assertCount(6, $sources);
        foreach ($sources as $source) {
            $this->assertLessThanOrEqual(1200, mb_strlen($source['content']));
        }
        $this->assertSame([], app(KnowledgeService::class)->search('zzzzzz'));
    }

    public function test_settings_are_validated_persisted_and_do_not_expose_keys(): void
    {
        config(['services.gemini.key' => 'private-key']);
        $this->actingAs($this->worker(), 'admin');
        $this->getJson('/admin/api/chatbot-knowledge/settings')->assertOk()->assertJsonPath('configured', true)->assertDontSee('private-key');
        $data = ['model' => 'gemini-2.5-flash', 'temperature' => 0.2, 'max_output_tokens' => 1200, 'instructions' => 'Habla en español.', 'fallback' => 'Solicita un asesor.', 'semantic_search' => false];
        $this->putJson('/admin/api/chatbot-knowledge/settings', $data)->assertOk()->assertJsonPath('settings.instructions', 'Habla en español.');
        $this->getJson('/admin/api/chatbot-knowledge/settings')->assertJsonPath('settings.temperature', 0.2);
        $this->putJson('/admin/api/chatbot-knowledge/settings', array_replace($data, ['model' => '../secret']))->assertUnprocessable();
    }

    public function test_indexing_is_queued_and_stale_jobs_cannot_index_new_content(): void
    {
        Queue::fake();
        app(ChatbotSettings::class)->save(['semantic_search' => true]);
        $service = app(KnowledgeService::class);
        $id = $service->save('Garantía', 'La garantía cubre defectos de fabricación en los equipos.', 'text', true);
        Queue::assertPushed(IndexChatbotKnowledge::class, fn ($job) => $job->sourceId === $id && $job->version === 1);
        $service->save('Garantía', 'La nueva política permite solicitar atención en nuestra tienda.', 'text', true, $id);
        Http::fake();
        (new IndexChatbotKnowledge($id, 1))->handle(app(EmbeddingService::class));
        Http::assertNothingSent();
        $this->assertDatabaseHas('chatbot_knowledge_sources', ['id' => $id, 'version' => 2, 'index_status' => 'pending']);
    }

    public function test_semantic_search_finds_related_content_without_matching_words_and_excludes_drafts(): void
    {
        $knowledge = app(KnowledgeService::class);
        $id = $knowledge->save('Protección de equipos', 'Cubrimos desperfectos técnicos de origen durante doce meses.', 'text', true);
        $draft = $knowledge->save('Secreto', 'Información interna para empleados exclusivamente.', 'text', false);
        $vector = array_fill(0, 768, 0);
        $vector[0] = 1;
        DB::table('chatbot_knowledge_chunks')->update(['embedding' => json_encode($vector), 'embedding_model' => 'gemini-embedding-001']);
        DB::table('chatbot_knowledge_sources')->whereIn('id', [$id, $draft])->update(['index_status' => 'ready']);
        app(ChatbotSettings::class)->save(['semantic_search' => true]);
        config(['services.gemini.key' => 'fake']);
        Http::fake(['*' => Http::response(['embedding' => ['values' => $vector]])]);
        $results = $knowledge->search('garantía refrigeradora');
        $this->assertCount(1, $results);
        $this->assertSame($id, $results[0]['source_id']);
        $this->assertSame('semantic', $results[0]['method']);
        Http::fake(['*' => Http::response([], 429)]);
        $this->assertNotEmpty($knowledge->search('desperfectos'));
    }

    public function test_parallel_tool_calls_preserve_signatures_and_all_results(): void
    {
        config(['services.gemini.key' => 'fake', 'services.gemini.secondary_key' => null]);
        $parts = [['functionCall' => ['name' => 'buscar_productos', 'args' => ['query' => 'zzzzzz']], 'thoughtSignature' => 'signature'],
            ['functionCall' => ['name' => 'actualizar_datos_cliente', 'args' => ['nombre' => 'Prueba']]]];
        Http::fake(['*' => Http::sequence()->push(['candidates' => [['content' => ['role' => 'model', 'parts' => $parts]]]])
            ->push(['candidates' => [['content' => ['parts' => [['text' => 'Respuesta verificada.']]]]]])]);
        $reply = app(ChatbotService::class)->getReply([['role' => 'user', 'text' => 'Busco un equipo.']], sandbox: true);
        $this->assertSame('Respuesta verificada.', $reply);
        Http::assertSent(fn ($request) => isset($request['contents'][1]['parts'][0]['thoughtSignature']) && count($request['contents'][2]['parts']) === 2
            && str_contains(json_encode($request['contents'][2]), 'no encontrada'));
        $this->assertDatabaseCount('omnichannel_contacts', 0);
    }

    public function test_simulator_requires_configuration_and_runs_without_creating_conversations(): void
    {
        $this->actingAs($this->worker(), 'admin');
        config(['services.gemini.key' => null, 'services.gemini.secondary_key' => null]);
        $body = ['messages' => [['role' => 'user', 'text' => 'Hola']]];
        $this->postJson('/admin/api/chatbot-knowledge/test', $body)->assertStatus(503);
        config(['services.gemini.key' => 'fake']);
        Http::fake(['*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => 'Bienvenido a Novape.']]]]]])]);
        $this->postJson('/admin/api/chatbot-knowledge/test', $body)->assertOk()->assertJsonPath('reply', 'Bienvenido a Novape.');
        $this->assertDatabaseCount('omnichannel_conversations', 0);
    }
}

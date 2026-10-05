<?php

namespace Tests\Feature;

use App\Models\Usuario;
use App\Services\Chatbot\ChatbotService;
use App\Services\Chatbot\KnowledgeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
        $zip->addFromString('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Garantía de doce meses para refrigeradoras.</w:t></w:r></w:p></w:body></w:document>');
        $zip->close();
        try {
            $this->actingAs($this->worker(), 'admin')->post('/admin/api/chatbot-knowledge', ['title' => 'Manual', 'enabled' => '0', 'file' => new UploadedFile($path, 'manual.docx', null, null, true)], ['Accept' => 'application/json'])->assertCreated();
            $this->assertDatabaseHas('chatbot_knowledge_sources', ['content' => 'Garantía de doce meses para refrigeradoras.']);
        } finally { @unlink($path); }
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
        $pdf = new \Dompdf\Dompdf;
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
        foreach ($sources as $source) $this->assertLessThanOrEqual(1200, mb_strlen($source['content']));
        $this->assertSame([], app(KnowledgeService::class)->search('zzzzzz'));
    }
}

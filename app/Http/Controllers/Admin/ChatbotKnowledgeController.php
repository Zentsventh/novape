<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Chatbot\ChatbotService;
use App\Services\Chatbot\ChatbotSettings;
use App\Services\Chatbot\KnowledgeDocumentReader;
use App\Services\Chatbot\KnowledgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChatbotKnowledgeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/AI/Knowledge');
    }

    public function sources()
    {
        return response()->json(DB::table('chatbot_knowledge_sources')->select(['id', 'title', 'type', 'enabled', 'version', 'index_status', 'index_error', 'indexed_at', 'updated_at'])->orderByDesc('id')->paginate(20));
    }

    public function show(int $id)
    {
        $source = DB::table('chatbot_knowledge_sources')->find($id);
        abort_unless($source, 404);

        return response()->json($source);
    }

    public function store(Request $request, KnowledgeService $knowledge, KnowledgeDocumentReader $reader)
    {
        // Some Windows MIME databases identify valid DOCX packages as ZIP.
        // ZIP is allowed only for .docx, whose XML structure is checked by the reader.
        $mimeRule = strtolower($request->file('file')?->getClientOriginalExtension() ?? '') === 'docx' ? 'mimes:docx,zip' : 'mimes:pdf,txt,md';
        $data = $request->validate(['title' => 'required|string|max:160', 'content' => 'required_without:file|nullable|string|max:200000', 'enabled' => 'required|boolean', 'file' => 'nullable|file|max:5120|extensions:pdf,docx,txt,md|'.$mimeRule]);
        $file = $request->file('file');
        $content = $file ? $reader->read($file) : ($data['content'] ?? '');
        $id = $knowledge->save($data['title'], $content, $file ? strtolower($file->getClientOriginalExtension()) : 'text', (bool) $data['enabled']);

        return response()->json(['id' => $id], 201);
    }

    public function update(Request $request, int $id, KnowledgeService $knowledge)
    {
        $data = $request->validate(['title' => 'required|string|max:160', 'content' => 'required|string|min:20|max:200000', 'enabled' => 'required|boolean']);
        $source = DB::table('chatbot_knowledge_sources')->find($id);
        abort_unless($source, 404);
        $knowledge->save($data['title'], $data['content'], data_get($source, 'type'), (bool) $data['enabled'], $id);

        return response()->json(['id' => $id]);
    }

    public function destroy(int $id)
    {
        abort_unless(DB::table('chatbot_knowledge_sources')->where('id', $id)->delete(), 404);

        return response()->noContent();
    }

    public function preview(Request $request, KnowledgeService $knowledge)
    {
        $data = $request->validate(['question' => 'required|string|max:4000']);

        return response()->json(['sources' => $knowledge->search($data['question'], false)]);
    }

    public function settings(ChatbotSettings $settings)
    {
        return response()->json(['settings' => $settings->get(), 'configured' => (bool) (config('services.gemini.key') || config('services.gemini.secondary_key')),
            'queue' => 'chatbot', 'active_sources' => DB::table('chatbot_knowledge_sources')->where('enabled', true)->count()]);
    }

    public function updateSettings(Request $request, ChatbotSettings $settings)
    {
        $data = $request->validate([
            'model' => ['required', 'string', 'max:100', 'regex:/^gemini-[a-zA-Z0-9.\-]+$/'],
            'temperature' => 'required|numeric|between:0,1', 'max_output_tokens' => 'required|integer|between:256,4096',
            'instructions' => 'nullable|string|max:8000', 'fallback' => 'required|string|max:500', 'semantic_search' => 'required|boolean',
        ]);
        $data['instructions'] = $data['instructions'] ?? '';
        $settings->save($data);

        return response()->json(['settings' => $settings->get()]);
    }

    public function reindex(int $id, KnowledgeService $knowledge)
    {
        $knowledge->index($id);

        return response()->json(['message' => 'Indexación solicitada.'], 202);
    }

    public function testReply(Request $request, ChatbotService $chatbot, KnowledgeService $knowledge)
    {
        $data = $request->validate(['messages' => 'required|array|min:1|max:20', 'messages.*.role' => 'required|in:user,bot', 'messages.*.text' => 'required|string|max:4000']);
        abort_unless(end($data['messages'])['role'] === 'user', 422, 'La conversación debe terminar con una pregunta.');
        if (! config('services.gemini.key') && ! config('services.gemini.secondary_key')) {
            return response()->json(['message' => 'Configura GEMINI_API_KEY en el servidor para probar la IA.'], 503);
        }
        $question = end($data['messages'])['text'];
        $started = microtime(true);

        return response()->json(['reply' => $chatbot->getReply($data['messages'], sandbox: true),
            'sources' => $knowledge->search($question, false), 'duration_ms' => (int) ((microtime(true) - $started) * 1000)]);
    }
}

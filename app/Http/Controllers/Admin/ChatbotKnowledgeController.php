<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
        return response()->json(DB::table('chatbot_knowledge_sources')->select(['id', 'title', 'type', 'enabled', 'updated_at'])->orderByDesc('id')->paginate(20));
    }

    public function show(int $id)
    {
        $source = DB::table('chatbot_knowledge_sources')->find($id);
        abort_unless($source, 404);
        return response()->json($source);
    }

    public function store(Request $request, KnowledgeService $knowledge, KnowledgeDocumentReader $reader)
    {
        $data = $request->validate(['title' => 'required|string|max:160', 'content' => 'required_without:file|nullable|string|max:200000', 'enabled' => 'required|boolean', 'file' => 'nullable|file|max:5120|extensions:pdf,docx,txt,md|mimes:pdf,docx,txt,md']);
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
        $knowledge->save($data['title'], $data['content'], $source->type, (bool) $data['enabled'], $id);
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
        return response()->json(['sources' => $knowledge->search($data['question'])]);
    }
}

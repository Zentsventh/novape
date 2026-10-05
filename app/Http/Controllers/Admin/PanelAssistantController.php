<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\PanelAssistantService;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PanelAssistantController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Assistant/Index');
    }

    public function sessions()
    {
        return response()->json(DB::table('panel_assistant_sessions')->where('user_id', auth('admin')->id())->orderByDesc('updated_at')->limit(30)->get());
    }

    public function history(int $session)
    {
        $this->owned($session);

        return response()->json(DB::table('panel_assistant_messages')->where('session_id', $session)->orderByDesc('id')->limit(50)->get()->reverse()->values()->map(function ($message) {
            $meta = json_decode($message->metadata ?? '{}', true);

            return ['id' => $message->id, 'question' => $message->question, 'answer' => $message->answer, 'mode' => $message->mode, 'is_draft' => $meta['is_draft'] ?? false, 'links' => $meta['links'] ?? [], 'conversation_id' => $meta['conversation_id'] ?? null];
        }));
    }

    private function owned(int $session): void
    {
        abort_unless(DB::table('panel_assistant_sessions')->where('id', $session)->where('user_id', auth('admin')->id())->exists(), 403);
    }

    public function ask(Request $request, PanelAssistantService $service)
    {
        $data = $request->validate(['question' => 'required|string|max:2000', 'intent' => 'required|in:help,overview,summary,draft', 'conversation_id' => 'nullable|integer|min:1', 'session_id' => 'nullable|integer|min:1', 'request_id' => 'required|uuid']);
        abort_if(trim($data['question']) === '', 422);
        try {
            return Cache::lock('panel-assistant:'.auth('admin')->id().':'.$data['request_id'], 45)->block(20, fn () => $this->respond($data, $service));
        } catch (LockTimeoutException $e) {
            return response()->json(['message' => 'La consulta sigue procesándose. Vuelve a intentar en unos segundos.'], 429);
        }
    }

    private function respond(array $data, PanelAssistantService $service)
    {
        $session = $data['session_id'] ?? null;
        if ($session) {
            $this->owned($session);
        }
        $previous = DB::table('panel_assistant_messages as m')->join('panel_assistant_sessions as s', 's.id', '=', 'm.session_id')
            ->where('s.user_id', auth('admin')->id())->where('m.request_id', $data['request_id'])->select('m.*')->first();
        if ($previous) {
            $meta = json_decode($previous->metadata ?? '{}', true);

            return response()->json(['session_id' => $previous->session_id, 'answer' => $previous->answer, 'mode' => $previous->mode, 'links' => $meta['links'] ?? [], 'is_draft' => $meta['is_draft'] ?? false, 'conversation_id' => $meta['conversation_id'] ?? null]);
        }
        abort_if(in_array($data['intent'], ['summary', 'draft']) && empty($data['conversation_id']), 422, 'Selecciona una conversación de la bandeja.');
        $user = auth('admin')->user();
        $permissions = $user->getAllPermisos()->sort()->values()->all();
        $scope = hash('sha256', json_encode([$data['conversation_id'] ?? null, $permissions, $user->esAdmin()], JSON_THROW_ON_ERROR));
        $history = [];
        if ($session) {
            foreach (DB::table('panel_assistant_messages')->where('session_id', $session)->orderByDesc('id')->limit(6)->get()->reverse() as $message) {
                $meta = json_decode($message->metadata ?? '{}', true);
                if (($meta['scope'] ?? null) === $scope) {
                    $history[] = ['question' => $message->question, 'answer' => mb_substr($message->answer, 0, 2000)];
                }
            }
        }
        $result = $service->answer($user, $data['question'], $data['conversation_id'] ?? null, $data['intent'], $history);
        $session = DB::transaction(function () use ($session, $data, $result, $scope) {
            $id = $session ?? DB::table('panel_assistant_sessions')->insertGetId(['user_id' => auth('admin')->id(), 'title' => mb_substr($data['question'], 0, 120), 'created_at' => now(), 'updated_at' => now()]);
            DB::table('panel_assistant_sessions')->where('id', $id)->lockForUpdate()->first();
            DB::table('panel_assistant_messages')->insertOrIgnore(['session_id' => $id, 'request_id' => $data['request_id'], 'question' => $data['question'], 'answer' => $result['answer'], 'mode' => $result['mode'], 'metadata' => json_encode(['scope' => $scope, 'is_draft' => $result['is_draft'], 'links' => $result['links'], 'conversation_id' => $result['conversation_id']], JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now()]);
            DB::table('panel_assistant_sessions')->where('id', $id)->update(['updated_at' => now()]);

            return $id;
        });

        return response()->json(['session_id' => $session] + $result);
    }
}

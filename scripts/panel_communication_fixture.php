<?php

// Isolated local QA users and conversation. No messages are dispatched to external channels.
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('local') || config('session.driver') !== 'file') throw new RuntimeException('Local file sessions required.');
$path = storage_path('logs/panel-communication-fixture.json');
if (($argv[1] ?? '') === 'cleanup') {
    if (! is_file($path)) exit;
    $data = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    $ids = array_column($data['users'], 'id');
    DB::transaction(function () use ($data, $ids) {
        $threads = DB::table('staff_threads')->whereIn('created_by', $ids)->pluck('id');
        DB::table('staff_messages')->whereIn('thread_id', $threads)->delete();
        DB::table('staff_thread_members')->whereIn('thread_id', $threads)->delete();
        DB::table('staff_threads')->whereIn('id', $threads)->delete();
        $sessions = DB::table('panel_assistant_sessions')->whereIn('user_id', $ids)->pluck('id');
        DB::table('panel_assistant_messages')->whereIn('session_id', $sessions)->delete();
        DB::table('panel_assistant_sessions')->whereIn('id', $sessions)->delete();
        DB::table('omnichannel_messages')->where('conversation_id', $data['conversation'])->delete();
        DB::table('omnichannel_conversations')->where('id', $data['conversation'])->delete();
        DB::table('omnichannel_contacts')->where('id', $data['contact'])->delete();
        DB::table('usuario_rol')->whereIn('usuario_id', $ids)->delete();
        DB::table('usuario')->whereIn('id', $ids)->where('email', 'like', 'panel-qa-%@example.invalid')->delete();
    });
    foreach ($data['users'] as $user) {
        $file = config('session.files').DIRECTORY_SEPARATOR.$user['session_id'];
        if (is_file($file)) unlink($file);
    }
    unlink($path);
    echo "QA fixtures cleaned.\n";
    exit;
}
if (is_file($path)) throw new RuntimeException('Clean the previous fixture first.');
$role = DB::table('rol')->where('nombre', 'admin')->value('id');
if (! $role) throw new RuntimeException('Existing admin role required.');
$users = [];
for ($i = 1; $i <= 3; $i++) {
    $id = DB::table('usuario')->insertGetId(['nombres' => 'Panel QA '.$i, 'apellidos' => 'Temporal', 'email' => 'panel-qa-'.Str::uuid().'@example.invalid', 'password_hash' => password_hash(Str::random(40), PASSWORD_BCRYPT), 'estado' => 'activo', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('usuario_rol')->insert(['usuario_id' => $id, 'rol_id' => $role]);
    $sid = Str::random(40);
    file_put_contents(config('session.files').DIRECTORY_SEPARATOR.$sid, serialize([Auth::guard('admin')->getName() => $id, '_token' => Str::random(40)]));
    $name = config('session.cookie');
    $value = app('encrypter')->encrypt(CookieValuePrefix::create($name, app('encrypter')->getKey()).$sid, false);
    $users[] = ['id' => $id, 'session_id' => $sid, 'name' => $name, 'value' => $value];
}
$contact = DB::table('omnichannel_contacts')->insertGetId(['name' => 'Cliente Panel QA Temporal', 'created_at' => now(), 'updated_at' => now()]);
$conversation = DB::table('omnichannel_conversations')->insertGetId(['contact_id' => $contact, 'assigned_user_id' => $users[0]['id'], 'channel' => 'whatsapp', 'status' => 'human_active', 'is_bot_paused' => true, 'last_message_at' => now(), 'last_message_preview' => 'Consulta aislada de prueba', 'message_count' => 1, 'created_at' => now(), 'updated_at' => now()]);
DB::table('omnichannel_messages')->insert(['conversation_id' => $conversation, 'contact_id' => $contact, 'channel' => 'whatsapp', 'direction' => 'inbound', 'content' => 'Quiero saber qué información necesitan para revisar mi pedido de prueba.', 'status' => 'delivered', 'created_at' => now(), 'updated_at' => now()]);
file_put_contents($path, json_encode(['users' => $users, 'contact' => $contact, 'conversation' => $conversation], JSON_THROW_ON_ERROR));
echo "Isolated local fixtures created.\n";

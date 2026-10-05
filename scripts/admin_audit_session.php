<?php

use App\Models\Usuario;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Creates a temporary local-only browser audit session; never changes passwords.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$app->instance('request', Request::create('/'));
$path = storage_path('logs/admin-audit-session.json');
if (($argv[1] ?? '') === 'cleanup') {
    if (is_file($path)) {
        $data = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        DB::table('sessions')->where('id', $data['session_id'])->delete();
        unlink($path);
    }
    exit;
}
if ($app->environment() !== 'local' || config('session.driver') !== 'database') {
    throw new RuntimeException('Local database session required.');
}
if (is_file($path)) {
    throw new RuntimeException('Clean up the previous audit session first.');
}
$user = Usuario::where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', 'admin'))->firstOrFail();
$id = Str::random(40);
$payload = [Auth::guard('admin')->getName() => $user->id, '_token' => Str::random(40)];
DB::table('sessions')->insert(['id' => $id, 'user_id' => $user->id, 'ip_address' => '127.0.0.1', 'user_agent' => 'Local admin audit', 'payload' => base64_encode(serialize($payload)), 'last_activity' => time()]);
$name = config('session.cookie');
$encrypted = app('encrypter')->encrypt(CookieValuePrefix::create($name, app('encrypter')->getKey()).$id, false);
file_put_contents($path, json_encode(['session_id' => $id, 'name' => $name, 'value' => $encrypted]));
echo "Temporary local audit session created.\n";

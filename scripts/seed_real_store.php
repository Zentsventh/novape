<?php
// Run after `php artisan migrate`. Does not send mail, WhatsApp or SUNAT requests.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (!app()->environment(['local', 'testing'])) {
    throw new RuntimeException('Solo se permite ejecutar en local/testing.');
}
if (!Illuminate\Support\Facades\DB::table('usuario')->where('email', 'admin@novape.com')->exists() && !env('DEMO_SEED_PASSWORD')) {
    $password = bin2hex(random_bytes(16));
    putenv('DEMO_SEED_PASSWORD='.$password);
    $_ENV['DEMO_SEED_PASSWORD'] = $password;
    $_SERVER['DEMO_SEED_PASSWORD'] = $password;
    $directory = storage_path('app/private');
    if (!is_dir($directory)) mkdir($directory, 0700, true);
    file_put_contents($directory.'/demo-admin.txt', "Correo: admin@novape.com\nClave: ".$password."\n");
    echo "Credenciales del nuevo administrador guardadas en storage/app/private/demo-admin.txt\n";
}
$status = Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => Database\Seeders\RealStoreMonthSeeder::class, '--force' => true]);
echo Illuminate\Support\Facades\Artisan::output();
exit($status);

<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$role = \App\Models\Rol::where('nombre', 'asesor')->first();
$perm = \App\Models\Permiso::where('nombre', 'gestionar_omnichannel')->first();
$permCrm = \App\Models\Permiso::where('nombre', 'ver_dashboard')->first();

if ($role && $perm) {
    $role->permisos()->syncWithoutDetaching([$perm->id, $permCrm->id]);
    echo "Permisos de asesor actualizados.\n";
}

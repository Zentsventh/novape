<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$source = $argv[1] ?? dirname(__DIR__).'/novape_clean_data.sql';
$target = $argv[2] ?? dirname(__DIR__).'/novape_mysql_data.sql';
if (realpath($source) === realpath($target)) {
    fwrite(STDERR, 'El destino debe ser distinto del original.'.PHP_EOL);
    exit(1);
}
$input = fopen($source, 'rb');
$output = fopen($target, 'xb');
if ($input === false || $output === false) {
    fwrite(STDERR, 'No se pudo abrir el origen o crear un destino nuevo.'.PHP_EOL);
    exit(1);
}
$changed = 0;
while (($line = fgets($input)) !== false) {
    // Match schema definitions only. Keep fiscal_identity STORED and all row data.
    // These three unique indexes use VIRTUAL columns in the application migration.
    if (preg_match('/^\s+`(?:principal_usuario_id|active_cashier_id|active_register_id)` .*GENERATED ALWAYS AS .* STORED,\r?\n?$/', $line)) {
        $line = preg_replace('/ STORED,(\r?\n?)$/', ' VIRTUAL,$1', $line);
        $changed++;
    }
    if (fwrite($output, $line) !== strlen($line)) {
        fwrite(STDERR, 'No se pudo escribir el respaldo completo.'.PHP_EOL);
        exit(1);
    }
}
fclose($input);
fclose($output);
if ($changed !== 3) {
    fwrite(STDERR, 'Se esperaban exactamente tres definiciones compatibles; no usar este archivo.'.PHP_EOL);
    exit(1);
}
echo 'Definiciones corregidas: '.$changed.PHP_EOL;

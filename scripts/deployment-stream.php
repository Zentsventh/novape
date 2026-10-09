<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$path = $argv[1] ?? '';
$input = @fopen($path, 'rb');
if ($input === false) {
    fwrite(STDERR, "No se pudo abrir el respaldo SQL.\n");
    exit(1);
}
$output = fopen('php://stdout', 'wb');
function emitSql($output, string $text): void
{
    $offset = 0;
    while ($offset < strlen($text)) {
        $written = @fwrite($output, substr($text, $offset));
        if ($written === false || $written === 0) {
            fwrite(STDERR, "Se interrumpio la entrada de MySQL; detener la restauracion.\n");
            exit(1);
        }
        $offset += $written;
    }
}

// DDL commits each completed table implicitly. Commit the final table explicitly.
// Copy the SQL byte for byte: statements may contain multiline string literals.
emitSql($output, "SET SESSION autocommit=0;\n");
$total = filesize($path);
$sent = 0;
$nextReport = 5 * 1024 * 1024;
while (!feof($input)) {
    $chunk = fread($input, 32768);
    if ($chunk === false) {
        fwrite(STDERR, "No se pudo leer todo el respaldo.\n");
        exit(1);
    }
    emitSql($output, $chunk);
    $sent += strlen($chunk);
    if ($sent >= $nextReport) {
        fwrite(STDERR, sprintf("SQL enviado: %.1f de %.1f MB (%d%%)\n", $sent / 1048576, $total / 1048576, (int) ($sent * 100 / $total)));
        $nextReport += 5 * 1024 * 1024;
    }
}
fclose($input);
emitSql($output, "\nCOMMIT;\nSET SESSION autocommit=1;\nSELECT 'SQL cargado y confirmado' AS resultado;\n");
fclose($output);
fwrite(STDERR, "Respaldo enviado al 100%; esperando la confirmacion final de MySQL.\n");

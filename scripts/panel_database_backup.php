<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$connection = DB::connection();
$driver = $connection->getDriverName();
echo 'Driver: '.$driver.PHP_EOL;
if (! in_array($driver, ['sqlite', 'mysql'], true)) {
    echo 'Se requiere respaldo específico para este motor antes de migrar.'.PHP_EOL;
    exit(2);
}
$database = $connection->getDatabaseName();
$backup = storage_path('app/private/panel-backup-'.date('Ymd-His').($driver === 'mysql' ? '.sql' : '.sqlite'));
if (! is_dir(dirname($backup))) {
    mkdir(dirname($backup), 0700, true);
}
// VACUUM INTO includes committed WAL data in a consistent backup.
$pdo = $connection->getPdo();
if ($driver === 'sqlite') {
    if (! is_file($database)) {
        throw new RuntimeException('La base SQLite no existe.');
    }
    $pdo->exec('VACUUM INTO '.$pdo->quote($backup));
} else {
    $stream = fopen($backup, 'xb');
    $pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    $pdo->beginTransaction();
    fwrite($stream, "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n");
    foreach ($pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")->fetchAll(PDO::FETCH_NUM) as $table) {
        $name = '`'.str_replace('`', '``', $table[0]).'`';
        $create = $pdo->query('SHOW CREATE TABLE '.$name)->fetch(PDO::FETCH_NUM)[1];
        fwrite($stream, 'DROP TABLE IF EXISTS '.$name.";\n".$create.";\n");
        $offset = 0;
        do {
            $rows = $pdo->query('SELECT * FROM '.$name.' LIMIT 500 OFFSET '.$offset)->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                $columns = implode(',', array_map(fn ($col) => '`'.str_replace('`', '``', $col).'`', array_keys($row)));
                $values = implode(',', array_map(fn ($value) => $value === null ? 'NULL' : $pdo->quote((string) $value), array_values($row)));
                fwrite($stream, 'INSERT INTO '.$name.' ('.$columns.') VALUES ('.$values.");\n");
            }
            $offset += count($rows);
        } while (count($rows) === 500);
    }
    fwrite($stream, "SET FOREIGN_KEY_CHECKS=1;\n");
    $pdo->commit();
    fclose($stream);
}
echo 'Respaldo: '.$backup.PHP_EOL;

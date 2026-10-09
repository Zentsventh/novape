<?php
return [
    'backup_connection' => env('DB_BACKUP_CONNECTION', 'mysql'),
    'dump_binary' => env('DB_DUMP_BINARY', PHP_OS_FAMILY === 'Windows' ? 'C:/xampp/mysql/bin/mysqldump.exe' : 'mariadb-dump'),
    'client_binary' => env('DB_CLIENT_BINARY', PHP_OS_FAMILY === 'Windows' ? 'C:/xampp/mysql/bin/mysql.exe' : 'mariadb'),
    'retention_days' => (int) env('DB_BACKUP_RETENTION_DAYS', 30),
    'offsite_disk' => env('DB_BACKUP_OFFSITE_DISK'),
    'secondary_disk' => env('DB_BACKUP_SECONDARY_DISK'),
    'maintenance_file' => env('DB_MAINTENANCE_FILE', 'mariadb-maintenance.enc'),
];

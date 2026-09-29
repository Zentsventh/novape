<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateLocalToAzure extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:migrate-azure';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migra de golpe todos los archivos locales (storage/app/public) a Azure Blob Storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando migración de archivos locales a Azure Storage...");

        $localDisk = Storage::disk('public');
        $azureDisk = Storage::disk('azure');

        // Obtener todos los archivos del disco público local
        $files = $localDisk->allFiles();
        
        if (empty($files)) {
            $this->warn("No se encontraron archivos en el disco local (storage/app/public) para migrar.");
            return;
        }

        $bar = $this->output->createProgressBar(count($files));
        $bar->start();

        $errors = 0;
        $success = 0;

        foreach ($files as $file) {
            try {
                // Copiar el archivo desde local a azure manteniendo la estructura
                $contents = $localDisk->get($file);
                $azureDisk->put($file, $contents);
                $success++;
            } catch (\Exception $e) {
                $this->error("\nError subiendo {$file}: " . $e->getMessage());
                $errors++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        
        $this->info("\n\nMigración completada.");
        $this->info("Archivos subidos exitosamente: {$success}");
        if ($errors > 0) {
            $this->error("Archivos con error: {$errors}");
        }
    }
}

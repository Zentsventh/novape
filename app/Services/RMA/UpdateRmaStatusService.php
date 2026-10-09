<?php

declare(strict_types=1);

namespace App\Services\RMA;

use App\Models\Devolucion;

class UpdateRmaStatusService
{
    /**
     * @param array<string, mixed> $data
     */
    public function execute(int $id, array $data): void
    {
        $devolucion = Devolucion::findOrFail($id);
        
        $devolucion->update([
            'estado' => $data['estado'],
            'comentarios_admin' => $data['comentarios_admin'] ?? null,
        ]);
    }
}

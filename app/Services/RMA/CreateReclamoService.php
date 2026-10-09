<?php

declare(strict_types=1);

namespace App\Services\RMA;

use App\Models\Reclamo;
use Illuminate\Support\Str;

class CreateReclamoService
{
    /**
     * Creates a new Reclamo and generates a tracking code.
     *
     * @param array<string, mixed> $data
     * @return array{codigo: string, tipo: string}
     */
    public function execute(array $data): array
    {
        $codigo = 'REC-' . date('Y') . '-' . strtoupper(Str::random(6));
        $data['codigo'] = $codigo;

        Reclamo::create($data);

        return [
            'codigo' => $codigo,
            'tipo' => strtolower($data['tipo_reclamo'])
        ];
    }
}

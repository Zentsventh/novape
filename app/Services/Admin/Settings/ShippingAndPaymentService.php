<?php

declare(strict_types=1);

namespace App\Services\Admin\Settings;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class ShippingAndPaymentService
{
    public function getPaymentMethods(): Collection
    {
        return DB::table('metodos_pago')->orderBy('id')->get();
    }

    public function createPaymentMethod(array $data): void
    {
        DB::table('metodos_pago')->insert([
            'nombre' => $data['nombre'],
            'detalles' => $data['detalles'] ?? null,
            'tipo' => $data['tipo'],
            'comision_porcentaje' => $data['comision_porcentaje'] ?? 0,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function updatePaymentMethod(int $id, array $data): void
    {
        DB::table('metodos_pago')->where('id', $id)->update([
            'nombre' => $data['nombre'],
            'detalles' => $data['detalles'] ?? null,
            'tipo' => $data['tipo'] ?? 'digital',
            'comision_porcentaje' => $data['comision_porcentaje'] ?? 0,
            'activo' => $data['activo'] ?? true,
            'updated_at' => now(),
        ]);
    }

    public function deletePaymentMethod(int $id): void
    {
        DB::table('metodos_pago')->where('id', $id)->delete();
    }

    public function getZones(): Collection
    {
        return DB::table('zonas')->orderBy('id')->get();
    }

    public function createZone(array $data): void
    {
        DB::table('zonas')->insert([
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'costo_envio' => $data['costo_envio'],
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function updateZone(int $id, array $data): void
    {
        DB::table('zonas')->where('id', $id)->update([
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'costo_envio' => $data['costo_envio'],
            'activo' => $data['activo'] ?? true,
            'updated_at' => now(),
        ]);
    }

    public function deleteZone(int $id): void
    {
        DB::table('zonas')->where('id', $id)->delete();
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\Producto;

class CompareService
{
    /**
     * @param  array<int>  $compareIds
     * @return array<string, mixed>
     */
    public function getCompareData(array $compareIds): array
    {
        $productos = collect();
        if (count($compareIds) > 0) {
            $productos = Producto::whereIn('id', $compareIds)
                ->with(['marca', 'imagenes', 'variantes', 'productoEspecificaciones'])
                ->get()
                ->map(function ($prod) {
                    $variante = $prod->variantes->first();

                    return [
                        'id' => $prod->id,
                        'nombre' => $prod->nombre,
                        'marca' => $prod->marca ? $prod->marca->nombre : 'Genérico',
                        'precio' => $variante ? (float) $variante->precio : 0.0,
                        'imagen' => $prod->imagenes->first() ? $prod->imagenes->first()->url : null,
                        'descripcion' => $prod->descripcion,
                        'especificaciones' => $prod->productoEspecificaciones->map(function ($pe) {
                            return [
                                'nombre' => $pe->clave,
                                'valor' => $pe->valor,
                            ];
                        })->toArray(),
                    ];
                });
        }

        $todasEspecificaciones = [];
        foreach ($productos as $prod) {
            foreach ($prod['especificaciones'] as $esp) {
                if (! in_array($esp['nombre'], $todasEspecificaciones)) {
                    $todasEspecificaciones[] = $esp['nombre'];
                }
            }
        }

        return [
            'productos' => $productos,
            'especificacionesUnicas' => $todasEspecificaciones,
        ];
    }
}

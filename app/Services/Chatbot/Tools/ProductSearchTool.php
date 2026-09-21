<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Tools;

use App\Models\Producto;

class ProductSearchTool implements ToolInterface
{
    public function getName(): string
    {
        return 'buscar_productos';
    }

    public function getDescription(): string
    {
        return 'Busca productos en la base de datos de la tienda por nombre o categoría. Devuelve el nombre, precio y stock de los productos que coinciden.';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'OBJECT',
            'properties' => [
                'query' => [
                    'type' => 'STRING',
                    'description' => 'Palabra clave para buscar (ej. samsung, audifonos, laptop)'
                ]
            ],
            'required' => ['query']
        ];
    }

    public function execute(array $args): mixed
    {
        $query = $args['query'] ?? '';
        
        if (empty(trim($query))) {
            return ['error' => 'Debes proporcionar un término de búsqueda.'];
        }

        try {
            $productos = Producto::with('variantes')
                ->where('activo', 1)
                ->where('nombre', 'LIKE', '%' . $query . '%')
                ->orderBy('id', 'desc')
                ->take(5)
                ->get();

            if ($productos->isEmpty()) {
                return ['message' => 'No se encontraron productos coincidentes con: ' . $query];
            }

            $resultados = [];
            foreach ($productos as $prod) {
                $stock = $prod->variantes->sum('stock');
                $precio = $prod->variantes->first() ? $prod->variantes->first()->precio : '0.00';
                $resultados[] = [
                    'nombre' => $prod->nombre,
                    'precio_soles' => $precio,
                    'stock_disponible' => $stock
                ];
            }

            return $resultados;
        } catch (\Exception $e) {
            return ['error' => 'Ocurrió un error al consultar la base de datos de productos.'];
        }
    }
}

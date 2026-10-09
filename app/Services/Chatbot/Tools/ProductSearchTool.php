<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Tools;

use App\Models\ConfiguracionSitio;
use App\Models\Variante;
use Illuminate\Support\Facades\DB;

class ProductSearchTool implements ToolInterface
{
    public array $lastResults = [];

    public function getName(): string { return 'buscar_productos'; }

    public function getDescription(): string
    {
        return 'Busca productos y variantes activos por nombre o SKU. Devuelve precios actuales en soles y stock disponible del almacén de venta.';
    }

    public function getParametersSchema(): array
    {
        return ['type' => 'OBJECT', 'properties' => ['query' => ['type' => 'STRING', 'description' => 'Nombre, modelo o SKU del producto']], 'required' => ['query']];
    }

    public function execute(array $args): mixed
    {
        $search = mb_substr(trim((string) ($args['query'] ?? '')), 0, 120);
        if (mb_strlen($search) < 2) {
            return ['message' => 'Indica al menos dos letras del producto o modelo.'];
        }
        $terms = array_slice(preg_split('/\s+/u', $search) ?: [], 0, 8);
        $query = Variante::with('producto')->where('activo', true)->whereHas('producto', fn ($q) => $q->where('activo', true));
        foreach ($terms as $term) {
            $like = '%'.str_replace(['%', '_'], '', $term).'%';
            $query->where(fn ($q) => $q->where('sku', 'like', $like)->orWhereHas('producto', fn ($p) => $p->where('nombre', 'like', $like)));
        }
        $variants = $query->orderBy('precio')->limit(5)->get();
        $warehouse = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
        $stocks = DB::table('stock_almacen')->where('almacen_id', $warehouse)->whereIn('variante_id', $variants->pluck('id'))->pluck('cantidad', 'variante_id');
        $this->lastResults = $variants->map(fn ($v) => [
            'producto_id' => $v->producto_id, 'variante_id' => $v->id, 'nombre' => $v->producto->nombre,
            'sku' => $v->sku, 'precio_soles' => (float) $v->precio,
            'stock_disponible' => max(0, (int) ($stocks[$v->id] ?? 0) - (int) $v->stock_reservado),
        ])->all();

        return $this->lastResults ?: ['message' => 'No encontré coincidencias. Indica una marca o un modelo más corto.'];
    }
}
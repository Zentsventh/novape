<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmCompany;
use App\Models\Usuario;
use App\Models\ConfiguracionSitio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SelectorController extends Controller
{
    public function variants(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:100', 'id' => 'nullable|integer|min:1',
            'producto_id' => 'nullable|integer|min:1', 'categoria_id' => 'nullable|integer|min:1',
            'marca_id' => 'nullable|integer|min:1', 'almacen_id' => 'nullable|integer|min:1',
            'page' => 'nullable|integer|min:1',
        ]);
        $query = DB::table('variante')->join('producto', 'producto.id', '=', 'variante.producto_id')
            ->whereNull('producto.deleted_at')->whereNull('variante.deleted_at')
            ->where('producto.activo', true)->where('variante.activo', true)
            ->select('variante.id', 'variante.id as variante_id', 'producto.id as producto_id', 'producto.nombre', 'variante.sku', 'variante.precio');
        if (!empty($filters['id'])) $query->where('variante.id', $filters['id']);
        if (!empty($filters['producto_id'])) $query->where('producto.id', $filters['producto_id']);
        if (!empty($filters['marca_id'])) $query->where('producto.marca_id', $filters['marca_id']);
        if (!empty($filters['categoria_id'])) {
            // Traverse every level; EFE includes categories below the second level.
            $ids = [(int) $filters['categoria_id']];
            $frontier = $ids;
            while ($frontier) {
                $frontier = DB::table('categoria')->whereIn('categoria_padre_id', $frontier)->whereNotIn('id', $ids)->pluck('id')->all();
                $ids = array_merge($ids, $frontier);
            }
            $query->whereExists(fn ($categories) => $categories->selectRaw('1')->from('producto_categoria')
                ->whereColumn('producto_categoria.producto_id', 'producto.id')->whereIn('categoria_id', $ids));
        }
        if (!empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(fn ($q) => $q->where('producto.nombre', 'like', $term)->orWhere('variante.sku', 'like', $term));
        }
        $page = $query->orderBy('producto.nombre')->orderBy('variante.id')->simplePaginate(30);
        if (!empty($filters['almacen_id'])) {
            $warehouse = (int) $filters['almacen_id'];
            $variantIds = collect($page->items())->pluck('id');
            $stocks = DB::table('stock_almacen')->where('almacen_id', $warehouse)->whereIn('variante_id', $variantIds)->pluck('cantidad', 'variante_id');
            $reserved = collect();
            if ($warehouse === (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1)) {
                $reserved = DB::table('reservas_stock')->whereIn('variante_id', $variantIds)->where('expires_at', '>', now())
                    ->groupBy('variante_id')->selectRaw('variante_id, SUM(cantidad) as cantidad')->pluck('cantidad', 'variante_id');
            }
            collect($page->items())->each(function ($row) use ($stocks, $reserved) {
                $row->disponible = max(0, (int) $stocks->get($row->id, 0) - (int) $reserved->get($row->id, 0));
            });
        }
        return response()->json(['data' => $page->items(), 'has_more' => $page->hasMorePages()]);
    }

    public function contacts(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:100', 'id' => 'nullable|integer|min:1', 'page' => 'nullable|integer|min:1']);
        $query = Usuario::select('id', 'nombres', 'apellidos')->where('estado', 'activo');
        if (!empty($filters['id'])) $query->whereKey($filters['id']);
        if (!empty($filters['q'])) {
            foreach (preg_split('/\s+/', trim($filters['q'])) as $word) {
                $term = '%'.$word.'%';
                $query->where(fn ($q) => $q->where('nombres', 'like', $term)->orWhere('apellidos', 'like', $term));
            }
        }
        $page = $query->orderBy('nombres')->orderBy('id')->simplePaginate(30);
        return response()->json(['data' => $page->items(), 'has_more' => $page->hasMorePages()]);
    }

    public function companies(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:100', 'id' => 'nullable|integer|min:1', 'page' => 'nullable|integer|min:1']);
        $query = CrmCompany::select('id', 'nombre');
        if (!empty($filters['id'])) $query->whereKey($filters['id']);
        if (!empty($filters['q'])) $query->where('nombre', 'like', '%'.$filters['q'].'%');
        $page = $query->orderBy('nombre')->orderBy('id')->simplePaginate(30);
        return response()->json(['data' => $page->items(), 'has_more' => $page->hasMorePages()]);
    }

    public function deals(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:100', 'id' => 'nullable|integer|min:1', 'page' => 'nullable|integer|min:1']);
        $query = \App\Models\CrmDeal::select('id', 'titulo');
        if (!empty($filters['id'])) $query->whereKey($filters['id']);
        if (!empty($filters['q'])) $query->where('titulo', 'like', '%'.$filters['q'].'%');
        $page = $query->orderBy('titulo')->orderBy('id')->simplePaginate(30);
        return response()->json(['data' => $page->items(), 'has_more' => $page->hasMorePages()]);
    }
}

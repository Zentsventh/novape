<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Categoria;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Services\Admin\Product\ProductManagementService;
use App\Support\Csv;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductManagementService $productService
    ) {}

    public function index(Request $request)
    {
        $query = Producto::with(['marca', 'imagenes', 'variantes', 'categorias']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre', 'like', '%'.$request->search.'%')
                    ->orWhere('sku_base', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('categoria_id')) {
            $query->whereHas('categorias', function ($q) use ($request) {
                $q->where('categoria.id', $request->categoria_id);
            });
        }

        if ($request->filled('marca_id')) {
            $query->where('marca_id', $request->marca_id);
        }

        $productos = $query->orderBy($request->input('sort', 'id'), $request->input('direction', 'desc'))
            ->paginate(10)->withQueryString();

        $categoriasQuery = Categoria::where('activa', true)->whereNull('categoria_padre_id');
        if ($request->filled('marca_id')) {
            $categoriasQuery->whereHas('productos', function ($q) use ($request) {
                $q->where('marca_id', $request->marca_id);
            });
        }

        $marcasQuery = Marca::query();
        if ($request->filled('categoria_id')) {
            $marcasQuery->whereHas('productos', function ($q) use ($request) {
                $q->whereHas('categorias', function ($q2) use ($request) {
                    $q2->where('categoria.id', $request->categoria_id);
                });
            });
        }

        return Inertia::render('Admin/Products/Index', [
            'productos' => $productos,
            'categorias' => $categoriasQuery->orderBy('nombre')->get(),
            'marcas' => $marcasQuery->orderBy('nombre')->get(),
            'filters' => (object) $request->only(['search', 'categoria_id', 'marca_id', 'sort', 'direction']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Products/Form', [
            'marcas' => Marca::all(),
            'categorias' => Categoria::all(),
            'proveedores' => Proveedor::where('activo', true)->get(),
            'costoPromedio' => 0,
            'listaEspecificaciones' => [],
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $adminId = (int) (auth('admin')->id() ?? auth()->id() ?? 1);
        $this->productService->createProduct($request->validated(), $adminId);

        return redirect()->route('admin.products')->with('success', 'Producto creado exitosamente.');
    }

    public function edit(int $id)
    {
        $product = Producto::with(['categorias', 'imagenes', 'productoEspecificaciones', 'variantes'])->findOrFail($id);
        $warehouseId = (int) \App\Models\ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
        $variantIds = $product->variantes->pluck('id')->all();
        $stocks = ! empty($variantIds)
            ? DB::table('stock_almacen')
                ->whereIn('variante_id', $variantIds)
                ->where('almacen_id', $warehouseId)
                ->pluck('cantidad', 'variante_id')
            : collect();

        foreach ($product->variantes as $variant) {
            $variant->setAttribute('stock_local', (int) ($stocks[$variant->id] ?? 0));
        }
        return Inertia::render('Admin/Products/Form', [
            'producto' => $product,
            'marcas' => Marca::all(),
            'categorias' => Categoria::all(),
            'proveedores' => Proveedor::where('activo', true)->get(),
            'listaEspecificaciones' => [],
        ]);
    }

    public function show(int $id)
    {
        $producto = Producto::with(['categorias', 'imagenes', 'productoEspecificaciones', 'variantes', 'marca', 'proveedor'])->findOrFail($id);

        $historialCompras = DB::table('compra_items')
            ->join('compras', 'compra_items.compra_id', '=', 'compras.id')
            ->leftJoin('proveedor', 'compras.proveedor_id', '=', 'proveedor.id')
            ->where('compra_items.producto_id', $id)
            ->where('compras.estado', 'completado')
            ->select(
                'proveedor.id as proveedor_id',
                'proveedor.nombre as proveedor_nombre',
                'compras.numero_orden',
                'compras.fecha_compra',
                'compra_items.cantidad',
                'compra_items.costo_unitario'
            )->orderBy('compras.fecha_compra', 'desc')->get();

        $comparativaProveedores = [];
        foreach ($historialCompras as $hc) {
            $pid = $hc->proveedor_id ?? 0;
            if (! isset($comparativaProveedores[$pid])) {
                $comparativaProveedores[$pid] = [
                    'proveedor_id' => $pid,
                    'proveedor_nombre' => $hc->proveedor_nombre ?? 'Sin proveedor',
                    'ultima_compra' => $hc->fecha_compra,
                    'ultimo_costo' => $hc->costo_unitario,
                    'total_unidades' => 0,
                    'frecuencia' => 0,
                ];
            }
            $comparativaProveedores[$pid]['total_unidades'] += $hc->cantidad;
            $comparativaProveedores[$pid]['frecuencia'] += 1;
        }

        return Inertia::render('Admin/Products/Show', [
            'producto' => $producto,
            'costoPromedio' => (float) (DB::table('compra_items')->where('producto_id', $id)->avg('costo_unitario') ?? 0),
            'historialCompras' => $historialCompras,
            'comparativaProveedores' => array_values($comparativaProveedores),
        ]);
    }

    public function update(UpdateProductRequest $request, int $id)
    {
        $adminId = (int) (auth('admin')->id() ?? auth()->id() ?? 1);
        $this->productService->updateProduct(Producto::findOrFail($id), $request->validated(), $adminId);

        return redirect()->route('admin.products')->with('success', 'Producto actualizado exitosamente.');
    }

    public function destroy(int $id)
    {
        $this->productService->deleteProduct(Producto::findOrFail($id));

        return redirect()->route('admin.products')->with('success', 'Producto eliminado exitosamente.');
    }

    public function export()
    {
        $productos = Producto::with(['marca', 'variantes', 'categorias'])->lazyById(500);
        $rows = $productos->map(fn ($p) => [
            $p->id,
            $p->nombre,
            ($p->marca ? $p->marca->nombre : ''),
            ($p->categorias->first() ? $p->categorias->first()->nombre : ''),
            $p->sku_base,
            $p->variantes->sum('stock'),
            $p->variantes->first() ? $p->variantes->first()->precio : 0,
            $p->activo ? 'Activo' : 'Inactivo',
        ]);

        return Csv::download(['ID', 'Nombre', 'Marca', 'Categoría', 'SKU', 'Stock', 'Precio', 'Estado'], $rows, 'productos_'.date('Y-m-d').'.csv');
    }
}

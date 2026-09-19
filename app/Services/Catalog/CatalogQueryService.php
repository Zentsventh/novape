<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\Categoria;
use App\Models\ConfiguracionSitio;
use App\Models\Producto;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CatalogQueryService
{
    private static array $ecommerceStocksMemo = [];
    private static ?int $almacenEcommerceIdMemo = null;

    public function getHomeData(): array
    {
        $categoriaProductos = Cache::remember('home_categorias', 3600, function () {
            $categorias = Categoria::whereNull('categoria_padre_id')
                ->where(function ($q) {
                    $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
                })
                ->with(['subcategorias', 'productos' => function ($query) {
                    $query->where('producto.activo', 1)
                          ->with(['marca', 'variantes', 'imagenes']);
                }])
                ->get();

            return $categorias->map(function ($cat) {
                return [
                    'id' => $cat->id,
                    'nombre' => $cat->nombre,
                    'descripcion' => $cat->descripcion,
                    'subcategorias' => $cat->subcategorias->map(fn($sub) => ['id' => $sub->id, 'nombre' => $sub->nombre]),
                    'productos' => $cat->productos->take(10)->map(fn($prod) => $this->formatProducto($prod)),
                ];
            });
        });

        $mejorSemana = Cache::remember('home_mejor_semana', 3600, function () {
            return Producto::where('activo', 1)
                ->with(['marca', 'variantes', 'imagenes'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(fn($prod) => $this->formatProducto($prod));
        });

        $banners = Cache::remember('home_banners', 3600, function () {
            $now = now()->toDateTimeString();
            return DB::table('banners')
                ->where('activo', 1)
                ->where('posicion', 'hero')
                ->where(function($q) use ($now) {
                    $q->whereNull('fecha_inicio')->orWhere('fecha_inicio', '<=', $now);
                })
                ->where(function($q) use ($now) {
                    $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $now);
                })
                ->orderBy('orden')
                ->get();
        });

        return [
            'categoriaProductos' => $categoriaProductos,
            'mejorSemana' => $mejorSemana,
            'banners' => $banners,
        ];
    }

    public function getCatalogData(array $filters): array
    {
        $categoriaParam = $filters['categoria'] ?? null;
        $subcategoriaParam = $filters['subcategoria'] ?? null;
        $marcaFilter = $filters['marca'] ?? null;
        $precioMin = $filters['precio_min'] ?? null;
        $precioMax = $filters['precio_max'] ?? null;
        $searchQuery = $filters['q'] ?? null;
        $sort = $filters['sort'] ?? 'relevancia';

        $categorias = Cache::remember('catalog_categorias_base', 3600, function () {
            return Categoria::whereNull('categoria_padre_id')
                ->where(function ($q) {
                    $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
                })
                ->with('subcategorias')
                ->get();
        });

        $query = Producto::where('activo', 1)->with(['marca', 'variantes', 'imagenes', 'categorias']);

        $categoriaActiva = null;
        $subcategoriaActiva = null;

        if ($subcategoriaParam && $categoriaParam) {
            $catPadre = Categoria::where('nombre', $categoriaParam)->whereNull('categoria_padre_id')->first();
            if ($catPadre) {
                $subcat = Categoria::where('nombre', $subcategoriaParam)->where('categoria_padre_id', $catPadre->id)->first();
                if ($subcat) {
                    $subcategoriaActiva = $subcat;
                    $categoriaActiva = $catPadre;
                    $query->whereHas('categorias', fn($q) => $q->where('categoria.id', $subcat->id));
                }
            }
        } elseif ($subcategoriaParam) {
            $subcat = Categoria::where('nombre', $subcategoriaParam)->first();
            if ($subcat) {
                $subcategoriaActiva = $subcat;
                $categoriaActiva = $subcat->padre;
                $query->whereHas('categorias', fn($q) => $q->where('categoria.id', $subcat->id));
            }
        } elseif ($categoriaParam) {
            $cat = Categoria::where('nombre', $categoriaParam)->whereNull('categoria_padre_id')->first();
            if ($cat) {
                $categoriaActiva = $cat;
                $catIds = $cat->subcategorias->pluck('id')->push($cat->id)->toArray();
                $query->whereHas('categorias', fn($q) => $q->whereIn('categoria.id', $catIds));
            }
        }

        if (!$categoriaActiva && !$subcategoriaActiva && $searchQuery) {
            $matchedCat = Categoria::where('nombre', 'like', $searchQuery)->first();
            if ($matchedCat) {
                if (is_null($matchedCat->categoria_padre_id)) {
                    $categoriaActiva = $matchedCat;
                } else {
                    $subcategoriaActiva = $matchedCat;
                    $categoriaActiva = $matchedCat->padre;
                }
            }
        }

        if ($searchQuery) {
            $this->applySmartSearch($query, $searchQuery);
        }

        $marcaCounts = (clone $query)->withoutEagerLoads()
            ->whereNotNull('marca_id')
            ->select('marca_id', DB::raw('count(*) as count'))
            ->groupBy('marca_id')
            ->get();

        $marcasIds = $marcaCounts->pluck('marca_id')->filter()->toArray();
        $marcas = empty($marcasIds) ? collect() : \App\Models\Marca::whereIn('id', $marcasIds)->get()->keyBy('id');

        $marcasDisponibles = $marcaCounts->map(function($item) use ($marcas) {
            $marca = $marcas->get($item->marca_id);
            return [
                'nombre' => $marca ? $marca->nombre : 'Sin marca',
                'count' => $item->count
            ];
        })->filter(fn($m) => $m['nombre'] !== 'Sin marca')->sortByDesc('count')->values();

        if ($marcaFilter) {
            $query->whereHas('marca', fn($q) => $q->where('nombre', $marcaFilter));
        }

        $productos = $query->get();
        $varianteIds = $productos->map(fn($p) => $p->variantes->first()?->id)->filter()->toArray();
        $this->preloadStocks($varianteIds);

        $productosFormateados = $productos->map(fn($prod) => $this->formatProducto($prod));

        if ($precioMin !== null && $precioMin !== '') {
            $productosFormateados = $productosFormateados->filter(fn($p) => $p->precio_actual >= (float)$precioMin);
        }
        if ($precioMax !== null && $precioMax !== '') {
            $productosFormateados = $productosFormateados->filter(fn($p) => $p->precio_actual <= (float)$precioMax);
        }

        if ($sort === 'precio_asc') {
            $productosFormateados = $productosFormateados->sortBy('precio_actual');
        } elseif ($sort === 'precio_desc') {
            $productosFormateados = $productosFormateados->sortByDesc('precio_actual');
        } elseif ($sort === 'descuento') {
            $productosFormateados = $productosFormateados->sortByDesc('descuento');
        } else {
            if (!$searchQuery) {
                $productosFormateados = $productosFormateados->sortByDesc('id');
            }
        }

        $now = now()->toDateTimeString();
        $lateralBanners = DB::table('banners')
            ->where('activo', 1)
            ->where('posicion', 'lateral')
            ->where(function($q) use ($now) {
                $q->whereNull('fecha_inicio')->orWhere('fecha_inicio', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $now);
            })
            ->orderBy('orden')
            ->get();

        return [
            'productos' => $productosFormateados->values(),
            'categorias' => $categorias->map(fn($cat) => [
                'id' => $cat->id,
                'nombre' => $cat->nombre,
                'subcategorias' => $cat->subcategorias->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]),
            ]),
            'marcasDisponibles' => $marcasDisponibles,
            'categoriaActiva' => $categoriaActiva ? $categoriaActiva->nombre : null,
            'subcategoriaActiva' => $subcategoriaActiva ? $subcategoriaActiva->nombre : null,
            'lateralBanners' => $lateralBanners,
        ];
    }

    public function getLiveSearchData(string $q): array
    {
        if (strlen($q) < 2) {
            return ['productos' => [], 'marcas' => [], 'categorias' => [], 'sugerencias' => []];
        }

        $query = Producto::where('activo', 1)->with(['marca', 'variantes', 'imagenes', 'categorias']);
        $this->applySmartSearch($query, $q);

        $productos = $query->limit(40)->get();
        $formateados = $productos->take(6)->map(fn($p) => $this->formatProducto($p));

        $marcas = $productos->pluck('marca.nombre')->filter()->unique()->values();
        if ($marcas->count() < 3) {
            $topMarcas = \App\Models\Marca::withCount('productos')
                ->orderBy('productos_count', 'desc')
                ->limit(4)
                ->pluck('nombre');
            $marcas = $marcas->merge($topMarcas)->unique()->values();
        }
        $marcas = $marcas->take(4);

        $categorias = $productos->pluck('categorias')->flatten()->pluck('nombre')->filter()->unique()->values();
        if ($categorias->count() < 3) {
            $topCategorias = Categoria::whereNull('categoria_padre_id')
                ->where(function ($q) {
                    $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
                })
                ->withCount('productos')
                ->orderBy('productos_count', 'desc')
                ->limit(4)
                ->pluck('nombre');
            $categorias = $categorias->merge($topCategorias)->unique()->values();
        }
        $categorias = $categorias->take(4);

        $sugerencias = [];
        if ($categorias->count() > 0) {
            $sugerencias[] = $q . ' en ' . $categorias->first();
        }
        if ($marcas->count() > 0) {
            $sugerencias[] = $marcas->first() . ' ' . $q;
        }

        return [
            'productos' => $formateados,
            'marcas' => $marcas,
            'categorias' => $categorias,
            'sugerencias' => $sugerencias
        ];
    }

    public function getProductData(string $slugOrId): array
    {
        $producto = Producto::with([
                'marca', 
                'variantes', 
                'imagenes', 
                'productoEspecificaciones',
                'categorias'
            ])
            ->where('activo', true)
            ->where(function($query) use ($slugOrId) {
                $query->where('slug', $slugOrId)->orWhere('id', $slugOrId);
            })
            ->firstOrFail();

        $categoriasIds = $producto->categorias->pluck('id')->toArray();
        $recomendados = collect();
        if (!empty($categoriasIds)) {
            $recomendadosQuery = Producto::where('activo', 1)
                ->where('id', '!=', $producto->id)
                ->whereHas('categorias', fn($q) => $q->whereIn('categoria.id', $categoriasIds))
                ->with(['marca', 'variantes', 'imagenes'])
                ->inRandomOrder()
                ->limit(4)
                ->get();
            $recomendados = $recomendadosQuery->map(fn($p) => $this->formatProducto($p));
        }

        $categorias = Categoria::whereNull('categoria_padre_id')
            ->where(function ($q) {
                $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
            })
            ->with('subcategorias')
            ->get();

        return [
            'producto' => $this->formatProducto($producto),
            'detalles' => [
                'especificaciones' => $producto->productoEspecificaciones->map(fn($pe) => ['nombre' => $pe->clave, 'valor' => $pe->valor]),
                'todas_imagenes' => $producto->imagenes->pluck('url')
            ],
            'recomendados' => $recomendados,
            'categorias' => $categorias->map(fn($cat) => [
                'id' => $cat->id,
                'nombre' => $cat->nombre,
                'subcategorias' => $cat->subcategorias->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]),
            ])
        ];
    }

    public function getTrackingData(string $codigo): ?array
    {
        $codigo = trim($codigo);
        if ($codigo === '') return null;

        $query = \App\Models\Pedido::with(['envio']);
        if (ctype_digit($codigo)) {
            $query->where('id', (int) $codigo)->orWhere('codigo', $codigo);
        } else {
            $query->where('codigo', $codigo);
        }

        $pedido = $query->first();

        return $pedido ? [
            'id' => $pedido->id,
            'codigo' => $pedido->codigo,
            'estado' => $pedido->estado,
            'total' => (float) $pedido->total,
            'fecha' => $pedido->created_at ? $pedido->created_at->toDateTimeString() : null,
            'envio' => $pedido->envio ? [
                'estado' => $pedido->envio->estado,
                'tracking' => $pedido->envio->tracking,
            ] : null,
        ] : null;
    }

    private function applySmartSearch(Builder $query, string $search): Builder
    {
        $search = mb_strtolower(trim($search), 'UTF-8');
        if (empty($search)) return $query;

        $stopWords = [' de ', ' para ', ' con ', ' el ', ' la ', ' los ', ' las ', ' un ', ' una ', ' unos ', ' unas ', ' en '];
        $cleanSearch = str_replace($stopWords, ' ', ' ' . $search . ' ');
        $cleanSearch = trim(preg_replace('/\s+/', ' ', $cleanSearch));

        $rawTerms = array_filter(explode(' ', $cleanSearch));
        $synonyms = [
            'celular' => ['smartphone', 'movil', 'teléfono', 'telefono', 'iphone'],
            'laptop' => ['portatil', 'portátil', 'notebook', 'computadora', 'pc', 'macbook'],
            'audifono' => ['auricular', 'headset', 'casco', 'earpod', 'airpod'],
            'nevera' => ['refrigeradora', 'refrigerador', 'frigorifico'],
            'televisor' => ['pantalla', 'smart tv', 'televisión'],
        ];

        $expandedTermsGroup = [];
        foreach ($rawTerms as $term) {
            $variations = [$term];
            if (strlen($term) > 3) {
                if (substr($term, -2) === 'es') $variations[] = substr($term, 0, -2);
                elseif (substr($term, -1) === 's') $variations[] = substr($term, 0, -1);
            }
            foreach ($variations as $var) {
                if (isset($synonyms[$var])) $variations = array_merge($variations, $synonyms[$var]);
            }
            $expandedTermsGroup[] = array_unique($variations);
        }

        $query->where(function($q) use ($expandedTermsGroup) {
            foreach ($expandedTermsGroup as $variations) {
                $q->where(function($subQ) use ($variations) {
                    foreach ($variations as $var) {
                        $subQ->orWhere('producto.nombre', 'like', '%' . $var . '%')
                             ->orWhere('producto.descripcion', 'like', '%' . $var . '%')
                             ->orWhereHas('marca', fn($m) => $m->where('nombre', 'like', '%' . $var . '%'))
                             ->orWhereHas('categorias', fn($c) => $c->where('categoria.nombre', 'like', '%' . $var . '%'));
                    }
                });
            }
        });

        $escapedSearch = DB::getPdo()->quote('%' . $search . '%');
        $exactSearch = DB::getPdo()->quote($search);
        $query->orderByRaw("CASE WHEN producto.nombre = {$exactSearch} THEN 1 WHEN producto.nombre LIKE {$escapedSearch} THEN 2 ELSE 3 END ASC");

        return $query;
    }

    private function preloadStocks(array $varianteIds): void
    {
        if (self::$almacenEcommerceIdMemo === null) {
            self::$almacenEcommerceIdMemo = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
        }
        $toLoad = array_diff($varianteIds, array_keys(self::$ecommerceStocksMemo));
        if (!empty($toLoad)) {
            $stocks = DB::table('stock_almacen')
                ->where('almacen_id', self::$almacenEcommerceIdMemo)
                ->whereIn('variante_id', $toLoad)
                ->pluck('cantidad', 'variante_id')
                ->toArray();
            foreach($toLoad as $id) {
                self::$ecommerceStocksMemo[$id] = $stocks[$id] ?? 0;
            }
        }
    }

    private function formatProducto(Producto $prod): object
    {
        $variante = $prod->variantes->first();
        $precio_actual = $variante ? (float) $variante->precio : 0;
        $imagen = $prod->imagenes->first();
        $imagen_url = $imagen ? $imagen->url : null;
        $precio_anterior = null;
        $descuento = 0;
        
        $isBombaCyber = $prod->categorias && $prod->categorias->contains('slug', 'cyber-bombas');
        $isRetiro = $prod->categorias && $prod->categorias->contains('slug', 'retiro-inmediato');
        
        if ($isBombaCyber || $isRetiro) {
            $descuento = 15 + ($prod->id % 45);
            $precio_anterior = round($precio_actual / (1 - ($descuento / 100)), 2);
        }

        $stock = 0;
        if ($variante) {
            $vId = $variante->id;
            if (self::$almacenEcommerceIdMemo === null) {
                self::$almacenEcommerceIdMemo = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
            }
            if (!array_key_exists($vId, self::$ecommerceStocksMemo)) {
                $stockRow = DB::table('stock_almacen')->where('almacen_id', self::$almacenEcommerceIdMemo)->where('variante_id', $vId)->first();
                self::$ecommerceStocksMemo[$vId] = $stockRow ? (int)$stockRow->cantidad : 0;
            }
            $stock = self::$ecommerceStocksMemo[$vId];
        }

        return (object)[
            'id' => $prod->id,
            'nombre' => $prod->nombre,
            'slug' => $prod->slug ?? null,
            'descripcion' => $prod->descripcion,
            'garantias' => $prod->garantias,
            'marca' => $prod->marca ? $prod->marca->nombre : null,
            'marca_id' => $prod->marca_id,
            'precio_actual' => $precio_actual,
            'imagen' => $imagen_url,
            'precio_anterior' => $precio_anterior,
            'descuento' => $descuento,
            'stock' => $stock,
            'categorias' => $prod->categorias ? $prod->categorias->pluck('slug')->toArray() : [],
            'retiro_tienda' => (bool) $prod->retiro_tienda,
            'envio_domicilio' => (bool) $prod->envio_domicilio,
        ];
    }
}

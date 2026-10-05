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
                ->where('activa', true)->orderBy('orden')->orderBy('id')
                ->where(function ($q) {
                    $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
                })
                ->get();

            // Cargar solo 10 productos por categoría (no todos)
            $catIds = $categorias->pluck('id')->toArray();
            $productosPorCat = [];
            foreach ($catIds as $catId) {
                $productosPorCat[$catId] = Producto::where('activo', 1)
                    ->whereHas('categorias', fn($q) => $q->where('categoria.id', $catId))
                    ->with(['marca', 'variantes', 'imagenes', 'categorias'])
                    ->limit(10)
                    ->get();
            }

            $allVarianteIds = collect($productosPorCat)->flatten()->map(fn($p) => $p->variantes->first()?->id)->filter()->toArray();
            $this->preloadStocks($allVarianteIds);

            return $categorias->map(function ($cat) use ($productosPorCat) {
                $prods = $productosPorCat[$cat->id] ?? collect();
                return [
                    ...($this->getCategoryMenu()->firstWhere('id', $cat->id) ?? []),
                    'descripcion' => $cat->descripcion,
                    'productos' => $prods->map(fn($prod) => $this->formatProducto($prod)),
                ];
            });
        });

        $mejorSemana = Cache::remember('home_mejor_semana', 3600, function () {
            $productos = Producto::where('activo', 1)
                ->whereHas('categorias', fn($q) => $q->where('categoria.activa', true))
                ->with(['marca', 'variantes', 'imagenes'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();
                
            $varianteIds = $productos->map(fn($p) => $p->variantes->first()?->id)->filter()->toArray();
            $this->preloadStocks($varianteIds);

            return $productos->map(fn($prod) => $this->formatProducto($prod));
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

        $categorias = $this->getCachedBaseCategories();

        $query = Producto::where('activo', 1)->whereHas('categorias', fn($q) => $q->where('categoria.activa', true))->with(['marca', 'variantes', 'imagenes', 'categorias']);

        $categoriaActiva = null;
        $subcategoriaActiva = null;

        // Resolver categorías usando las ya cacheadas (0 queries extra)
        if (!empty($filters['categoria_id'])) {
            $selected = Categoria::where('activa', true)->find((int) $filters['categoria_id']);
            if ($selected) {
                $root = $selected;
                while ($root->categoria_padre_id) $root = $root->padre;
                $categoriaActiva = $root;
                $subcategoriaActiva = $selected->id === $root->id ? null : $selected;
                $query->whereHas('categorias', fn($q) => $q->where('categoria.id', $selected->id));
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($subcategoriaParam && $categoriaParam) {
            $catPadre = $categorias->first(fn($c) => $c->nombre === $categoriaParam);
            if ($catPadre) {
                $subcat = $catPadre->subcategorias->first(fn($s) => $s->nombre === $subcategoriaParam);
                if ($subcat) {
                    $subcategoriaActiva = $subcat;
                    $categoriaActiva = $catPadre;
                    $query->whereHas('categorias', fn($q) => $q->where('categoria.id', $subcat->id));
                }
            }
        } elseif ($subcategoriaParam) {
            foreach ($categorias as $cat) {
                $subcat = $cat->subcategorias->first(fn($s) => $s->nombre === $subcategoriaParam);
                if ($subcat) {
                    $subcategoriaActiva = $subcat;
                    $categoriaActiva = $cat;
                    $query->whereHas('categorias', fn($q) => $q->where('categoria.id', $subcat->id));
                    break;
                }
            }
        } elseif ($categoriaParam) {
            $cat = $categorias->first(fn($c) => $c->nombre === $categoriaParam);
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

        if ($precioMin !== null && $precioMin !== '') {
            $query->whereHas('variantes', fn($q) => $q->where('precio', '>=', (float)$precioMin));
        }
        if ($precioMax !== null && $precioMax !== '') {
            $query->whereHas('variantes', fn($q) => $q->where('precio', '<=', (float)$precioMax));
        }

        if ($sort === 'precio_asc' || $sort === 'precio_desc') {
            $direction = $sort === 'precio_asc' ? 'asc' : 'desc';
            $query->orderBy(
                \App\Models\Variante::select('precio')
                    ->whereColumn('producto_id', 'producto.id')
                    ->orderBy('precio', 'asc')
                    ->limit(1),
                $direction
            );
        } elseif ($sort === 'descuento') {
            $query->orderBy('id', 'desc');
        } else {
            if (!$searchQuery) {
                $query->orderBy('id', 'desc');
            }
        }

        $paginator = $query->paginate(24)->withQueryString();
        $productosModelos = collect($paginator->items());

        $varianteIds = $productosModelos->map(fn($p) => $p->variantes->first()?->id)->filter()->toArray();
        $this->preloadStocks($varianteIds);

        $productosFormateados = $productosModelos->map(fn($prod) => $this->formatProducto($prod))->values();

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
            'productos' => [
                'data' => $productosFormateados,
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'links' => $paginator->linkCollection()->toArray()
            ],
            'categorias' => $this->getCategoryMenu(),
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

        $query = Producto::where('activo', 1)->whereHas('categorias', fn($q) => $q->where('categoria.activa', true))->with(['marca', 'variantes', 'imagenes', 'categorias']);
        $this->applySmartSearch($query, $q);

        $productos = $query->limit(8)->get();
        
        $varianteIds = $productos->take(6)->map(fn($p) => $p->variantes->first()?->id)->filter()->toArray();
        $this->preloadStocks($varianteIds);

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
                ->where('activa', true)
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

        $categorias = $this->getCachedBaseCategories();

        $varianteIds = collect([$producto])->merge($recomendadosQuery ?? collect())
            ->map(fn($p) => $p->variantes->first()?->id)->filter()->toArray();
        $this->preloadStocks($varianteIds);

        return [
            'producto' => $this->formatProducto($producto),
            'detalles' => [
                'especificaciones' => $producto->productoEspecificaciones->map(fn($pe) => ['nombre' => $pe->clave, 'valor' => $pe->valor]),
                'todas_imagenes' => $producto->imagenes->pluck('url')
            ],
            'recomendados' => $recomendados,
            'categorias' => $this->getCategoryMenu()
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

    /**
     * Categorías base cacheadas — reutilizadas por Catálogo, Producto y Home.
     */
    private function getCachedBaseCategories(): Collection
    {
        return Cache::remember('catalog_categorias_base', 3600, function () {
            return Categoria::whereNull('categoria_padre_id')
                ->where('activa', true)->orderBy('orden')->orderBy('id')
                ->where(function ($q) {
                    $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
                })
                ->with(['subcategorias' => fn($q) => $q->where('activa', true)->orderBy('orden')])
                ->get();
        });
    }

    public function getCategoryMenu(): Collection
    {
        return Cache::remember('home_categorias_menu', 3600, function () {
            $categories = Categoria::where('activa', true)->orderBy('orden')->orderBy('id')->get(['id', 'nombre', 'slug', 'categoria_padre_id']);
            $children = $categories->groupBy(fn($category) => $category->categoria_padre_id ?? 0);
            $brands = DB::table('producto_categoria as pc')
                ->join('producto as p', 'p.id', '=', 'pc.producto_id')
                ->join('marca as m', 'm.id', '=', 'p.marca_id')
                ->where('p.activo', true)->whereNull('p.deleted_at')
                ->select('pc.categoria_id', 'm.id', 'm.nombre')->distinct()->orderBy('m.nombre')->get()->groupBy('categoria_id');
            $node = function ($category) use (&$node, $children, $brands) {
                return ['id' => $category->id, 'nombre' => $category->nombre, 'slug' => $category->slug,
                    'subcategorias' => ($children[$category->id] ?? collect())->map($node)->values(),
                    'marcas' => ($brands[$category->id] ?? collect())->map(fn($brand) => ['id' => $brand->id, 'nombre' => $brand->nombre])->values()];
            };
            return ($children[0] ?? collect())->map($node)->values();
        });
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
        $precio_anterior = $variante && (float) $variante->precio_anterior > $precio_actual
            ? (float) $variante->precio_anterior : null;
        $descuento = $precio_anterior
            ? (int) round(100 * (1 - $precio_actual / $precio_anterior)) : 0;

        $stock = 0;
        if ($variante) {
            $vId = $variante->id;
            // Usar solo el memo precargado por preloadStocks(); si no está, asumir 0
            // en lugar de hacer una query individual (eliminando N+1)
            if (array_key_exists($vId, self::$ecommerceStocksMemo)) {
                $stock = self::$ecommerceStocksMemo[$vId];
            }
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
            'categorias' => $prod->relationLoaded('categorias') && $prod->categorias ? $prod->categorias->pluck('slug')->toArray() : [],
            'retiro_tienda' => (bool) $prod->retiro_tienda,
            'envio_domicilio' => (bool) $prod->envio_domicilio,
        ];
    }
}

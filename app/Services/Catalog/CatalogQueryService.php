<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\Categoria;
use App\Models\ConfiguracionSitio;
use App\Models\Marca;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Variante;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CatalogQueryService
{
    private array $ecommerceStocksMemo = [];

    private ?int $almacenEcommerceIdMemo = null;

    private ?array $pickupOptionsMemo = null;

    public function getHomeData(): array
    {
        $categorias = $this->getCachedBaseCategories();
        // Cache only membership. Mutable images, prices and stock are loaded in batches.
        $idsByCategory = Cache::remember('home_category_product_ids_v2', 3600, function () use ($categorias) {
            $ids = [];
            foreach ($categorias as $category) {
                $ids[$category->id] = Producto::where('activo', true)
                    ->whereHas('categorias', fn ($q) => $q->where('categoria.id', $category->id))
                    ->orderBy('id')->limit(10)->pluck('id')->all();
            }
            return $ids;
        });
        // Keep category metadata for navigation, but load only the displayed shelves.
        // Preserve the first two categories so the existing fallback order stays stable.
        $available = $categorias->filter(fn ($category) => !empty($idsByCategory[$category->id]))->values();
        $electro = $available->first(fn ($category) => mb_strtolower($category->nombre) === 'electrohogar');
        $tech = $available->first(fn ($category) => str_contains(mb_strtolower($category->nombre), 'tecnolog'));
        $third = $available->first(function ($category) use ($electro, $tech, $available) {
            return $category->id !== ($electro?->id ?? $available->get(0)?->id)
                && $category->id !== ($tech?->id ?? $available->get(1)?->id);
        });
        $displayed = $available->take(2)->pluck('id')->merge(collect([$electro?->id, $tech?->id, $third?->id])->filter())->unique();
        $idsByCategory = array_intersect_key($idsByCategory, array_flip($displayed->all()));
        $products = Producto::where('activo', true)->whereIn('id', collect($idsByCategory)->flatten()->unique()->all())
            ->with(['marca', 'variantes' => fn ($q) => $q->where('activo', true)->orderBy('precio')->orderBy('id'), 'imagenes', 'categorias'])->get()->keyBy('id');
        $weeklyIds = Cache::remember('home_weekly_product_ids_v2', 3600, fn () => Producto::where('activo', true)
            ->whereHas('categorias', fn ($q) => $q->where('categoria.activa', true))
            ->orderByDesc('created_at')->orderByDesc('id')->limit(10)->pluck('id')->all());
        $weeklyProducts = Producto::where('activo', true)->whereIn('id', $weeklyIds)
            ->with(['marca', 'variantes' => fn ($q) => $q->where('activo', true)->orderBy('precio')->orderBy('id'), 'imagenes'])->get()->keyBy('id');
        $this->preloadStocks($products->values()->merge($weeklyProducts->values())
            ->flatMap(fn ($product) => $product->variantes->pluck('id'))->filter()->unique()->all());
        $menu = $this->getCategoryMenu();
        $categoriaProductos = $categorias->map(function ($category) use ($idsByCategory, $products, $menu) {
            return [
                ...($menu->firstWhere('id', $category->id) ?? []),
                'descripcion' => $category->descripcion,
                'productos' => collect($idsByCategory[$category->id] ?? [])->map(fn ($id) => $products->get($id))
                    ->filter()->map(fn ($product) => $this->formatProducto($product))->values(),
            ];
        });
        $mejorSemana = collect($weeklyIds)->map(fn ($id) => $weeklyProducts->get($id))->filter()
            ->map(fn ($product) => $this->formatProducto($product))->values();

        $banners = Cache::remember('home_banners', 3600, function () {
            $now = now()->toDateTimeString();

            return DB::table('banners')
                ->where('activo', 1)
                ->where(function ($q) use ($now) {
                    $q->whereNull('fecha_inicio')->orWhere('fecha_inicio', '<=', $now);
                })
                ->where(function ($q) use ($now) {
                    $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $now);
                })
                ->orderBy('orden')
                ->get();
        });

        $topMarcas = Cache::remember('home_top_marcas', 3600, function () {
            $counts = DB::table('producto')
                ->where('activo', 1)
                ->whereNotNull('marca_id')
                ->select('marca_id', DB::raw('count(*) as total'))
                ->groupBy('marca_id')
                ->orderByDesc('total')
                ->limit(20)
                ->get();
            $marcaIds = $counts->pluck('marca_id')->toArray();
            if (empty($marcaIds)) return collect();
            $marcas = Marca::whereIn('id', $marcaIds)->get()->keyBy('id');
            return $counts->map(function ($item) use ($marcas) {
                return ['nombre' => $marcas->get($item->marca_id)->nombre ?? ''];
            })->filter(fn($m) => $m['nombre'] !== '')->values();
        });

        // A backup may reference media files that were never included. Retain
        // their database records, but keep unavailable local slides out of the carousel.
        if (config('filesystems.default') !== 'azure') {
            $banners = $banners->filter(function ($banner) {
                $url = (string) ($banner->imagen_url ?? '');
                return !str_starts_with($url, '/storage/')
                    || is_file(storage_path('app/public/'.substr($url, 9)));
            })->values();
        }

        return [
            'categoriaProductos' => $categoriaProductos,
            'mejorSemana' => $mejorSemana,
            'banners' => $banners,
            'topMarcas' => $topMarcas,
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

        $query = Producto::where('activo', 1)->whereHas('categorias', fn ($q) => $q->where('categoria.activa', true))->with(['marca', 'variantes' => fn ($q) => $q->where('activo', true)->orderBy('precio')->orderBy('id'), 'imagenes', 'categorias']);

        $categoriaActiva = null;
        $subcategoriaActiva = null;

        // Resolver categorías con soporte recursivo de subcategorías (0 lazy loads)
        if (! empty($filters['categoria_id'])) {
            $selected = Categoria::where('activa', true)->find((int) $filters['categoria_id']);
            if ($selected) {
                $root = $this->getRootCategory($selected);
                $categoriaActiva = $root;
                $subcategoriaActiva = $selected->id === $root->id ? null : $selected;
                $catIds = $this->getAllCategoryDescendantIds($selected->id);
                $query->whereHas('categorias', fn ($q) => $q->whereIn('categoria.id', $catIds));
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($subcategoriaParam && $categoriaParam) {
            $catPadre = $categorias->first(fn ($c) => $c->nombre === $categoriaParam)
                ?? Categoria::where('nombre', $categoriaParam)->where('activa', true)->first();
            if ($catPadre) {
                $subcat = Categoria::where('nombre', $subcategoriaParam)
                    ->where('categoria_padre_id', $catPadre->id)
                    ->where('activa', true)
                    ->first()
                    ?? ($catPadre->subcategorias ? $catPadre->subcategorias->first(fn ($s) => $s->nombre === $subcategoriaParam) : null);
                if ($subcat) {
                    $subcategoriaActiva = $subcat;
                    $categoriaActiva = $catPadre;
                    $catIds = $this->getAllCategoryDescendantIds($subcat->id);
                    $query->whereHas('categorias', fn ($q) => $q->whereIn('categoria.id', $catIds));
                }
            }
        } elseif ($subcategoriaParam) {
            $subcat = Categoria::where('nombre', $subcategoriaParam)->where('activa', true)->first();
            if ($subcat) {
                $root = $this->getRootCategory($subcat);
                $categoriaActiva = $root;
                $subcategoriaActiva = $subcat;
                $catIds = $this->getAllCategoryDescendantIds($subcat->id);
                $query->whereHas('categorias', fn ($q) => $q->whereIn('categoria.id', $catIds));
            }
        } elseif ($categoriaParam) {
            $cat = $categorias->first(fn ($c) => $c->nombre === $categoriaParam)
                ?? Categoria::where('nombre', $categoriaParam)->where('activa', true)->first();
            if ($cat) {
                $root = $this->getRootCategory($cat);
                $categoriaActiva = $root;
                $subcategoriaActiva = $cat->id === $root->id ? null : $cat;
                $catIds = $this->getAllCategoryDescendantIds($cat->id);
                $query->whereHas('categorias', fn ($q) => $q->whereIn('categoria.id', $catIds));
            }
        }

        if (! $categoriaActiva && ! $subcategoriaActiva && $searchQuery) {
            $matchedCat = Categoria::where('nombre', 'like', $searchQuery)->first();
            if ($matchedCat) {
                $root = $this->getRootCategory($matchedCat);
                $categoriaActiva = $root;
                $subcategoriaActiva = $matchedCat->id === $root->id ? null : $matchedCat;
            }
        }

        if ($searchQuery) {
            $this->applySmartSearch($query, $searchQuery);
        }

        $marcaCounts = (clone $query)->withoutEagerLoads()
            ->whereNotNull('marca_id')
            ->select('marca_id', DB::raw('count(*) as count'))
            ->groupBy('marca_id')->toBase()
            ->get();

        $marcasIds = $marcaCounts->pluck('marca_id')->filter()->toArray();
        $marcas = empty($marcasIds) ? collect() : Marca::whereIn('id', $marcasIds)->get()->keyBy('id');

        $marcasDisponibles = $marcaCounts->map(function ($item) use ($marcas) {
            $marca = $marcas->get($item->marca_id);

            return [
                'nombre' => $marca ? $marca->nombre : 'Sin marca',
                'count' => $item->count,
            ];
        })->filter(fn ($m) => $m['nombre'] !== 'Sin marca')->sortByDesc('count')->values();

        if ($marcaFilter) {
            $query->whereHas('marca', fn ($q) => $q->where('nombre', $marcaFilter));
        }

        if (($precioMin !== null && $precioMin !== '') || ($precioMax !== null && $precioMax !== '')) {
            $displayPrice = fn () => \App\Services\Storefront\VariantPricing::displayQuery();
            if ($precioMin !== null && $precioMin !== '') $query->where($displayPrice(), '>=', (float) $precioMin);
            if ($precioMax !== null && $precioMax !== '') $query->where($displayPrice(), '<=', (float) $precioMax);
        }

        if ($sort === 'precio_asc' || $sort === 'precio_desc') {
            $direction = $sort === 'precio_asc' ? 'asc' : 'desc';
            $query->orderBy(
                \App\Services\Storefront\VariantPricing::displayQuery(),
                $direction
            );
        } elseif ($sort === 'descuento') {
            $query->orderByDesc(\App\Services\Storefront\VariantPricing::displayQuery(true));
            $query->orderByDesc('producto.id');
        } else {
            if (! $searchQuery) {
                $query->orderBy('id', 'desc');
            }
        }

        $paginator = $query->paginate(24)->withQueryString();
        $productosModelos = collect($paginator->items());

        $varianteIds = $productosModelos->flatMap(fn ($p) => $p->variantes->pluck('id'))->filter()->toArray();
        $this->preloadStocks($varianteIds);

        $productosFormateados = $productosModelos->map(fn ($prod) => $this->formatProducto($prod))->values();

        $now = now()->toDateTimeString();
        $lateralBanners = DB::table('banners')
            ->where('activo', 1)
            ->where('posicion', 'lateral')
            ->where(function ($q) use ($now) {
                $q->whereNull('fecha_inicio')->orWhere('fecha_inicio', '<=', $now);
            })
            ->where(function ($q) use ($now) {
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
                'links' => $paginator->linkCollection()->toArray(),
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

        $query = Producto::where('activo', 1)->whereHas('categorias', fn ($q) => $q->where('categoria.activa', true))->with(['marca', 'variantes' => fn ($q) => $q->where('activo', true)->orderBy('precio')->orderBy('id'), 'imagenes', 'categorias']);
        $this->applySmartSearch($query, $q);

        $productos = $query->limit(8)->get();

        $varianteIds = $productos->take(6)->flatMap(fn ($p) => $p->variantes->pluck('id'))->filter()->toArray();
        $this->preloadStocks($varianteIds);

        $formateados = $productos->take(6)->map(fn ($p) => $this->formatProducto($p));

        $marcas = $productos->pluck('marca.nombre')->filter()->unique()->values();
        if ($marcas->count() < 3) {
            $topMarcas = Marca::withCount('productos')
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
            $sugerencias[] = $q.' en '.$categorias->first();
        }
        if ($marcas->count() > 0) {
            $sugerencias[] = $marcas->first().' '.$q;
        }

        return [
            'productos' => $formateados,
            'marcas' => $marcas,
            'categorias' => $categorias,
            'sugerencias' => $sugerencias,
        ];
    }

    public function getProductData(string $slugOrId): array
    {
        $producto = Producto::with([
            'marca',
            'variantes' => fn ($q) => $q->where('activo', true)->orderBy('precio')->orderBy('id'),
            'imagenes',
            'productoEspecificaciones',
            'categorias',
        ])
            ->where('activo', true)
            ->where(function ($query) use ($slugOrId) {
                $query->where('slug', $slugOrId)->orWhere('id', $slugOrId);
            })
            ->firstOrFail();

        $categoriasIds = $producto->categorias->pluck('id')->toArray();
        $recomendados = collect();
        if (! empty($categoriasIds)) {
            $recomendadosQuery = Producto::where('activo', 1)
                ->where('id', '!=', $producto->id)
                ->whereHas('categorias', fn ($q) => $q->whereIn('categoria.id', $categoriasIds))
                ->with(['marca', 'variantes' => fn ($q) => $q->where('activo', true)->orderBy('precio')->orderBy('id'), 'imagenes'])
                ->inRandomOrder()
                ->limit(4)
                ->get();
        }

        $categorias = $this->getCachedBaseCategories();

        $varianteIds = collect([$producto])->merge($recomendadosQuery ?? collect())
            ->flatMap(fn ($p) => $p->variantes->pluck('id'))->filter()->toArray();
        $this->preloadStocks($varianteIds);
        $recomendados = ($recomendadosQuery ?? collect())->map(fn ($p) => $this->formatProducto($p));

        return [
            'producto' => $this->formatProducto($producto, true),
            'detalles' => [
                'especificaciones' => $producto->productoEspecificaciones->map(fn ($pe) => ['nombre' => $pe->clave, 'valor' => $pe->valor]),
                'todas_imagenes' => $producto->imagenes->pluck('url'),
            ],
            'recomendados' => $recomendados,
            'categorias' => $this->getCategoryMenu(),
        ];
    }

    public function getTrackingData(string $codigo): ?array
    {
        $codigo = trim($codigo);
        if ($codigo === '') {
            return null;
        }

        $query = Pedido::with(['envio']);
        $query->where('codigo', $codigo);

        $pedido = $query->first();

        return $pedido ? [
            'id' => $pedido->id,
            'codigo' => $pedido->codigo,
            'estado' => $pedido->estado,
            'total' => (float) $pedido->total,
            'fecha' => $pedido->created_at ? $pedido->created_at->toDateTimeString() : null,
            'envio' => ($pedido->envio || $pedido->tracking_number) ? [
                'estado' => $pedido->envio?->estado,
                'tracking' => $pedido->tracking_number ?: $pedido->envio?->tracking,
                'courier' => $pedido->courier_name ?: $pedido->envio?->proveedor,
            ] : null,
        ] : null;
    }

    private function applySmartSearch(Builder $query, string $search): Builder
    {
        $search = mb_strtolower(trim($search), 'UTF-8');
        if (empty($search)) {
            return $query;
        }

        $stopWords = [' de ', ' para ', ' con ', ' el ', ' la ', ' los ', ' las ', ' un ', ' una ', ' unos ', ' unas ', ' en '];
        $cleanSearch = str_replace($stopWords, ' ', ' '.$search.' ');
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
                if (substr($term, -2) === 'es') {
                    $variations[] = substr($term, 0, -2);
                } elseif (substr($term, -1) === 's') {
                    $variations[] = substr($term, 0, -1);
                }
            }
            foreach ($variations as $var) {
                if (isset($synonyms[$var])) {
                    $variations = array_merge($variations, $synonyms[$var]);
                }
            }
            $expandedTermsGroup[] = array_unique($variations);
        }

        $query->where(function ($q) use ($expandedTermsGroup) {
            foreach ($expandedTermsGroup as $variations) {
                $q->where(function ($subQ) use ($variations) {
                    foreach ($variations as $var) {
                        $subQ->orWhere('producto.nombre', 'like', '%'.$var.'%')
                            ->orWhere('producto.descripcion', 'like', '%'.$var.'%');
                    }
                    // One relationship lookup per group, rather than per synonym.
                    $subQ->orWhereHas('marca', function ($m) use ($variations) {
                        $m->where(function ($names) use ($variations) {
                            foreach ($variations as $var) $names->orWhere('nombre', 'like', '%'.$var.'%');
                        });
                    })->orWhereHas('categorias', function ($c) use ($variations) {
                        $c->where(function ($names) use ($variations) {
                            foreach ($variations as $var) $names->orWhere('categoria.nombre', 'like', '%'.$var.'%');
                        });
                    });
                });
            }
        });

        $escapedSearch = DB::getPdo()->quote('%'.$search.'%');
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
                ->with(['subcategorias' => fn ($q) => $q->where('activa', true)->orderBy('orden')])
                ->get();
        });
    }

    public function getCategoryMenu(): Collection
    {
        return Cache::remember('home_categorias_menu_v3', 3600, function () {
            $categories = Categoria::where('activa', true)->orderBy('orden')->orderBy('id')->get(['id', 'nombre', 'slug', 'categoria_padre_id']);
            $children = $categories->groupBy(fn ($category) => $category->categoria_padre_id ?? 0);
            $brands = DB::table('producto_categoria as pc')
                ->join('producto as p', 'p.id', '=', 'pc.producto_id')
                ->join('marca as m', 'm.id', '=', 'p.marca_id')
                ->where('p.activo', true)->whereNull('p.deleted_at')
                ->select('pc.categoria_id', 'm.id', 'm.nombre')->distinct()->orderBy('m.nombre')->get()->groupBy('categoria_id');
            $node = function ($category) use (&$node, $children, $brands) {
                return ['id' => $category->id, 'nombre' => $category->nombre, 'slug' => $category->slug,
                    'subcategorias' => ($children[$category->id] ?? collect())->map($node)->values(),
                    'marcas' => $category->categoria_padre_id ? [] : ($brands[$category->id] ?? collect())->map(fn ($brand) => ['id' => $brand->id, 'nombre' => $brand->nombre])->values()];
            };

            return ($children[0] ?? collect())->map($node)->values();
        });
    }

    private function preloadStocks(array $varianteIds): void
    {
        $this->almacenEcommerceIdMemo = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
        if (!$varianteIds) return;
        $stocks = DB::table('stock_almacen')->where('almacen_id', $this->almacenEcommerceIdMemo)
            ->whereIn('variante_id', $varianteIds)->pluck('cantidad', 'variante_id')->all();
        $reserved = DB::table('reservas_stock')->whereIn('variante_id',$varianteIds)->where('expires_at','>',now())->where('session_id','!=',session()->getId())
            ->selectRaw('variante_id, SUM(cantidad) as quantity')->groupBy('variante_id')->pluck('quantity','variante_id');
        foreach ($varianteIds as $id) $this->ecommerceStocksMemo[$id] = max(0, ($stocks[$id] ?? 0) - ($reserved[$id] ?? 0));
    }

    private function getRootCategory(Categoria $cat): Categoria
    {
        $rootId = $cat->id;
        while (true) {
            $parentId = DB::table('categoria')->where('id', $rootId)->value('categoria_padre_id');
            if (! $parentId) {
                break;
            }
            $rootId = (int) $parentId;
        }

        return $rootId === $cat->id ? $cat : (Categoria::find($rootId) ?? $cat);
    }

    private function getAllCategoryDescendantIds(int $categoryId): array
    {
        $ids = [$categoryId];
        $current = [$categoryId];
        while (true) {
            $next = DB::table('categoria')
                ->whereIn('categoria_padre_id', $current)
                ->where('activa', 1)
                ->whereNull('deleted_at')
                ->pluck('id')
                ->toArray();
            $next = array_diff($next, $ids);
            if (empty($next)) {
                break;
            }
            $ids = array_merge($ids, $next);
            $current = $next;
        }

        return $ids;
    }

    public function formatProducts(Collection $products): Collection
    {
        $this->preloadStocks($products->flatMap(fn($product)=>$product->variantes->pluck('id'))->unique()->all());
        return $products->map(fn($product)=>$this->formatProducto($product));
    }

    private function formatProducto(Producto $prod, bool $detail = false): object
    {
        $variants = $prod->variantes->sortBy(fn($v)=>[\App\Services\Storefront\VariantPricing::quote($v)['price'],$v->id]);
        $variante = $variants->first(fn ($v) => ($this->ecommerceStocksMemo[$v->id] ?? 0) > 0) ?? $variants->first();
        $precio_actual = $variante ? \App\Services\Storefront\VariantPricing::quote($variante)['price'] : 0;
        $imagen = $prod->imagenes->first();
        $imagen_url = $imagen ? $imagen->url : null;
        $reference = $variante ? max((float)$variante->precio_anterior,(float)$variante->precio) : 0;
        $precio_anterior = $reference > $precio_actual ? $reference : null;
        $descuento = $precio_anterior
            ? (int) round(100 * (1 - $precio_actual / $precio_anterior)) : 0;

        $stock = 0;
        if ($variante) {
            $vId = $variante->id;
            // Usar solo el memo precargado por preloadStocks(); si no está, asumir 0
            // en lugar de hacer una query individual (eliminando N+1)
            if (array_key_exists($vId, $this->ecommerceStocksMemo)) {
                $stock = $this->ecommerceStocksMemo[$vId];
            }
        }

        return (object) [
            'id' => $prod->id,
            'variante_id' => $variante?->id,
            'sku' => $variante?->sku,
            'variantes' => $detail ? $prod->variantes->map(fn ($v) => ['variante_id'=>$v->id, 'sku'=>$v->sku, 'label'=>$v->sku,
                'precio_actual'=>\App\Services\Storefront\VariantPricing::quote($v)['price'], 'precio_anterior'=>max((float)$v->precio_anterior,(float)$v->precio) > \App\Services\Storefront\VariantPricing::quote($v)['price'] ? max((float)$v->precio_anterior,(float)$v->precio) : null,
                'stock'=>$this->ecommerceStocksMemo[$v->id] ?? 0])->values() : [],
            'nombre' => $prod->nombre,
            'slug' => $prod->slug ?? null,
            'descripcion' => $detail ? $prod->descripcion : null,
            'garantias' => $detail ? $prod->garantias : null,
            'marca' => $prod->marca ? $prod->marca->nombre : null,
            'marca_id' => $prod->marca_id,
            'precio_actual' => $precio_actual,
            'imagen' => $imagen_url,
            'precio_anterior' => $precio_anterior,
            'descuento' => $descuento,
            'stock' => $stock,
            'categorias' => $prod->relationLoaded('categorias') ? $prod->categorias->pluck('slug')->toArray() : [],
            'retiro_tienda' => (bool) $prod->retiro_tienda && count($this->pickupOptionsMemo ??= \App\Services\Shipping\PickupService::options()) > 0,
            'envio_domicilio' => (bool) $prod->envio_domicilio,
        ];
    }
}

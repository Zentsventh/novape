<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ConfiguracionSitio;
use App\Services\Catalog\CatalogQueryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly CatalogQueryService $catalogQueryService
    ) {}

    public function index(): Response
    {
        $data = $this->catalogQueryService->getHomeData();

        return Inertia::render('Home', array_merge($data, [
            'appName' => config('app.name'),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]));
    }

    public function liveSearch(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $data = $this->catalogQueryService->getLiveSearchData($q);

        return response()->json($data);
    }

    public function catalogo(Request $request): Response
    {
        $filters = $request->only(['categoria', 'subcategoria', 'categoria_id', 'marca', 'precio_min', 'precio_max', 'q', 'sort']);
        // Category metadata stays cached in the query service; prices, stock and
        // image references must reflect the current catalog on each request.
        $data = $this->catalogQueryService->getCatalogData($filters);

        return Inertia::render('Catalogo', array_merge($data, [
            'filtros' => $filters,
            'totalProductos' => isset($data['productos']['data']) ? count($data['productos']['data']) : 0,
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]));
    }

    public function seguimiento(Request $request): Response
    {
        $codigo = trim((string) $request->query('codigo', ''));
        $pedidoData = $this->catalogQueryService->getTrackingData($codigo);

        return Inertia::render('Seguimiento', [
            'codigo' => $codigo,
            'pedido' => $pedidoData,
            'error' => ($codigo !== '' && !$pedidoData) ? 'No se encontro ningun pedido con ese codigo.' : null,
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]);
    }

    public function producto(string $slugOrId): Response
    {
        $data = $this->catalogQueryService->getProductData($slugOrId);

        return Inertia::render('Producto', array_merge($data, [
            'reviews' => [],
            'promedioEstrellas' => 0,
            'totalReviews' => 0,
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]));
    }
}

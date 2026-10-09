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
        $q = trim($request->validate(['q' => 'nullable|string|max:150'])['q'] ?? '');
        $data = $this->catalogQueryService->getLiveSearchData($q);

        return response()->json($data);
    }

    public function catalogo(Request $request): Response
    {
        $filters = $request->validate([
            'categoria' => 'nullable|string|max:150', 'subcategoria' => 'nullable|string|max:150',
            'categoria_id' => 'nullable|integer|min:1', 'marca' => 'nullable|string|max:150',
            'precio_min' => 'nullable|numeric|min:0', 'precio_max' => 'nullable|numeric|min:0',
            'q' => 'nullable|string|max:150', 'sort' => 'nullable|in:relevancia,precio_asc,precio_desc,descuento',
            'page' => 'nullable|integer|min:1',
        ]);
        if (isset($filters['precio_min'], $filters['precio_max']) && $filters['precio_min'] > $filters['precio_max']) {
            throw \Illuminate\Validation\ValidationException::withMessages(['precio_max' => 'El precio máximo debe ser mayor o igual al mínimo.']);
        }
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
        $codigo = trim($request->validate(['codigo' => 'nullable|string|max:100'])['codigo'] ?? '');
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
        $productId = $data['producto']->id;
        $reviews = \App\Models\Resena::where('producto_id', $productId)->where('aprobado', true);
        $total = (clone $reviews)->count();
        $average = round((float) (clone $reviews)->avg('calificacion'), 1);
        $own = auth()->check() ? \App\Models\Resena::where('producto_id', $productId)->where('usuario_id', auth()->id())->first()?->only(['calificacion', 'comentario', 'aprobado']) : null;

        return Inertia::render('Producto', array_merge($data, [
            'reviews' => $reviews->with('usuario:id,nombres')->latest()->paginate(10, ['*'], 'reviews_page')->through(fn ($review) => [
                'id' => $review->id, 'calificacion' => $review->calificacion, 'comentario' => $review->comentario,
                'nombre' => $review->usuario?->nombres ?? 'Comprador', 'fecha' => $review->created_at->toDateString()]),
            'promedioEstrellas' => $average,
            'totalReviews' => $total,
            'canReview' => ReviewController::eligible($productId, auth()->id()),
            'ownReview' => $own,
            'canonicalUrl' => url('/producto/'.($data['producto']->slug ?: $productId)),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]));
    }
}

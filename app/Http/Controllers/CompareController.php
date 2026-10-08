<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Catalog\CompareService;
use App\Models\ConfiguracionSitio;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CompareController extends Controller
{
    public function __construct(
        private readonly CompareService $compareService
    ) {}

    public function index(): Response
    {
        $compareIds = session('compare', []);
        
        $compareData = $this->compareService->getCompareData($compareIds);
        
        return Inertia::render('Comparador', [
            'productos' => $compareData['productos'],
            'especificacionesUnicas' => $compareData['especificacionesUnicas'],
            'logoUrl' => ConfiguracionSitio::obtener('logo_url')
        ]);
    }

    public function add(Request $request): RedirectResponse
    {
        $id = (int) $request->validate(['producto_id' => 'required|integer|exists:producto,id'])['producto_id'];
        $compare = session('compare', []);

        if (count($compare) >= 4 && !in_array($id, $compare)) {
            return back()->with('error', 'Solo puedes comparar hasta 4 productos a la vez.');
        }

        if (!in_array($id, $compare)) {
            $compare[] = $id;
            session(['compare' => $compare]);
            return back()->with('success', 'Producto agregado al comparador.');
        }

        return back()->with('success', 'El producto ya está en el comparador.');
    }

    public function remove(Request $request): RedirectResponse
    {
        $id = (int) $request->input('producto_id');
        $compare = session('compare', []);
        
        if (($key = array_search($id, $compare)) !== false) {
            unset($compare[$key]);
            session(['compare' => array_values($compare)]);
        }

        return back()->with('success', 'Producto removido del comparador.');
    }

    public function clear(): RedirectResponse
    {
        session()->forget('compare');
        return back()->with('success', 'Comparador limpiado.');
    }
}

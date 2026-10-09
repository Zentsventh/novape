<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Marketing\StoreBannerRequest;
use App\Http\Requests\Admin\Marketing\UpdateBannerRequest;
use App\Services\Admin\Marketing\MarketingService;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class BannerController extends Controller
{
    public function __construct(
        private readonly MarketingService $marketingService
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Banners/Index', [
            'banners' => $this->marketingService->getBanners(),
            'categorias' => \Illuminate\Support\Facades\DB::table('categoria')->select('id', 'nombre')->get(),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url')
        ]);
    }

    public function store(StoreBannerRequest $request)
    {
        $this->marketingService->createBanner($request->validated(), $request->file('imagen'));
        return redirect()->back()->with('success', 'Banner creado exitosamente.');
    }

    public function update(UpdateBannerRequest $request, int $id)
    {
        $this->marketingService->updateBanner($id, $request->validated(), $request->file('imagen'));
        return redirect()->back()->with('success', 'Banner actualizado.');
    }

    public function destroy(int $id)
    {
        $this->marketingService->deleteBanner($id);
        return redirect()->back()->with('success', 'Banner eliminado.');
    }
}

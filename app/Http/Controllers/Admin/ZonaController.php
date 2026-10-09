<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Settings\StoreZoneRequest;
use App\Http\Requests\Admin\Settings\UpdateZoneRequest;
use App\Services\Admin\Settings\ShippingAndPaymentService;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class ZonaController extends Controller
{
    public function __construct(
        private readonly ShippingAndPaymentService $shippingService
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Zonas/Index', [
            'zonas' => $this->shippingService->getZones(),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]);
    }

    public function store(StoreZoneRequest $request)
    {
        $this->shippingService->createZone($request->validated());
        return redirect()->back()->with('success', 'Zona creada correctamente.');
    }

    public function update(UpdateZoneRequest $request, int $id)
    {
        $this->shippingService->updateZone($id, $request->validated());
        return redirect()->back()->with('success', 'Zona actualizada.');
    }

    public function destroy(int $id)
    {
        $this->shippingService->deleteZone($id);
        return redirect()->back()->with('success', 'Zona eliminada.');
    }
}

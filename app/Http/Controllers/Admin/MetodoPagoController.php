<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Settings\StorePaymentMethodRequest;
use App\Http\Requests\Admin\Settings\UpdatePaymentMethodRequest;
use App\Services\Admin\Settings\ShippingAndPaymentService;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class MetodoPagoController extends Controller
{
    public function __construct(
        private readonly ShippingAndPaymentService $shippingService
    ) {}

    public function index()
    {
        return Inertia::render('Admin/MetodosPago/Index', [
            'metodos' => $this->shippingService->getPaymentMethods(),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]);
    }

    public function store(StorePaymentMethodRequest $request)
    {
        $this->shippingService->createPaymentMethod($request->validated());
        return redirect()->back()->with('success', 'Método de pago creado.');
    }

    public function update(UpdatePaymentMethodRequest $request, int $id)
    {
        $this->shippingService->updatePaymentMethod($id, $request->validated());
        return redirect()->back()->with('success', 'Método actualizado.');
    }

    public function destroy(int $id)
    {
        $this->shippingService->deletePaymentMethod($id);
        return redirect()->back()->with('success', 'Método eliminado.');
    }
}

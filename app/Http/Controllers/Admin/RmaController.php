<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRmaStatusRequest;
use App\Models\Devolucion;
use App\Services\RMA\UpdateRmaStatusService;

class RmaController extends Controller
{
    public function __construct(
        private readonly UpdateRmaStatusService $updateRmaStatusService
    ) {}

    public function index()
    {
        // Paginación directa aquí ya que es muy simple, pero evitamos lógica compleja.
        $devoluciones = Devolucion::orderBy('created_at', 'desc')->paginate(20);
        return response()->json($devoluciones);
    }

    public function updateStatus(UpdateRmaStatusRequest $request, int $id)
    {
        $this->updateRmaStatusService->execute($id, $request->validated());

        return back()->with('success', 'Estado de la devolución actualizado.');
    }
}

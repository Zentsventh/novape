<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\RmaStatusUpdateMail;
use App\Models\RmaRequest;
use App\Services\Admin\Warehouse\RmaProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class RmaRequestController extends Controller
{
    public function index()
    {
        $rmas = RmaRequest::with(['usuario', 'pedido', 'producto'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Rma/Index', [
            'rmas' => $rmas,
        ]);
    }

    public function show($id)
    {
        $rma = RmaRequest::with(['usuario', 'pedido.items.variante.producto', 'producto', 'items'])
            ->findOrFail($id);

        return Inertia::render('Admin/Rma/Show', [
            'rma' => $rma,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected,received,processed',
            'admin_notes' => 'nullable|string|max:5000',
            'items' => 'nullable|array|min:1',
            'items.*.pedido_item_id' => 'required|integer|distinct',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.condicion' => 'required|in:vendible,no_vendible',
        ]);

        $rma = app(RmaProcessingService::class)->updateStatus(
            (int) $id, $request->status, $request->admin_notes, (int) auth('admin')->id(), $request->input('items')
        );
        if ($rma->wasChanged('status')) {
            try {
                if ($rma->usuario) {
                    Mail::to($rma->usuario->email)->queue((new RmaStatusUpdateMail($rma))->afterCommit());
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo notificar el cambio RMA', ['rma_id' => $rma->id]);
            }
        }

        return redirect()->back()->with('success', 'Estado de la solicitud RMA actualizado.');
    }
}

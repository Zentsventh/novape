<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RmaRequest;
use Inertia\Inertia;
use Illuminate\Http\Request;

class RmaRequestController extends Controller
{
    public function index()
    {
        $rmas = RmaRequest::with(['usuario', 'pedido', 'producto'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Admin/Rma/Index', [
            'rmas' => $rmas
        ]);
    }

    public function show($id)
    {
        $rma = RmaRequest::with(['usuario', 'pedido.items.variante.producto', 'producto'])
            ->findOrFail($id);

        return Inertia::render('Admin/Rma/Show', [
            'rma' => $rma
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected,received,processed',
            'admin_notes' => 'nullable|string',
        ]);

        $rma = RmaRequest::findOrFail($id);
        
        $rma->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
        ]);

        // If processed and it's a return, we can optionally restore inventory
        if ($request->status === 'processed' && $rma->type === 'return') {
            // Find the specific item in the order to get the variant
            $pedido = $rma->pedido()->with('items.variante')->first();
            if ($pedido) {
                foreach ($pedido->items as $item) {
                    // If a specific product was selected, only restore that one
                    if ($rma->producto_id) {
                        if ($item->variante && $item->variante->producto_id == $rma->producto_id) {
                            $item->variante->increment('stock', $item->cantidad);
                        }
                    } else {
                        // Restore all items
                        if ($item->variante) {
                            $item->variante->increment('stock', $item->cantidad);
                        }
                    }
                }
            }
        }

        // Send email notification to user
        \Illuminate\Support\Facades\Mail::to($rma->usuario->email)->send(new \App\Mail\RmaStatusUpdateMail($rma));

        return redirect()->back()->with('success', 'Estado de la solicitud RMA actualizado.');
    }
}

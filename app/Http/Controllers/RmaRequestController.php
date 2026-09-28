<?php

namespace App\Http\Controllers;

use App\Models\RmaRequest;
use App\Models\Pedido;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RmaRequestController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $rmas = RmaRequest::where('usuario_id', $user->id)
            ->with(['pedido', 'producto'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Auth/Rma/Index', [
            'rmas' => $rmas
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'pedido_id' => 'required|exists:pedido,id',
            'producto_id' => 'nullable|exists:producto,id',
            'type' => 'required|in:return,exchange,warranty',
            'reason' => 'required|string',
            'description' => 'nullable|string',
            'images.*' => 'nullable|image|max:5120', // 5MB max
        ]);

        $pedido = Pedido::where('id', $request->pedido_id)
            ->where('usuario_id', auth()->id())
            ->firstOrFail();

        $imagePaths = [];
        $disk = config('filesystems.default', 'public');
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('rma_images', $disk);
                $imagePaths[] = \Illuminate\Support\Facades\Storage::disk($disk)->url($path);
            }
        }

        $rma = RmaRequest::create([
            'usuario_id' => auth()->id(),
            'pedido_id' => $pedido->id,
            'producto_id' => $request->producto_id,
            'type' => $request->type,
            'reason' => $request->reason,
            'description' => $request->description,
            'images' => $imagePaths,
        ]);

        return redirect()->route('perfil.rma.show', $rma->id)
            ->with('success', 'Solicitud de devolución/garantía enviada exitosamente.');
    }

    public function show($id)
    {
        $rma = RmaRequest::where('id', $id)
            ->where('usuario_id', auth()->id())
            ->with(['pedido.items.variante.producto', 'producto'])
            ->firstOrFail();

        return Inertia::render('Auth/Rma/Show', [
            'rma' => $rma
        ]);
    }
}

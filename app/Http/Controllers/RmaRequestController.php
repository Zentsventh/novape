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
            'categoriaProductos' => app(\App\Services\Catalog\CatalogQueryService::class)->getCategoryMenu(),
            'rmas' => $rmas
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'pedido_id' => 'required|exists:pedido,id',
            'producto_id' => 'nullable|exists:producto,id',
            'type' => 'required|in:return,exchange,warranty',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'request_key' => 'nullable|uuid',
            'images' => 'nullable|array|max:5',
            'images.*' => 'nullable|image|max:5120', // 5MB max
        ]);

        $pedido = Pedido::where('id', $request->pedido_id)
            ->where('usuario_id', auth()->id())
            ->firstOrFail();

        $imagePaths = [];
        $disk = 'local';
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('rma_images', $disk);
                $imagePaths[] = 'private:'.$path;
            }
        }

        try {
            $rma = app(\App\Services\Orders\ReturnRequestService::class)->create($pedido, $data, auth()->id(), $imagePaths);
        } catch (\Throwable $error) {
            foreach ($imagePaths as $path) Storage::disk($disk)->delete(substr($path, 8));
            throw $error;
        }

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
            'categoriaProductos' => app(\App\Services\Catalog\CatalogQueryService::class)->getCategoryMenu(),
            'rma' => $rma
        ]);
    }

    public function evidence(int $rmaId, int $index)
    {
        $rma = RmaRequest::findOrFail($rmaId);
        $staff = auth('admin')->user();
        abort_unless((auth()->check() && (int) auth()->id() === (int) $rma->usuario_id)
            || ($staff && $staff->estado === 'activo' && $staff->tienePermiso('editar_pedido')), 403);
        $images = json_decode($rma->getRawOriginal('images') ?? '[]', true);
        $value = $images[$index] ?? '';
        abort_unless(str_starts_with($value, 'private:rma_images/'), 404);
        $path = substr($value, 8);
        abort_unless(Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->response($path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}

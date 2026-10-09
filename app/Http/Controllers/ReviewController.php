<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Resena;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public static function eligible(int $productId, ?int $userId): bool
    {
        return $userId && Pedido::where('usuario_id', $userId)->whereRaw('LOWER(estado) = ?', ['completado'])
            ->whereHas('items.variante', fn ($q) => $q->where('producto_id', $productId))->exists();
    }

    public function store(Request $request, int $product)
    {
        Producto::where('activo', true)->findOrFail($product);
        abort_unless(self::eligible($product, $request->user()->id), 403, 'Solo compradores con un pedido completado pueden reseñar este producto.');
        $data = $request->validate(['calificacion' => 'required|integer|between:1,5', 'comentario' => 'required|string|min:10|max:2000']);
        DB::transaction(function () use ($request, $product, $data) {
            Usuario::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            Resena::updateOrCreate(['producto_id' => $product, 'usuario_id' => $request->user()->id], [...$data, 'aprobado' => false]);
        });
        return back()->with('success', 'Tu reseña está pendiente de revisión.');
    }

    public function index(Request $request)
    {
        $search = $request->query('search');
        $query = Resena::with(['producto:id,nombre', 'usuario:id,nombres,apellidos,email'])->latest();

        if ($search) {
            $query->where('comentario', 'like', "%{$search}%")
                  ->orWhereHas('producto', fn($q) => $q->where('nombre', 'like', "%{$search}%"))
                  ->orWhereHas('usuario', fn($q) => $q->where('nombres', 'like', "%{$search}%")->orWhere('apellidos', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        return inertia('Admin/Reviews/Index', ['reviews' => $query->paginate(20)->withQueryString()]);
    }

    public function toggle(int $id)
    {
        DB::transaction(function () use ($id) {
            $review = Resena::whereKey($id)->lockForUpdate()->firstOrFail();
            $review->update(['aprobado' => ! $review->aprobado]);
        });
        return back()->with('success', 'Moderación actualizada.');
    }

    public function destroy(int $id)
    {
        Resena::findOrFail($id)->delete();
        return back()->with('success', 'Reseña eliminada.');
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Profile;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Collection;

class WishlistService
{
    public function getLists(Usuario $usuario): Collection
    {
        return $usuario->listas()->with('items')->get();
    }

    public function syncWishlists(Usuario $usuario, int $productoId, array $nuevasListasIds): void
    {
        $misListas = $usuario->listas()->pluck('id')->toArray();

        foreach ($misListas as $listaId) {
            $lista = $usuario->listas()->find($listaId);
            if (!$lista) continue;

            $item = $lista->items()->where('producto_id', $productoId)->first();
            $debeEstar = in_array($listaId, $nuevasListasIds);

            if ($debeEstar && !$item) {
                $lista->items()->create(['producto_id' => $productoId]);
            } elseif (!$debeEstar && $item) {
                $item->delete();
            }
        }
    }

    public function toggleWishlist(Usuario $usuario, int $productoId, ?int $listaId = null): string
    {
        $lista = null;
        if ($listaId) {
            $lista = $usuario->listas()->findOrFail($listaId);
        } else {
            $lista = $usuario->listas()->first();
            if (!$lista) {
                $lista = $usuario->listas()->create([
                    'nombre' => 'Mis Favoritos',
                    'es_publica' => false
                ]);
            }
        }
        
        $item = $lista->items()->where('producto_id', $productoId)->first();
        if ($item) {
            $item->delete();
            return 'Producto removido de tus listas.';
        } else {
            $lista->items()->create(['producto_id' => $productoId]);
            return 'Producto agregado a tu lista.';
        }
    }

    public function createList(Usuario $usuario, string $nombre, bool $esPublica): void
    {
        $usuario->listas()->create([
            'nombre' => $nombre,
            'es_publica' => $esPublica
        ]);
    }

    public function deleteList(Usuario $usuario, int $id): void
    {
        $lista = $usuario->listas()->findOrFail($id);
        $lista->delete();
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Models\Usuario;
use App\Models\Rol;
use App\Models\CarritoItem;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Illuminate\Support\Facades\DB;

class SocialAuthService
{
    public function handleGoogleUser(SocialiteUser $googleUser, string $sessionId, array $sessionCart): Usuario
    {
        return DB::transaction(function () use ($googleUser) {
            $user = Usuario::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                $nameParts = explode(' ', $googleUser->getName() ?? '');
                $nombres = array_shift($nameParts);
                $apellidos = implode(' ', $nameParts);

                $user = Usuario::create([
                    'nombres' => $nombres,
                    'apellidos' => $apellidos ?: 'Google User',
                    'email' => $googleUser->getEmail(),
                    'password_hash' => bcrypt(Str::random(24)),
                    'google_id' => $googleUser->getId(),
                    'has_set_password' => false,
                ]);

                $rolCliente = Rol::where('nombre', 'cliente')->first();
                if ($rolCliente) {
                    $user->roles()->attach($rolCliente->id);
                }
            } else {
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->getId()]);
                }
            }

            // Cart reconciliation runs once after authentication and session migration.

            return $user;
        });
    }

    private function syncCart(Usuario $user, string $sessionId, array &$sessionCart): void
    {
        $carrito = $user->carrito()->firstOrCreate(['session_id' => $sessionId]);
        $dbItems = $carrito->items()->with(['variante.producto.imagenes'])->get();

        $dbCart = [];
        foreach ($dbItems as $dbItem) {
            $variante = $dbItem->variante;
            $producto = $variante ? $variante->producto : null;
            $imagen = $producto && $producto->imagenes->first() ? $producto->imagenes->first()->url : null;
            if ($producto) {
                $dbCart[$producto->id] = [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'cantidad' => $dbItem->cantidad,
                    'precio' => (float)$variante->precio,
                    'imagen' => $imagen,
                    'variante_id' => $variante->id
                ];
            }
        }
        
        if (empty($sessionCart) && !empty($dbCart)) {
            session()->put('cart', $dbCart);
            $sessionCart = $dbCart;
        } elseif (!empty($sessionCart)) {
            $mergedCart = $dbCart;
            foreach ($sessionCart as $key => $item) {
                $mergedCart[$key] = $item;
            }
            session()->put('cart', $mergedCart);

            $carrito->items()->delete();
            $itemsToInsert = [];
            foreach ($mergedCart as $item) {
                if (isset($item['variante_id'])) {
                    $itemsToInsert[] = [
                        'carrito_id' => $carrito->id,
                        'variante_id' => $item['variante_id'],
                        'cantidad' => $item['cantidad'],
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }
            }
            if (!empty($itemsToInsert)) {
                CarritoItem::insert($itemsToInsert);
            }
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Cart;

use App\Models\CarritoItem;
use App\Models\ConfiguracionSitio;
use App\Models\ReservaStock;
use App\Models\Variante;
use Illuminate\Support\Facades\DB;
use App\Models\Producto;

class CartService
{
    private const MAX_CANTIDAD_POR_ITEM = 5;

    public function addProducto(int $productoId, int $cantidad, string $sessionId): array
    {
        $producto = Producto::with(['imagenes', 'variantes'])->find($productoId);
        if (!$producto) {
            return ['success' => false, 'message' => 'Producto no encontrado.'];
        }

        $imagen = $producto->imagenes->first();
        $variante = $producto->variantes->first();
        
        $stockDisponible = $this->getStockDisponible($variante, $sessionId);

        $cart = session()->get('cart', []);
        $currentQuantity = isset($cart[$productoId]) ? (int) $cart[$productoId]['cantidad'] : 0;
        $maxPermitido = min(self::MAX_CANTIDAD_POR_ITEM, $stockDisponible);

        if (($currentQuantity + $cantidad) > $maxPermitido) {
            if ($stockDisponible < self::MAX_CANTIDAD_POR_ITEM) {
                return ['success' => false, 'message' => "Stock insuficiente. Solo puedes tener hasta {$stockDisponible} unidades de este producto."];
            }
            return ['success' => false, 'message' => "No puedes agregar más de 5 unidades del mismo producto al carrito."];
        }

        $precioFinal = $variante ? (float) $variante->precio : 0.0;

        if (isset($cart[$productoId])) {
            $cart[$productoId]['cantidad'] += $cantidad;
            $cart[$productoId]['precio'] = $precioFinal;
        } else {
            $cart[$productoId] = [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'cantidad' => $cantidad,
                'precio' => $precioFinal,
                'imagen' => $imagen ? $imagen->url : null,
                'variante_id' => $variante ? $variante->id : null
            ];
        }

        session()->put('cart', $cart);
        $this->syncCartToDB($cart, $sessionId);
        
        if ($variante) {
            $this->syncReserva($variante->id, $cart[$productoId]['cantidad'], $sessionId);
        }

        return ['success' => true, 'message' => 'Producto agregado al carrito exitosamente.'];
    }

    public function updateCantidad(int $productoId, int $cantidadSolicitada, string $sessionId): array
    {
        $cart = session()->get('cart', []);

        if (!isset($cart[$productoId])) {
            return ['success' => false, 'message' => 'El producto no se encontró en el carrito.'];
        }

        $varianteId = $cart[$productoId]['variante_id'] ?? null;
        
        if ($varianteId) {
            $variante = Variante::find($varianteId);
            $stockDisponible = $this->getStockDisponible($variante, $sessionId);
            $maxPermitido = min(self::MAX_CANTIDAD_POR_ITEM, $stockDisponible);
            $nuevaCantidad = min($cantidadSolicitada, $maxPermitido);
        } else {
            $nuevaCantidad = $cantidadSolicitada;
        }

        $cart[$productoId]['cantidad'] = $nuevaCantidad;
        session()->put('cart', $cart);
        $this->syncCartToDB($cart, $sessionId);
        
        if ($varianteId) {
            $this->syncReserva($varianteId, $nuevaCantidad, $sessionId);
        }
        
        return ['success' => true, 'message' => 'Carrito actualizado.'];
    }

    public function removeProducto(int $productoId, string $sessionId): array
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productoId])) {
            $varianteId = $cart[$productoId]['variante_id'] ?? null;
            unset($cart[$productoId]);
            session()->put('cart', $cart);
            
            $this->syncCartToDB($cart, $sessionId);
            
            if ($varianteId) {
                $this->syncReserva($varianteId, 0, $sessionId);
            }
        }

        return ['success' => true, 'message' => 'Producto eliminado del carrito.'];
    }

    public function clearCart(string $sessionId): array
    {
        session()->forget('cart');
        
        $this->syncCartToDB([], $sessionId);
        ReservaStock::where('session_id', $sessionId)->delete();
        
        return ['success' => true, 'message' => 'El carrito ha sido vaciado.'];
    }
    public function syncCartToDB(array $cart, string $sessionId): void
    {
        if (auth()->check()) {
            $user = auth()->user();
            $carrito = $user->carrito()->firstOrCreate(['session_id' => $sessionId]);
            
            if (empty($cart)) {
                $carrito->items()->delete();
                return;
            }

            $variantesActuales = [];
            foreach ($cart as $item) {
                if (isset($item['variante_id'])) {
                    $variantesActuales[] = $item['variante_id'];
                    CarritoItem::updateOrCreate(
                        ['carrito_id' => $carrito->id, 'variante_id' => $item['variante_id']],
                        ['cantidad' => $item['cantidad']]
                    );
                }
            }
            
            $carrito->items()->whereNotIn('variante_id', $variantesActuales)->delete();
        }
    }

    public function syncReserva(?int $varianteId, int $cantidad, string $sessionId): void
    {
        if (!$varianteId) return;
        
        if ($cantidad > 0) {
            ReservaStock::updateOrCreate(
                ['session_id' => $sessionId, 'variante_id' => $varianteId],
                ['cantidad' => $cantidad, 'expires_at' => now()->addMinutes(15)]
            );
        } else {
            ReservaStock::where('session_id', $sessionId)
                ->where('variante_id', $varianteId)
                ->delete();
        }
    }

    public function getStockDisponible(?Variante $variante, string $sessionId): int
    {
        if (!$variante) return 0;

        $almacenEcommerceId = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
        
        $stockAlmacen = DB::table('stock_almacen')
            ->where('almacen_id', $almacenEcommerceId)
            ->where('variante_id', $variante->id)
            ->first();
            
        $stockActual = $stockAlmacen ? (int)$stockAlmacen->cantidad : 0;

        $stockReservado = (int) ReservaStock::where('variante_id', $variante->id)
            ->where('session_id', '!=', $sessionId)
            ->where('expires_at', '>', now())
            ->sum('cantidad');

        return max(0, $stockActual - $stockReservado);
    }

    public function mergeSessionAndDbCart(array $sessionCart, \App\Models\Usuario $user, string $sessionId): void
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
        } elseif (!empty($sessionCart)) {
            $mergedCart = $dbCart;
            foreach ($sessionCart as $key => $item) {
                if (isset($mergedCart[$key])) {
                    $mergedCart[$key]['cantidad'] += $item['cantidad'];
                } else {
                    $mergedCart[$key] = $item;
                }
            }
            session()->put('cart', $mergedCart);
            $this->syncCartToDB($mergedCart, $sessionId);
        }
    }
}

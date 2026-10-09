<?php
declare(strict_types=1);
namespace App\Services\Cart;

use App\Models\CarritoItem;
use App\Models\ReservaStock;
use App\Models\Variante;
use App\Models\Usuario;
use App\Models\ConfiguracionSitio;
use App\Services\Inventory\StockAvailability;
use App\Services\Storefront\CommercePolicy;
use Illuminate\Support\Facades\DB;

class CartService
{
    private function variant(int $product, ?int $variant = null): ?Variante
    {
        $query = Variante::where('producto_id', $product)->where('activo', true)->whereHas('producto', fn ($q) => $q->where('activo', true))->with('producto.imagenes');
        if ($variant) return $query->whereKey($variant)->lockForUpdate()->first();
        foreach ($query->orderBy('id')->lockForUpdate()->get()->sortBy(fn($v)=>\App\Services\Storefront\VariantPricing::quote($v)['price']) as $option) {
            if ($this->getStockDisponible($option, session()->getId()) > 0) return $option;
        }
        return null;
    }
    private function key(array $cart, int $product, ?int $variant): int|string|null
    {
        $matches = array_keys(array_filter($cart, fn ($line) => (int) $line['id'] === $product && (!$variant || (int) $line['variante_id'] === $variant)));
        return count($matches) === 1 ? $matches[0] : null;
    }
    private function line(Variante $variant, int $quantity): array
    {
        return ['id' => $variant->producto_id, 'line_id' => 'v-'.$variant->id, 'nombre' => $variant->producto->nombre,
            'cantidad' => $quantity, 'precio' => \App\Services\Storefront\VariantPricing::quote($variant)['price'], 'imagen' => $variant->producto->imagenes->first()?->url,
            'variante_id' => $variant->id, 'codigo' => $variant->sku];
    }
    private function editable(string $session): void
    {
        if (session('checkout_pedido')) {
            $order = DB::table('pedido')->where('codigo', session('checkout_pedido'))->lockForUpdate()->first();
            if ($order && DB::table('payment_reconciliations')->where('pedido_id', $order->id)->whereIn('status', ['authorizing','approved','needs_review'])->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages(['cart'=>'Hay un pago en verificación. Resuélvelo antes de modificar esta compra.']);
            }
        }
        if (auth()->check()) Usuario::whereKey(auth()->id())->lockForUpdate()->firstOrFail();
        ReservaStock::where('session_id', $session)->delete();
        if (isset($order) && $order) {
            DB::table('payment_reconciliations')->where('pedido_id',$order->id)->whereIn('status',['prepared','preparing'])->update(['status'=>'expired','updated_at'=>now()]);
            DB::table('checkout_benefit_reservations')->where('pedido_id',$order->id)->delete();
        }
        session()->forget('niubiz_quote');
    }
    public function addProducto(int $productoId, int $cantidad, string $sessionId, ?int $varianteId = null): array
    {
        return DB::transaction(function () use ($productoId, $cantidad, $sessionId, $varianteId) {
            $this->editable($sessionId);
            $variant = $this->variant($productoId, $varianteId);
            if (!$variant || $cantidad < 1) return ['success'=>false,'message'=>'La opción elegida no está disponible.'];
            $cart = session('cart', []); $key = $this->key($cart, $productoId, $variant->id);
            $quantity = ($key !== null ? (int) $cart[$key]['cantidad'] : 0) + $cantidad;
            $max = min(CommercePolicy::summary()['max_quantity'], $this->getStockDisponible($variant, $sessionId));
            if ($quantity > $max) return ['success'=>false,'message'=>"Puedes comprar hasta {$max} unidades de esta opción."];
            $key ??= !array_key_exists($productoId, $cart) ? $productoId : 'v-'.$variant->id;
            $cart[$key] = $this->line($variant, $quantity);
            session(['cart'=>$cart]); $this->syncCartToDB($cart, $sessionId);
            return ['success'=>true,'message'=>'Producto agregado. La disponibilidad se confirma al preparar el pago.'];
        });
    }
    public function updateCantidad(int $productoId, int $cantidadSolicitada, string $sessionId, ?int $varianteId = null): array
    {
        return DB::transaction(function () use ($productoId, $cantidadSolicitada, $sessionId, $varianteId) {
            $this->editable($sessionId); $cart = session('cart', []); $key = $this->key($cart, $productoId, $varianteId);
            if ($key === null) return ['success'=>false,'message'=>'Selecciona una opción concreta del carrito.'];
            $variant = $this->variant($productoId, (int) $cart[$key]['variante_id']);
            if (!$variant || $cantidadSolicitada < 1 || $cantidadSolicitada > min(CommercePolicy::summary()['max_quantity'], $this->getStockDisponible($variant, $sessionId))) return ['success'=>false,'message'=>'La cantidad solicitada no está disponible.'];
            $cart[$key] = $this->line($variant, $cantidadSolicitada); session(['cart'=>$cart]); $this->syncCartToDB($cart, $sessionId);
            return ['success'=>true,'message'=>'Carrito actualizado.'];
        });
    }
    public function removeProducto(int $productoId, string $sessionId, ?int $varianteId = null): array
    {
        return DB::transaction(function () use ($productoId, $sessionId, $varianteId) {
            $this->editable($sessionId); $cart = session('cart', []); $key = $this->key($cart, $productoId, $varianteId);
            if ($key === null) return ['success'=>false,'message'=>'Selecciona la opción que deseas retirar.'];
            unset($cart[$key]); session(['cart'=>$cart]); $this->syncCartToDB($cart, $sessionId);
            return ['success'=>true,'message'=>'Producto retirado.'];
        });
    }
    public function clearCart(string $sessionId): array
    {
        return DB::transaction(function () use ($sessionId) { $this->editable($sessionId); session()->forget('cart'); $this->syncCartToDB([], $sessionId); return ['success'=>true,'message'=>'Carrito vaciado.']; });
    }
    public function syncCartToDB(array $cart, string $sessionId): void
    {
        if (!auth()->check()) return;
        Usuario::whereKey(auth()->id())->lockForUpdate()->firstOrFail();
        $carrito = auth()->user()->carrito()->firstOrCreate([], ['session_id'=>$sessionId]);
        $carrito->forceFill(['session_id'=>$sessionId,'notified_at'=>null,'updated_at'=>now()])->save();
        $variants = []; $rows = [];
        foreach ($cart as $line) {
            $variants[] = $line['variante_id'];
            $rows[] = ['carrito_id'=>$carrito->id,'variante_id'=>$line['variante_id'],'cantidad'=>$line['cantidad']];
        }
        if ($rows) CarritoItem::upsert($rows, ['carrito_id','variante_id'], ['cantidad','updated_at']);
        $carrito->items()->whereNotIn('variante_id', $variants)->delete();
    }
    public function syncReserva(?int $varianteId, int $cantidad, string $sessionId): void
    {
        if ($cantidad <= 0) ReservaStock::where('session_id',$sessionId)->where('variante_id',$varianteId)->delete();
    }
    public function getStockDisponible(?Variante $variante, string $sessionId): int
    {
        if (!$variante) return 0;
        $warehouse = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id',1);
        $stock = (int) DB::table('stock_almacen')->where('almacen_id',$warehouse)->where('variante_id',$variante->id)->value('cantidad');
        return max(0, $stock - StockAvailability::reserved($variante->id, $warehouse, $sessionId));
    }
    public function mergeSessionAndDbCart(array $sessionCart, Usuario $user, string $sessionId, ?string $previousSessionId = null): void
    {
        DB::transaction(function () use ($sessionCart,$user,$sessionId,$previousSessionId) {
            Usuario::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $saved = $user->carrito()->firstOrCreate([], ['session_id'=>$sessionId]);
            $desired = [];
            foreach ($sessionCart as $line) if (!empty($line['variante_id'])) $desired[$line['variante_id']] = ($desired[$line['variante_id']] ?? 0) + (int) $line['cantidad'];
            foreach ($saved->items()->get() as $line) {
                $sameSession = $previousSessionId && $saved->session_id === $previousSessionId;
                $desired[$line->variante_id] = $sameSession ? max($desired[$line->variante_id] ?? 0,$line->cantidad) : ($desired[$line->variante_id] ?? 0)+$line->cantidad;
            }
            ksort($desired); $merged = []; $changes = false;
            foreach ($desired as $id=>$quantity) {
                $variant = Variante::whereKey($id)->where('activo',true)->whereHas('producto',fn($q)=>$q->where('activo',true))->with('producto.imagenes')->lockForUpdate()->first();
                if (!$variant) { $changes = true; continue; }
                $allowed = min($quantity, CommercePolicy::summary()['max_quantity'], $this->getStockDisponible($variant,$sessionId));
                if ($allowed !== $quantity) $changes = true;
                if ($allowed > 0) $merged[isset($merged[$variant->producto_id]) ? 'v-'.$id : $variant->producto_id] = $this->line($variant,$allowed);
            }
            session(['cart'=>$merged]); $this->syncCartToDB($merged,$sessionId);
            if ($changes) session()->flash('error','El carrito se actualizó según disponibilidad. Revisa opciones y cantidades antes de pagar.');
        });
    }
}

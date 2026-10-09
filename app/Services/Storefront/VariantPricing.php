<?php
declare(strict_types=1);
namespace App\Services\Storefront;
use App\Models\Variante;
use Illuminate\Support\Facades\DB;

final class VariantPricing
{
    private ?\Illuminate\Support\Collection $promotions = null;
    public function refresh(): void { $this->promotions = null; }
    /** Promotions never stack: choose the lowest eligible unit price. */
    public static function quote(Variante $variant): array
    {
        $base = round((float) $variant->precio, 2);
        $best = ['price'=>$base, 'base_price'=>$base, 'promotion_id'=>null, 'combinable_coupon'=>true];
        $day = now()->toDateString();
        $service = app(self::class);
        $service->promotions ??= DB::table('promociones as p')->join('producto_promocion as pp','pp.promocion_id','=','p.id')
            ->where('p.activa',true)
            ->where(fn($q)=>$q->whereNull('p.fecha_inicio')->orWhere('p.fecha_inicio','<=',$day))
            ->where(fn($q)=>$q->whereNull('p.fecha_fin')->orWhere('p.fecha_fin','>=',$day))->select('p.*','pp.producto_id')->orderBy('p.id')->get();
        $promotions = $service->promotions->where('producto_id',$variant->producto_id);
        foreach ($promotions as $promotion) {
            $discount = $promotion->tipo_descuento === 'porcentaje' ? $base * min(100,max(0,(float)$promotion->valor_descuento))/100 : max(0,(float)$promotion->valor_descuento);
            $price = round(max(0,$base-$discount),2);
            if ($price < $best['price']) $best = ['price'=>$price,'base_price'=>$base,'promotion_id'=>$promotion->id,'combinable_coupon'=>(bool)$promotion->combinable_coupon];
        }
        return $best;
    }

    public static function displayQuery(bool $discountRate = false): \Illuminate\Database\Eloquent\Builder
    {
        $day = DB::getPdo()->quote(now()->toDateString());
        $discount = "COALESCE((SELECT MAX(CASE WHEN p.tipo_descuento = 'porcentaje' THEN variante.precio * p.valor_descuento / 100 ELSE p.valor_descuento END) FROM promociones p INNER JOIN producto_promocion pp ON pp.promocion_id=p.id WHERE pp.producto_id=variante.producto_id AND p.activa=1 AND p.valor_descuento>0 AND (p.fecha_inicio IS NULL OR p.fecha_inicio <= {$day}) AND (p.fecha_fin IS NULL OR p.fecha_fin >= {$day})),0)";
        $price = "ROUND(CASE WHEN {$discount}>variante.precio THEN 0 ELSE variante.precio-{$discount} END,2)";
        $warehouse = (int)\App\Models\ConfiguracionSitio::obtener('almacen_ecommerce_id',1);
        $session = DB::getPdo()->quote(session()->getId());
        $available = "COALESCE((SELECT SUM(s.cantidad) FROM stock_almacen s WHERE s.variante_id=variante.id AND s.almacen_id={$warehouse}),0) - COALESCE((SELECT SUM(r.cantidad) FROM reservas_stock r WHERE r.variante_id=variante.id AND r.expires_at>".DB::getPdo()->quote(now()->toDateTimeString())." AND r.session_id<>{$session}),0)";
        $reference = 'CASE WHEN variante.precio_anterior>variante.precio THEN variante.precio_anterior ELSE variante.precio END';
        $projection = $discountRate ? "CASE WHEN ({$reference})>0 THEN (({$reference})-({$price}))/({$reference}) ELSE 0 END" : $price;
        return Variante::selectRaw($projection)->whereColumn('producto_id','producto.id')->where('activo',true)
            ->orderByRaw("CASE WHEN ({$available})>0 THEN 0 ELSE 1 END")->orderByRaw($price)->orderBy('id')->limit(1);
    }
}

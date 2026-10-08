<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Almacen;
use App\Models\ConfiguracionSitio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StorefrontSettingController extends Controller
{
    private const PAGES = ['nosotros', 'trabaja-con-nosotros', 'terminos', 'privacidad', 'ayuda', 'devoluciones', 'faq'];
    private const POLICY = ['store_max_quantity'=>5,'store_minimum_payment'=>2,'store_free_shipping_threshold'=>299,'store_shipping_base'=>12,'store_shipping_extra_kg'=>2,'store_delivery_min_days'=>2,'store_delivery_max_days'=>5,'store_return_window_days'=>30];

    public function index()
    {
        $settings = [];
        foreach (['telefono_contacto', 'email_contacto', 'facebook_url', 'instagram_url', 'contact_hours', 'pickup_hours', 'delivery_eta', 'return_policy', 'business_identity'] as $key) $settings[$key] = ConfiguracionSitio::obtener($key, '');
        $settings['pickup_enabled'] = ConfiguracionSitio::obtener('pickup_enabled', '0') === '1';
        foreach (self::POLICY as $key=>$default) $settings[$key] = (float) ConfiguracionSitio::obtener($key,(string)$default);
        foreach (['envio_gratis','store_coupon_points_combinable'] as $key) $settings[$key] = ConfiguracionSitio::obtener($key,'1') === '1';
        $settings['pages'] = [];
        foreach (self::PAGES as $slug) $settings['pages'][$slug] = \App\Models\Page::where('slug', $slug)->value('sections')
            ?: json_decode(ConfiguracionSitio::obtener('page_'.$slug, '[]'), true) ?: [];
        return inertia('Admin/Tienda/Settings', ['settings' => $settings,
            'pickupWarehouse' => Almacen::whereKey((int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1))->first()?->only(['nombre', 'direccion', 'activo'])]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'telefono_contacto' => ['nullable', 'string', 'regex:/^\+?[0-9\s-]{7,20}$/'], 'email_contacto' => 'nullable|email|max:254',
            'facebook_url' => 'nullable|url:http,https|max:500', 'instagram_url' => 'nullable|url:http,https|max:500',
            'pickup_enabled' => 'required|boolean', 'pickup_hours' => 'required_if:pickup_enabled,true|nullable|string|max:300',
            'contact_hours' => 'nullable|string|max:300',
            'delivery_eta' => 'nullable|string|max:500', 'return_policy' => 'nullable|string|max:3000', 'business_identity' => 'nullable|string|max:1000',
            'pages' => 'required|array', 'pages.*' => 'array|max:20', 'pages.*.*.heading' => 'required|string|max:150', 'pages.*.*.body' => 'required|string|max:10000',
            'store_max_quantity'=>'sometimes|integer|min:1|max:100', 'store_minimum_payment'=>'sometimes|numeric|min:2|max:10000',
            'store_free_shipping_threshold'=>'sometimes|numeric|min:1|max:100000', 'store_shipping_base'=>'sometimes|numeric|min:0|max:10000', 'store_shipping_extra_kg'=>'sometimes|numeric|min:0|max:10000',
            'store_delivery_min_days'=>'sometimes|integer|min:1|max:365', 'store_delivery_max_days'=>'sometimes|integer|min:1|max:365|gte:store_delivery_min_days',
            'store_return_window_days'=>'sometimes|integer|min:1|max:365', 'envio_gratis'=>'sometimes|boolean', 'store_coupon_points_combinable'=>'sometimes|boolean',
        ]);
        if ($data['pickup_enabled']) {
            $warehouse = Almacen::whereKey((int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1))->where('activo', true)->first();
            if (! $warehouse || ! $warehouse->direccion) throw \Illuminate\Validation\ValidationException::withMessages(['pickup_enabled' => 'Configura un almacén ecommerce activo con dirección antes de habilitar el retiro.']);
        }
        DB::transaction(function () use ($data) {
            foreach (\Illuminate\Support\Arr::except($data, ['pages', 'pickup_enabled', 'envio_gratis','store_coupon_points_combinable']) as $key => $value) ConfiguracionSitio::establecer($key, $value ?? '');
            foreach (['envio_gratis','store_coupon_points_combinable'] as $key) if (array_key_exists($key,$data)) ConfiguracionSitio::establecer($key,$data[$key] ? '1':'0');
            ConfiguracionSitio::establecer('pickup_enabled', $data['pickup_enabled'] ? '1' : '0');
            foreach (self::PAGES as $slug) {
                $sections = $data['pages'][$slug] ?? [];
                ConfiguracionSitio::establecer('page_'.$slug, json_encode($sections, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
                $page = \App\Models\Page::where('slug', $slug)->lockForUpdate()->first();
                if ($page) $page->update(['sections' => $sections]);
            }
        });
        return back()->with('success', 'Información comercial y retiro actualizados.');
    }
}

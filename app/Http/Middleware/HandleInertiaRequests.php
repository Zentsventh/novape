<?php

namespace App\Http\Middleware;

use App\Models\ConfiguracionSitio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $cart = session()->get('cart', []);

        $cartTotal = 0;
        $cartCount = 0;
        foreach ($cart as $item) {
            $cartTotal += $item['precio'] * $item['cantidad'];
            $cartCount += $item['cantidad'];
        }

        // Usa el guard 'admin' si estamos en una ruta de admin, caso contrario el normal
        $user = $request->is('admin*') ? auth('admin')->user() : $request->user();

        $permisos = [];
        if ($user && $request->is('admin*')) {
            $user->loadMissing('roles');
            $permisos = $user->getAllPermisos()->toArray();
        }

        // Detección de dispositivo server-side (User-Agent nativo — sin dependencias)
        $ua = strtolower($request->header('User-Agent', ''));
        $isMobile = (bool) preg_match('/mobile|android.*mobile|iphone|ipod|blackberry|opera mini|iemobile/i', $ua);
        $isTablet = ! $isMobile && (bool) preg_match('/tablet|ipad|android(?!.*mobile)|kindle|silk/i', $ua);
        $isDesktop = ! $isMobile && ! $isTablet;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? ($request->is('admin*')
                    ? array_merge($user->toArray(), ['permisos' => $permisos])
                    : $user->only(['id', 'nombres', 'apellidos', 'email', 'telefono', 'tipo_documento', 'dni', 'has_set_password'])) : null,
            ],
            'cart' => [
                'items' => array_values($cart),
                'count' => $cartCount,
                'total' => $cartTotal,
            ],
            'device' => [
                'isMobile' => $isMobile,
                'isTablet' => $isTablet,
                'isDesktop' => $isDesktop,
            ],
            'commercePolicy' => fn () => \App\Services\Storefront\CommercePolicy::summary(),
            'globalConfig' => fn () => Cache::remember('globalConfig', 3600, function () {
                return [
                    'facebook_url' => ConfiguracionSitio::obtener('facebook_url', 'https://facebook.com/novape'),
                    'instagram_url' => ConfiguracionSitio::obtener('instagram_url', 'https://instagram.com/novape'),
                    'telefono_contacto' => ConfiguracionSitio::obtener('telefono_contacto', '+51 999 888 777'),
                    'email_contacto' => ConfiguracionSitio::obtener('email_contacto', 'contacto@novape.com'),
                    'contact_hours' => ConfiguracionSitio::obtener('contact_hours', ''),
                    'logo_url' => ConfiguracionSitio::obtener('logo_url'),
                    'free_shipping_threshold' => \App\Services\Storefront\CommercePolicy::summary()['free_shipping_threshold'],
                    'free_shipping_enabled' => \App\Services\Storefront\CommercePolicy::summary()['free_shipping_enabled'],
                    'delivery_coverage' => 'Lima Metropolitana',
                ];
            }),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'venta_id' => fn () => $request->session()->get('venta_id'),
            ],
            'errors' => function () use ($request) {
                $errors = $request->session()->get('errors');
                if ($errors) {
                    return $errors->getBag('default')->toArray();
                }

                return (object) [];
            },
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\Profile\RequestPhoneOtpRequest;
use App\Http\Requests\Profile\VerifyPhoneOtpRequest;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\StoreDireccionRequest;
use App\Http\Requests\Profile\StoreTarjetaRequest;
use App\Http\Requests\Profile\DeleteAccountRequest;
use Illuminate\Support\Facades\Log;
use App\Services\User\UserProfileService;

class ProfileController extends Controller
{
    public function __construct(
        private readonly UserProfileService $profileService
    ) {}

    public function index(Request $request)
    {
        $usuario = Auth::user();

        $pedidos = $usuario->pedidos()->with(['items.variante.producto.imagenes', 'items.variante.producto.proveedor'])->orderBy('id', 'desc')->get();
        $pedidos->each(fn ($order) => $this->prepareOrder($order));
        $direcciones = $usuario->direcciones()->get();
        $tarjetas = $usuario->tarjetas()->get();
        $datosReembolso = $usuario->datosReembolso()->first();
        $listas = $usuario->listas()->with('items.producto.imagenes')->get();

        $currentSessionId = $request->session()->getId();
        try {
            \Illuminate\Support\Facades\DB::table('sessions')
                ->where('id', $currentSessionId)
                ->whereNull('user_id')
                ->update(['user_id' => $usuario->id]);
        } catch (\Throwable) {}

        $sesiones = \Illuminate\Support\Facades\DB::table('sessions')
            ->select('id', 'user_id', 'ip_address', 'user_agent', 'last_activity')
            ->where('user_id', $usuario->id)
            ->orderBy('last_activity', 'desc')
            ->get();

        $hasCurrentSession = $sesiones->contains(function ($s) use ($currentSessionId) {
            return (string)$s->id === (string)$currentSessionId;
        });

        if (! $hasCurrentSession) {
            $currentSession = (object) [
                'id' => $currentSessionId,
                'user_id' => $usuario->id,
                'ip_address' => $request->ip() ?: '127.0.0.1',
                'user_agent' => $request->userAgent() ?: 'Navegador Web',
                'last_activity' => time(),
            ];
            $sesiones = $sesiones->prepend($currentSession);

            try {
                \Illuminate\Support\Facades\DB::table('sessions')->updateOrInsert(
                    ['id' => $currentSessionId],
                    [
                        'user_id' => $usuario->id,
                        'ip_address' => $request->ip() ?: '127.0.0.1',
                        'user_agent' => $request->userAgent() ?: 'Navegador Web',
                        'payload' => '',
                        'last_activity' => time(),
                    ]
                );
            } catch (\Throwable) {}
        }

        $pointsHistory = \App\Models\LoyaltyPointsHistory::where('usuario_id', $usuario->id)->orderBy('created_at', 'desc')->get();
        $tab = $request->query('tab', 'home');
        if ($tab === 'ordenes') $tab = 'compras';
        if (! in_array($tab, ['home', 'compras', 'perfil', 'direcciones', 'tarjetas', 'reembolso', 'listas', 'puntos', 'sesiones', 'configuracion'], true)) $tab = 'home';

        $categoriaProductos = \Illuminate\Support\Facades\Cache::remember('home_categorias', 3600, function () {
            return \App\Models\Categoria::whereNull('categoria_padre_id')
                ->where(function ($q) {
                    $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
                })
                ->with(['subcategorias'])
                ->get();
        });

        return Inertia::render('Auth/Profile', [
            'usuario' => $usuario->only(['id', 'nombres', 'apellidos', 'email', 'telefono', 'telefono_secundario', 'tipo_documento', 'dni', 'fecha_nacimiento', 'has_set_password', 'loyalty_points']),
            'pedidos' => $pedidos,
            'direcciones' => $direcciones,
            'tarjetas' => $tarjetas,
            'datosReembolso' => $datosReembolso,
            'listas' => $listas,
            'sesiones' => $sesiones->map(fn ($s) => [
                'id' => hash_hmac('sha256', (string) $s->id, config('app.key')),
                'ip_address' => $s->ip_address, 'user_agent' => $s->user_agent,
                'last_activity' => $s->last_activity, 'is_current' => (string) $s->id === $currentSessionId,
            ]),
            'pointsHistory' => $pointsHistory,
            'activeTabParam' => $tab,
            'categoriaProductos' => $categoriaProductos,
            'deliveryDistricts' => \App\Services\Shipping\LimaCoverage::DISTRICTS,
        ]);
    }

    public function showOrder($codigo)
    {
        $usuario = Auth::user();

        $pedido = \App\Models\Pedido::with(['items.variante.producto.imagenes', 'items.variante.producto.proveedor', 'usuario'])
            ->where('codigo', $codigo)
            ->where('usuario_id', $usuario->id)
            ->firstOrFail();

        return Inertia::render('Auth/OrderDetails', [
            'pedido' => $this->prepareOrder($pedido),
            'categoriaProductos' => \Illuminate\Support\Facades\Cache::get('home_categorias', []),
        ]);
    }

    private function prepareOrder(\App\Models\Pedido $order): \App\Models\Pedido
    {
        $order->items->each(function ($item) {
            $product = $item->variante?->producto;
            $item->setAttribute('image_url', $product?->imagenes->sortBy('orden')->first()?->url);
            $item->setAttribute('product_name', $item->producto_nombre ?: $product?->nombre ?: 'Producto de tu pedido');
            $item->setAttribute('product_id', $product?->id);
        });
        return $order;
    }

    public function update(UpdateProfileRequest $request)
    {
        Log::info('Profile update', ['user_id'=>Auth::id(), 'data'=>$request->validated()]);

        $this->profileService->updateProfile(Auth::user(), $request->validated());
        return back()->with('success', 'Perfil actualizado exitosamente.');
    }

    public function requestPhoneUpdateOtp(RequestPhoneOtpRequest $request)
    {
        Log::info('Request phone OTP', ['user_id'=>Auth::id(), 'phone'=>$request->telefono]);


        $this->profileService->requestPhoneOtp(Auth::user(), $request->telefono);
        return back()->with('success', 'Código enviado a tu correo.');
    }

    public function verifyPhoneUpdateOtp(VerifyPhoneOtpRequest $request)
    {
        Log::info('Verify phone OTP', ['user_id' => Auth::id()]);


        try {
            $this->profileService->verifyPhoneOtp(Auth::user(), $request->codigo);
            return back()->with('success', 'Celular actualizado exitosamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['codigo' => $e->getMessage()]);
        }
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        Log::info('Update password attempt', ['user_id'=>Auth::id()]);

        $usuario = Auth::user();

        try {
            $this->profileService->updatePassword($usuario, $request->password, $request->current_password);
            return back()->with('success', 'Tu contraseña se ha actualizado correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['current_password' => $e->getMessage()]);
        }
    }

    public function storeDireccion(StoreDireccionRequest $request)
    {
        Log::info('Store address', ['user_id' => Auth::id()]);


        $this->profileService->addAddress(Auth::user(), $request->validated(), $request->boolean('principal'));
        return back()->with('success', 'Dirección agregada correctamente.');
    }

    public function setPrincipalDireccion($id)
    {
        Log::info('Set principal address', ['user_id'=>Auth::id(), 'address_id'=>$id]);

        $this->profileService->setPrincipalAddress(Auth::user(), (int) $id);
        return back()->with('success', 'Dirección establecida como principal.');
    }

    public function destroyDireccion($id)
    {
        Log::info('Destroy address', ['user_id'=>Auth::id(), 'address_id'=>$id]);

        $this->profileService->deleteAddress(Auth::user(), (int) $id);
        return back()->with('success', 'Dirección eliminada.');
    }

    public function storeTarjeta(\Illuminate\Http\Request $request)
    {
        return back()->withErrors(['tarjeta' => 'El guardado de tarjetas aún no está disponible. Usa la pasarela de pago.']);
    }

    public function destroyTarjeta($id)
    {
        Log::info('Destroy card', ['user_id'=>Auth::id(), 'card_id'=>$id]);

        $this->profileService->deleteCard(Auth::user(), (int) $id);
        return back()->with('success', 'Tarjeta eliminada.');
    }

    public function updateDatosReembolso(Request $request)
    {
        Log::info('Update refund data', ['user_id' => Auth::id()]);

        $validated = $request->validate([
            'tipo_documento' => 'required|string',
            'numero_documento' => 'required|string',
            'nombres_titular' => 'required|string',
            'apellidos_titular' => 'required|string',
            'telefono_titular' => 'required|string',
            'correo_titular' => 'required|email',
            'banco' => 'required|string',
            'tipo_cuenta' => 'required|string',
            'numero_cuenta' => 'required|string',
            'cci' => 'required|string',
        ]);

        $this->profileService->updateRefundData(Auth::user(), $validated);
        return back()->with('success', 'Datos de reembolso actualizados.');
    }

    public function destroySession($id)
    {
        $session = \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', Auth::id())->select('id')->get()
            ->first(fn ($s) => hash_equals(hash_hmac('sha256', (string) $s->id, config('app.key')), (string) $id));
        abort_unless($session && $session->id !== request()->session()->getId(), 404);
        $this->profileService->deleteSession(Auth::user(), (string) $session->id);
        return back()->with('success', 'Sesión cerrada exitosamente.');
    }

    public function destroyAccount(DeleteAccountRequest $request)
    {
        Log::info('Destroy account', ['user_id'=>Auth::id()]);


        try {
            $this->profileService->deleteAccount(Auth::user(), $request->password);
            Auth::logout();
            return redirect('/')->with('success', 'Tu cuenta ha sido eliminada.');
        } catch (\Exception $e) {
            return back()->withErrors(['password' => $e->getMessage()]);
        }
    }
}

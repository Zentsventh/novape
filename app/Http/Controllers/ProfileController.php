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
        $direcciones = $usuario->direcciones()->get();
        $tarjetas = $usuario->tarjetas()->get();
        $datosReembolso = $usuario->datosReembolso()->first();
        $listas = $usuario->listas()->with('items.producto.imagenes')->get();
        $sesiones = \DB::table('sessions')->where('user_id', $usuario->id)->orderBy('last_activity', 'desc')->get();
        $pointsHistory = \App\Models\LoyaltyPointsHistory::where('usuario_id', $usuario->id)->orderBy('created_at', 'desc')->get();
        $tab = $request->query('tab', 'home');

        $categoriaProductos = \Illuminate\Support\Facades\Cache::remember('home_categorias', 3600, function () {
            return \App\Models\Categoria::whereNull('categoria_padre_id')
                ->where(function ($q) {
                    $q->whereNotIn('slug', ['cyber-bombas', 'retiro-inmediato'])->orWhereNull('slug');
                })
                ->with(['subcategorias'])
                ->get();
        });

        return Inertia::render('Auth/Profile', [
            'usuario' => $usuario,
            'pedidos' => $pedidos,
            'direcciones' => $direcciones,
            'tarjetas' => $tarjetas,
            'datosReembolso' => $datosReembolso,
            'listas' => $listas,
            'sesiones' => $sesiones,
            'pointsHistory' => $pointsHistory,
            'activeTabParam' => $tab,
            'categoriaProductos' => $categoriaProductos,
            'session_id' => $request->session()->getId(),
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
            'pedido' => $pedido,
        ]);
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
        Log::info('Store address', ['user_id'=>Auth::id(), 'data'=>$request->all()]);


        $this->profileService->addAddress(Auth::user(), $request->all(), (bool) $request->input('principal', false));
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

    public function storeTarjeta(StoreTarjetaRequest $request)
    {
        Log::info('Store card', ['user_id' => Auth::id()]);


        $this->profileService->addCard(Auth::user(), $request->all());
        return back()->with('success', 'Tarjeta agregada exitosamente (Simulación).');
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
        Log::info('Destroy session', ['user_id'=>Auth::id(), 'session_id'=>$id]);

        $this->profileService->deleteSession(Auth::user(), (string) $id);
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

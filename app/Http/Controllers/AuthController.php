<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Auth\AuthService;
use App\Services\Cart\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly CartService $cartService
    ) {}

    public function showLogin()
    {
        if (Auth::guard('web')->check()) {
            return redirect('/');
        }
        return Inertia::render('Auth/Login');
    }

    public function showRegister()
    {
        if (Auth::check()) {
            return redirect('/');
        }
        return Inertia::render('Auth/Register');
    }

    public function register(RegisterRequest $request): RedirectResponse
    {
        $previousSessionId = $request->session()->getId();
        $sessionCart = $request->session()->get('cart', []);
        $usuario = $this->authService->registerUser($request->validated());
        
        Auth::login($usuario);
        $this->cartService->mergeSessionAndDbCart($sessionCart, $usuario, $request->session()->getId(), $previousSessionId);

        return redirect()->route('perfil');
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();
        $previousSessionId = $request->session()->getId();

        if (Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            $user = Auth::user();
            
            if ($user->estado === 'bloqueado') {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                return back()->withErrors(['email' => 'Tu cuenta ha sido bloqueada. Contacta con soporte.'])->onlyInput('email');
            }

            $request->session()->regenerate();

            $this->cartService->mergeSessionAndDbCart(
                $request->session()->get('cart', []),
                $user,
                session()->getId(),
                $previousSessionId
            );

            $intendedUrl = session()->pull('url.intended', '/');
            if (Str::contains($intendedUrl, '/admin')) {
                $intendedUrl = '/';
            }
            return redirect()->to($intendedUrl);
        }

        return back()->withErrors([
            'email' => 'Las credenciales proporcionadas no coinciden con nuestros registros.',
        ])->onlyInput('email');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/?login=1');
    }
}

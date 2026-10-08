<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use App\Services\Auth\SocialAuthService;

class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly SocialAuthService $socialAuthService
    ) {}

    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            $sessionCart = session()->get('cart', []);
            $previousSessionId = session()->getId();
            $user = $this->socialAuthService->handleGoogleUser($googleUser, session()->getId(), $sessionCart);

            if ($user->estado === 'bloqueado') {
                return redirect('/login')->withErrors(['email' => 'Tu cuenta ha sido bloqueada. Contacta con soporte.']);
            }

            Auth::login($user, true);
            app(\App\Services\Cart\CartService::class)->mergeSessionAndDbCart($sessionCart, $user, session()->getId(), $previousSessionId);

            $intendedUrl = session()->pull('url.intended', '/perfil?tab=compras');
            if (\Illuminate\Support\Str::contains($intendedUrl, '/admin')) {
                $intendedUrl = '/perfil?tab=compras';
            }
            return redirect()->to($intendedUrl);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth Error: ' . $e->getMessage());
            return redirect('/login')->withErrors(['email' => 'No se pudo iniciar sesión con Google. Intenta nuevamente.']);
        }
    }
}

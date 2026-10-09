<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class StorePasswordController extends Controller
{
    public function requestPage()
    {
        return inertia('Auth/PasswordRecovery');
    }

    public function send(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:254']);
        try {
            Password::broker('users')->sendResetLink($data);
        } catch (\Throwable $exception) {
            report($exception);
            return back()->withErrors(['email' => 'No pudimos enviar el enlace. Intenta nuevamente más tarde.']);
        }
        return back()->with('success', 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.');
    }

    public function resetPage(Request $request, string $token)
    {
        return inertia('Auth/PasswordRecovery', ['token' => $token, 'email' => (string) $request->query('email', '')]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string', 'email' => 'required|email|max:254',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);
        $status = Password::broker('users')->reset($data, function ($user, $password) {
            $user->forceFill(['password_hash' => Hash::make($password), 'has_set_password' => true,
                'remember_token' => Str::random(60)])->save();
            \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->delete();
            event(new \Illuminate\Auth\Events\PasswordReset($user));
        });
        return $status === Password::PASSWORD_RESET
            ? redirect('/login')->with('success', 'Contraseña actualizada. Ya puedes iniciar sesión.')
            : back()->withErrors(['email' => 'El enlace es inválido o expiró. Solicita uno nuevo.']);
    }
}

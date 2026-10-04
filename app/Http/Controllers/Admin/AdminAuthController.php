<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\Admin\Auth\AdminLoginRequest;

class AdminAuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::guard('admin')->check() && Auth::guard('admin')->user()->tienePermiso('ver_dashboard')) {
            return redirect()->route('admin.dashboard');
        }
        return Inertia::render('Admin/Login');
    }

    public function login(AdminLoginRequest $request)
    {
        $credentials = $request->validated();

        if (Auth::guard('admin')->attempt(['email' => $credentials['email'], 'password' => $credentials['password'], 'estado' => 'activo'])) {
            $user = Auth::guard('admin')->user();
            if (!$user->roles()->where('nombre', '!=', 'cliente')->exists() || 
                Illuminate\Support\Facades\Hash::check('12345678', $user->password_hash)) {
                Auth::guard('admin')->logout();
                return back()->withErrors(['email' => 'Acceso administrativo no autorizado.'])->onlyInput('email');
            }

            $request->session()->regenerate();
            
            // Desloguear a este usuario de cualquier otra computadora/sesión activa
            DB::table('sessions')
                ->where('user_id', $user->id)
                ->where('id', '!=', $request->session()->getId())
                ->delete();
            
            if ($user->tienePermiso('ver_dashboard')) {
                return redirect()->route('admin.dashboard');
            } elseif ($user->tienePermiso('pos.vender')) {
                return redirect()->route('admin.pos');
            } elseif ($user->tienePermiso('inventario.gestionar')) {
                return redirect()->route('admin.products');
            } else {
                return redirect()->route('admin.dashboard');
            }
        }

        return back()->withErrors([
            'email' => 'Las credenciales proporcionadas no son correctas.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('admin.login');
    }
}

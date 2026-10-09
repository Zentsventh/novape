<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Auth\AdminLoginRequest;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminAuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::guard('admin')->check() && ($destination = $this->destination(Auth::guard('admin')->user()))) {
            return redirect($destination);
        }

        return Inertia::render('Admin/Login');
    }

    public function login(AdminLoginRequest $request)
    {
        $credentials = $request->validated();

        if (Auth::guard('admin')->attempt(['email' => $credentials['email'], 'password' => $credentials['password'], 'estado' => 'activo'])) {
            $user = Auth::guard('admin')->user();
            if (! $user->roles()->where('nombre', '!=', 'cliente')->exists() ||
                Hash::check('12345678', $user->password_hash)) {
                Auth::guard('admin')->logout();

                return back()->withErrors(['email' => 'Acceso administrativo no autorizado.'])->onlyInput('email');
            }

            $request->session()->regenerate();


            if ($destination = $this->destination($user)) {
                return redirect($destination);
            }
            Auth::guard('admin')->logout();

            return back()->withErrors(['email' => 'Tu cuenta no tiene módulos administrativos asignados.'])->onlyInput('email');
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

    private function destination(Usuario $user): ?string
    {
        if ($user->estado !== 'activo' || ! $user->roles()->where('nombre', '!=', 'cliente')->exists()) {
            return null;
        }
        foreach ([
            'ver_dashboard' => '/admin', 'pos.vender' => '/admin/pos',
            'inventario.gestionar' => '/admin/inventario', 'ver_productos' => '/admin/products',
            'ver_pedidos' => '/admin/pedidos', 'crm.gestionar' => '/admin/crm/dashboard',
            'marketing.gestionar' => '/admin/marketing/campaigns', 'finanzas.gestionar' => '/admin/gastos',
            'ver_usuarios' => '/admin/clientes', 'usuarios.gestionar' => '/admin/roles',
            'ver_analiticas' => '/admin/analiticas', 'gestionar_ajustes' => '/admin/ajustes',
            'gestionar_cupones' => '/admin/cupones', 'gestionar_categorias' => '/admin/categorias',
            'gestionar_marcas' => '/admin/marcas', 'gestionar_omnichannel' => '/admin/inbox',
            'editar_pedido' => '/admin/rma',
        ] as $permission => $path) {
            if ($user->tienePermiso($permission)) {
                return $path;
            }
        }

        return null;
    }
}

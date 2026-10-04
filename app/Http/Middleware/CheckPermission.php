<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, $permiso)
    {
        $guard = $request->is('admin', 'admin/*') ? 'admin' : config('auth.defaults.guard', 'web');
        $user = auth()->guard($guard)->user();

        if (!$user) {
            return $request->expectsJson()
                ? response()->json(['error' => 'No autorizado'], 401)
                : redirect($guard === 'admin' ? route('admin.login') : route('login'));
        }

        if (!$user->tienePermiso($permiso)) {
            abort(403, 'NO TIENES PERMISO PARA ACCEDER A ESTA SECCIÓN.');
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $role
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $role)
    {
        if (!Auth::check()) {
            return $request->expectsJson() 
                ? response()->json(['error' => 'No autorizado'], 401)
                : redirect('/login');
        }

        if (!Auth::user()->tieneRol($role)) {
            // Si es un request AJAX o API, retorna 403.
            if ($request->expectsJson()) {
                return response()->json(['error' => 'No autorizado.'], 403);
            }
            // Si no tiene permiso, redirige a una vista o home.
            return redirect('/')->with('error', 'No tienes permiso para acceder a esta sección.');
        }

        return $next($request);
    }
}

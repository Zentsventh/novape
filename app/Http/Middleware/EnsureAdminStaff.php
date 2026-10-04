<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->guard('admin')->user();
        if (!$user || !$user->roles()->where('nombre', '!=', 'cliente')->exists()) {
            abort(403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Adds the CSS isolation class "storefront" to the <body> tag for public pages.
 * The Blade layout (resources/views/app.blade.php) already checks for this class.
 * This middleware is attached to the "web" group for all storefront routes.
 */
class EnsureStorefront
{
    public function handle(Request $request, Closure $next)
    {
        // Flag the request so the view composer can add the class.
        // We'll share a view variable "isStorefront" used in the layout.
        view()->share('isStorefront', true);
        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->cambiar_password) {
                // Permitimos únicamente la ruta de cambio de contraseña, el guardado de la misma y el cierre de sesión.
                if (!$request->routeIs('password.change', 'password.update', 'logout')) {
                    return redirect()->route('password.change');
                }
            }
        }

        return $next($request);
    }
}

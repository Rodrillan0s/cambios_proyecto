<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permiso): Response
    {
        $permisosUser = $request->session()->get('permisos', []);

        if (!in_array($permiso, $permisosUser)) {
            abort(403, 'No tienes los privilegios requeridos para realizar esta acción.');
        }

        return $next($request);
    }
}

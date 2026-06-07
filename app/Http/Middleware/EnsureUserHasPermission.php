<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EnsureUserHasPermission
{
    public function handle($request, Closure $next, string $permiso)
    {
        $usuario = Auth::user();

        if (!$usuario) {
            abort(403, 'No autenticado');
        }

        $tienePermiso = DB::table('v_usuario_permisos')
            ->where('id_usuario', $usuario->id_usuario)
            ->where('nombre_permiso', $permiso)
            ->exists();

        if (!$tienePermiso) {
            abort(403, 'No tienes permiso para realizar esta acción');
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BitacoraController extends Controller
{
    // Vista Inertia
    public function index()
    {
        return Inertia::render('Admin/Bitacora');
    }

    // API JSON para la tabla
    public function data(Request $request)
    {
        $query = DB::table('cup.t_bitacora as b')
            ->leftJoin('cup.t_usuario as u', 'b.id_usuario', '=', 'u.id_usuario')
            ->leftJoin('cup.t_sesiones as s', 'b.id_sesion', '=', 's.id_sesion')
            ->select(
                'b.id_bitacora',
                'b.modulo',
                'b.accion',
                'b.descripcion',
                'b.metadata',
                'b.fecha_registro',
                'u.id_usuario',
                'u.nombre as usuario_nombre',
                's.ip_direccion',
                's.fecha_inicio',
                's.fecha_fin'
            );

        // Filtros
        if ($request->filled('modulo')) {
            $query->where('b.modulo', $request->modulo);
        }
        if ($request->filled('accion')) {
            $query->where('b.accion', $request->accion);
        }
        if ($request->filled('fecha')) {
            $query->whereDate('b.fecha_registro', $request->fecha);
        }
        if ($request->filled('busqueda')) {
            $q = $request->busqueda;
            $query->where(function ($qbuilder) use ($q) {
                $qbuilder->where('b.descripcion', 'ilike', "%{$q}%")
                         ->orWhere('b.metadata', 'ilike', "%{$q}%");
            });
        }

        $logs = $query->orderBy('b.id_bitacora', 'desc')
                      ->paginate($request->get('per_page', 20));

        return response()->json($logs);
    }
}

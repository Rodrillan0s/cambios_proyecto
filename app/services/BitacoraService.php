<?php

namespace App\Services;

use App\Models\Bitacora;
use Illuminate\Support\Facades\Auth;

class BitacoraService
{
    public static function registrar($modulo, $accion, $descripcion = null, $metadata = null, $idUsuario = null, $idSesion = null)
    {
        Bitacora::create([
            'id_usuario' => $idUsuario ?? Auth::id(),
            'id_sesion'  => $idSesion ?? session('id_sesion'),
            'modulo'     => $modulo,
            'accion'     => $accion,
            'descripcion'=> $descripcion,
            'metadata'   => $metadata,
        ]);
    }
}
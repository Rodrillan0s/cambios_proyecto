<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bitacora extends Model
{
    protected $table = 'cup.t_bitacora'; 
    protected $primaryKey = 'id_bitacora';
    public $timestamps = false; 

    protected $fillable = [
        'id_usuario', 'id_sesion', 'modulo', 'accion', 'descripcion', 'metadata', 'fecha_registro'
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array', 
        ];
    }
}
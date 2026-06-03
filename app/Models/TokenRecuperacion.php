<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TokenRecuperacion extends Model
{
    // Nombre de la tabla con esquema
    protected $table = 'cup.t_token_recuperacion';

    // Clave primaria
    protected $primaryKey = 'id_token';
    public $incrementing = true;
    protected $keyType = 'int';

    // No usar created_at / updated_at
    public $timestamps = false;

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'id_usuario',
        'token_hash',
        'fecha_creacion',
        'fecha_expiracion',
        'usado'
    ];

    // Opcional: setear fecha_creacion automáticamente
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->fecha_creacion)) {
                $model->fecha_creacion = now();
            }
        });
    }
}

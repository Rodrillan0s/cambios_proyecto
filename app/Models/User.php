<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'cup.t_usuario';         // Tu tabla real
    protected $primaryKey = 'id_usuario';   // Tu PK real
    public $timestamps = false;             // Si no tienes created_at/updated_at en t_usuario

    protected $fillable = [
        'usuario', 'password', 'nombre', 'correo', 'estado', 'id_rol', 'cambiar_password',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
}
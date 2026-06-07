<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use App\Services\BitacoraService; // <-- Importación del servicio
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Listar todos los usuarios del sistema.
     */
    public function index(): Response
    {
        $usuarios = DB::table('cup.t_usuario as u')
            ->join('cup.t_rol as r', 'u.id_rol', '=', 'r.id_rol')
            ->select('u.id_usuario', 'u.nombre', 'u.usuario', 'u.correo', 'u.estado', 'r.nombre as nombre_rol')
            ->orderBy('u.id_usuario', 'desc')
            ->get();

        return Inertia::render('Admin/Usuarios/Index', [
            'usuarios' => $usuarios
        ]);
    }

    /**
     * Mostrar el formulario para crear un usuario
     */
    public function create(): Response
    {
        $roles = DB::table('cup.t_rol')
            ->select('id_rol', 'nombre')
            ->where('nombre', '!=', 'POSTULANTE')
            ->get();

        return Inertia::render('Admin/Usuarios/Create', [
            'roles' => $roles
        ]);
    }

    /**
     * Guardar el nuevo usuario.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'nombre'   => ['required', 'string', 'max:100'],
            'usuario'  => ['required', 'string', 'max:50', 'unique:cup.t_usuario,usuario'],
            'correo'   => ['required', 'string', 'lowercase', 'email', 'max:100', 'unique:cup.t_usuario,correo'],
            'id_rol'   => ['required', 'integer', 'exists:cup.t_rol,id_rol'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'usuario.unique' => 'El nombre de usuario ya se encuentra ocupado.',
            'correo.unique'  => 'El correo electrónico ya está registrado.'
        ]);

        try {
            DB::transaction(function () use ($request) {
                DB::table('cup.t_usuario')->insert([
                    'nombre'   => $request->nombre,
                    'usuario'  => $request->usuario,
                    'correo'   => $request->correo,
                    'password' => Hash::make($request->password),
                    'id_rol'   => 1,
                    'estado'   => true, 
                ]);

                BitacoraService::registrar(
                    'POSTULANTE',
                    'REGISTRO DE USUARIO',
                    "Usuario registrado: {$request->usuario} ({$request->correo})",
                    ['IP' => $request->ip()],
                    Auth::id(),
                    session('id_sesion') 
                );
            });

            return redirect()->route('usuarios.index')->with('status', 'La cuenta fue creada correctamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al crear el usuario. Inténtelo de nuevo.'])->withInput();
        }
    }
}
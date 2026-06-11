<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use App\Services\BitacoraService;
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
            ->select('u.id_usuario', 'u.nombre', 'u.usuario', 'u.correo', 'u.estado', 'u.id_rol', 'r.nombre as nombre_rol')
            ->orderBy('u.id_usuario', 'desc')
            ->get();

        $permisosUsuario = DB::table('cup.t_usuario_permiso')
            ->select('id_usuario', 'id_permiso')
            ->get()
            ->groupBy('id_usuario')
            ->map(function ($items) {
                return $items->pluck('id_permiso')->all();
            })
            ->all();

        foreach ($usuarios as $u) {
            $u->permisos_directos = $permisosUsuario[$u->id_usuario] ?? [];
        }

        $roles = DB::table('cup.t_rol')
            ->select('id_rol', 'nombre')
            ->get();

        $rolPermisos = DB::table('cup.t_rol_permiso')
            ->select('id_rol', 'id_permiso')
            ->get()
            ->groupBy('id_rol')
            ->map(function ($items) {
                return $items->pluck('id_permiso')->all();
            })
            ->all();

        return Inertia::render('Admin/Usuarios/Index', [
            'usuarios' => $usuarios,
            'roles' => $roles,
            'permisos' => $permisos,
            'rolPermisos' => $rolPermisos
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
    public function store(Request $request)
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
                $idUsuario = DB::table('cup.t_usuario')->insertGetId([
                    'nombre'   => $request->nombre,
                    'usuario'  => $request->usuario,
                    'correo'   => $request->correo,
                    'password' => Hash::make($request->password),
                    'id_rol'   => $request->id_rol,
                    'estado'   => true, 
                    'cambiar_password' => true
                ], 'id_usuario');

                if ($request->has('permisos')) {
                    $permisos = $request->input('permisos', []);
                    $insertPayload = [];
                    foreach ($permisos as $idPermiso) {
                        $insertPayload[] = [
                            'id_usuario' => $idUsuario,
                            'id_permiso' => $idPermiso
                        ];
                    }
                    if (!empty($insertPayload)) {
                        DB::table('cup.t_usuario_permiso')->insert($insertPayload);
                    }
                }

                BitacoraService::registrar(
                    'POSTULANTE',
                    'REGISTRO DE USUARIO',
                    "Usuario registrado: {$request->usuario} ({$request->correo})",
                    ['IP' => $request->ip()],
                    Auth::id(),
                    session('id_sesion') 
                );
            });

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Usuario creado correctamente.'
                ]);
            }

            return redirect()->route('usuarios.index')->with('status', 'La cuenta fue creada correctamente.');

        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al crear el usuario: ' . $e->getMessage()
                ], 500);
            }
            return back()->withErrors(['error' => 'Error al crear el usuario. Inténtelo de nuevo.'])->withInput();
        }
    }

    /**
     * Actualizar usuario y permisos asociados.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre'  => ['required', 'string', 'max:100'],
            'usuario' => ['required', 'string', 'max:50', 'unique:cup.t_usuario,usuario,' . $id . ',id_usuario'],
            'correo'  => ['required', 'string', 'email', 'max:100', 'unique:cup.t_usuario,correo,' . $id . ',id_usuario'],
            'id_rol'  => ['required', 'integer', 'exists:cup.t_rol,id_rol'],
            'estado'  => ['required', 'boolean'],
        ]);

        try {
            DB::transaction(function () use ($request, $id) {
                DB::table('cup.t_usuario')
                    ->where('id_usuario', $id)
                    ->update([
                        'nombre'  => $request->nombre,
                        'usuario' => $request->usuario,
                        'correo'  => $request->correo,
                        'id_rol'  => $request->id_rol,
                        'estado'  => $request->estado,
                    ]);

                if ($request->has('permisos')) {
                    $permisos = $request->input('permisos', []);

                    DB::table('cup.t_usuario_permiso')
                        ->where('id_usuario', $id)
                        ->delete();

                    $insertPayload = [];
                    foreach ($permisos as $idPermiso) {
                        $insertPayload[] = [
                            'id_usuario' => $id,
                            'id_permiso' => $idPermiso
                        ];
                    }

                    if (!empty($insertPayload)) {
                        DB::table('cup.t_usuario_permiso')->insert($insertPayload);
                    }
                }

                BitacoraService::registrar(
                    'POSTULANTE',
                    'MODIFICAR USUARIO',
                    "Usuario modificado: {$request->usuario} (ID: {$id}). Rol ID: {$request->id_rol}.",
                    ['IP' => $request->ip()],
                    Auth::id(),
                    session('id_sesion')
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Usuario y permisos actualizados correctamente.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar cambios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar usuario del sistema.
     */
    public function destroy(Request $request, $id)
    {
        if (Auth::id() == $id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar tu propia cuenta.'
            ], 400);
        }

        try {
            DB::transaction(function () use ($request, $id) {
                DB::table('cup.t_sesiones')->where('id_usuario', $id)->delete();
                DB::table('cup.t_usuario_permiso')->where('id_usuario', $id)->delete();
                DB::table('cup.t_bitacora')->where('id_usuario', $id)->update(['id_usuario' => null]);
                DB::table('cup.t_usuario')->where('id_usuario', $id)->delete();

                BitacoraService::registrar(
                    'POSTULANTE',
                    'ELIMINAR USUARIO',
                    "Usuario eliminado con ID: {$id}.",
                    ['IP' => $request->ip()],
                    Auth::id(),
                    session('id_sesion')
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el usuario. Está referenciado en el sistema.'
            ], 500);
        }
    }
}
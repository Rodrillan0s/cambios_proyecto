<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        
        // Obtener nombre del rol
        $rol = DB::table('cup.t_rol')->where('id_rol', $user->id_rol)->first();
        $rolNombre = $rol ? $rol->nombre : 'Sin Rol';

        $detalles = null;
        if ($user->id_rol == 3) { // Postulante
            $postulante = DB::table('cup.t_postulante')->where('correo', $user->correo)->first();
            if (!$postulante) {
                $postulante = DB::table('cup.t_postulante')->where('ci', $user->usuario)->first();
            }
            if ($postulante) {
                $detalles = [
                    'ci' => $postulante->ci,
                    'telefono' => $postulante->telefono,
                    'nombres' => $postulante->nombre ?? '',
                    'apellidos' => $postulante->apellidos ?? '',
                ];
            }
        } elseif ($user->id_rol == 2) { // Docente
            $docente = DB::table('cup.t_docente')->where('correo', $user->correo)->first();
            if (!$docente) {
                $docente = DB::table('cup.t_docente')->where('ci', $user->usuario)->first();
            }
            if ($docente) {
                $detalles = [
                    'ci' => $docente->ci,
                    'telefono' => $docente->telefono,
                    'nombres' => $docente->nombres ?? '',
                    'apellidos' => $docente->apellidos ?? '',
                ];
            }
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => false,
            'status' => session('status'),
            'rolNombre' => $rolNombre,
            'detalles' => $detalles,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->nombre = $validated['name'];
        $user->correo = $validated['email'];
        $user->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}

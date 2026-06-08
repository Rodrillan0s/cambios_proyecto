<?php

use App\Http\Controllers\Admin\DocenteController;
use App\Http\Controllers\Admin\GrupoController;
use App\Http\Controllers\Admin\HorarioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostulanteController;
use App\Http\Controllers\Admin\PostulanteController as AdminPostulanteController;
use App\Http\Controllers\Admin\BitacoraController; // 🚀 1. Importamos el controlador
use Illuminate\Foundation\Application;


use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// FLUJO 1: RUTAS PÚBLICAS DE PREINSCRIPCIÓN (Postulantes)
Route::get('/preinscripcion', [PostulanteController::class, 'createPublico'])->name('postulantes.create.publico');
Route::post('/preinscripcion/validar-ia', [PostulanteController::class, 'validarIdentidadIA'])->name('postulantes.validar.ia');
Route::post('/preinscripcion/completar', [PostulanteController::class, 'storePublico'])->name('postulantes.store.publico');
Route::get('/preinscripcion/comprobante/{id}', [PostulanteController::class, 'comprobante'])->name('postulantes.comprobante');

// RUTAS PROTEGIDAS DEL DASHBOARD BÁSICO
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// FLUJO 2: PERMISOS Y RUTAS PROTEGIDAS PARA ADMINISTRACIÓN
Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {

    // LISTAR postulantes
    Route::get('/postulantes', [AdminPostulanteController::class, 'index'])
        ->middleware('permiso:listar_postulantes')
        ->name('admin.postulantes.index');

    // REGISTRAR postulante manual
    Route::post('/postulantes', [AdminPostulanteController::class, 'store'])
        ->middleware('permiso:registrar_postulante')
        ->name('admin.postulantes.store');

    // MODIFICAR postulante
    Route::put('/postulantes/{id}', [AdminPostulanteController::class, 'update'])
        ->middleware('permiso:modificar_postulante')
        ->name('admin.postulantes.update');

    // ELIMINAR postulante
    Route::delete('/postulantes/{id}', [AdminPostulanteController::class, 'destroy'])
        ->middleware('permiso:eliminar_postulante')
        ->name('admin.postulantes.destroy');

    // IMPORTAR postulantes vía Excel/CSV (Solo la versión admin)
    Route::post('/importar-postulantes', [AdminPostulanteController::class, 'importarCSV'])
        ->middleware('permiso:importar_postulantes')
        ->name('admin.postulantes.importar');

    Route::get('/bitacora', [BitacoraController::class, 'index'])
        ->middleware('permiso:consultar_bitacora')
        ->name('admin.bitacora.index');

    // API JSON
    Route::get('/bitacora/data', [BitacoraController::class, 'data'])
        ->middleware('permiso:consultar_bitacora')
        ->name('admin.bitacora.data');

    Route::get('/grupos', [GrupoController::class, 'index'])
        #->middleware('permiso:listar_grupos')
        ->name('admin.grupos.index');

    Route::get('/grupos/data', [GrupoController::class, 'data'])
        #->middleware('permiso:listar_grupos')
        ->name('admin.grupos.data');

    Route::post('/grupos/generar', [GrupoController::class, 'generar'])
        #->middleware('permiso:crear_grupos')
        ->name('admin.grupos.generar');        
    Route::get('/grupos/{id}', [GrupoController::class, 'detalle'])
        #->middleware('permiso:listar_grupos')
       ->name('admin.grupos.detalle');    

Route::get('/horarios', [HorarioController::class, 'index'])
    ->name('admin.horarios.index');

Route::get('/horarios/data', [HorarioController::class, 'data'])
    ->name('admin.horarios.data');

Route::get('/grupos/{id}/horarios', [HorarioController::class, 'porGrupo'])
    ->name('admin.grupos.horarios');

Route::post('/horarios', [HorarioController::class, 'store'])
    ->name('admin.horarios.store');

Route::put('/horarios', [HorarioController::class, 'update'])
    ->name('admin.horarios.update');

Route::delete('/horarios', [HorarioController::class, 'destroy'])
    ->name('admin.horarios.destroy');

Route::get('/materias', function () {
    return \DB::table('cup.t_materia')->get();
});


Route::get(
    '/horarios/bloques/grupo/{idGrupo}',
    [HorarioController::class, 'bloquesPorGrupo']
)->name('admin.horarios.bloques.grupo'); 
    Route::get(
    '/horarios/bloques/disponibles/{idGrupo}',
    [HorarioController::class, 'bloquesDisponibles']
)->name('admin.horarios.bloques.disponibles');

 
  Route::get('/docentes', function () {
    return Inertia::render('Admin/GestionarDocentes');
});

Route::get('/docentes/data', [DocenteController::class, 'data']);

Route::post('/docentes/asignar', [DocenteController::class, 'asignarMateria']);

Route::delete('/docentes/quitar', [DocenteController::class, 'quitarMateria']);
});



require __DIR__ . '/auth.php';

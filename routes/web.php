<?php

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
});

require __DIR__ . '/auth.php';

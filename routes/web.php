<?php

use App\Http\Controllers\Admin\DesempenoFinalController;
use App\Http\Controllers\Admin\NotaController;
use App\Http\Controllers\Admin\LicenciaDocenteController;
use App\Http\Controllers\Admin\ControlAsistenciaController;
use App\Http\Controllers\Admin\DocenteController;
use App\Http\Controllers\Admin\GrupoController;
use App\Http\Controllers\Admin\HorarioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostulanteController;
use App\Http\Controllers\Admin\PostulanteController as AdminPostulanteController;
use App\Http\Controllers\Admin\BitacoraController; // 🚀 1. Importamos el controlador
use App\Http\Controllers\Admin\ReporteController;
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

use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

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
})->name('admin.docentes.index');

Route::get('/docentes/data', [DocenteController::class, 'data']);
Route::post('/docentes', [DocenteController::class, 'store']);
Route::put('/docentes/{id}', [DocenteController::class, 'update']);
Route::delete('/docentes/{id}', [DocenteController::class, 'destroy']);

Route::post('/docentes/asignar', [DocenteController::class, 'asignarMateria']);

Route::delete('/docentes/quitar', [DocenteController::class, 'quitarMateria']);




Route::get('/asistencias', [ControlAsistenciaController::class, 'index'])
    ->name('admin.asistencias.index');

Route::get('/asistencias/data', [ControlAsistenciaController::class, 'data'])
    ->name('admin.asistencias.data');

Route::post('/asistencias', [ControlAsistenciaController::class, 'store'])
    ->name('admin.asistencias.store');
       


Route::get('/licencias-docente', [LicenciaDocenteController::class, 'index'])
    ->name('admin.licencias.index');

Route::get('/licencias-docente/data', [LicenciaDocenteController::class, 'data'])
    ->name('admin.licencias.data');

Route::get('/licencias-docente/docentes', [LicenciaDocenteController::class, 'docentes'])
    ->name('admin.licencias.docentes');

Route::post('/licencias-docente', [LicenciaDocenteController::class, 'store'])
    ->name('admin.licencias.store');

Route::delete('/licencias-docente/{id}', [LicenciaDocenteController::class, 'destroy'])
    ->name('admin.licencias.destroy');

    // =========================
    // VISTA (INERTIA)
    // =========================
    Route::get('/notas', [NotaController::class, 'index'])
        ->name('admin.notas.index');

    // =========================
    // DATA (API)
    // =========================
    Route::get('/notas/data', [NotaController::class, 'data'])
        ->name('admin.notas.data');

    // =========================
    // MATERIAS (API)
    // =========================
    Route::get('/notas/materias', [NotaController::class, 'materias'])
        ->name('admin.notas.materias');

    // =========================
    // CRUD NOTAS
    // =========================
    Route::post('/notas', [NotaController::class, 'store'])
        ->name('admin.notas.store');

    Route::put('/notas/{id}', [NotaController::class, 'update'])
        ->name('admin.notas.update');

    Route::delete('/notas/{id}', [NotaController::class, 'destroy'])
        ->name('admin.notas.destroy');

    Route::post('/notas/importar', [NotaController::class, 'importar'])
    ->name('admin.notas.importar');    


// =========================
// DESEMPEÑO FINAL
// =========================

Route::get('/desempeno', [DesempenoFinalController::class, 'index'])
    ->name('admin.desempeno.index');

Route::get('/desempeno/data', [DesempenoFinalController::class, 'data'])
    ->name('admin.desempeno.data');

Route::post('/desempeno/generar', [DesempenoFinalController::class, 'generar'])
    ->name('admin.desempeno.generar');

Route::get('/desempeno/aprobados', [DesempenoFinalController::class, 'aprobados'])
    ->name('admin.desempeno.aprobados');

Route::get('/desempeno/reprobados', [DesempenoFinalController::class, 'reprobados'])
    ->name('admin.desempeno.reprobados');

    // =========================
    // TABLERO DE REPORTES
    // =========================
    Route::get('/reportes', [ReporteController::class, 'index'])
        ->name('admin.reportes.index');
    Route::get('/reportes/datos', [ReporteController::class, 'obtenerReporte'])
        ->name('admin.reportes.datos');
    Route::get('/reportes/excel', [ReporteController::class, 'exportarExcel'])
        ->name('admin.reportes.excel');
    Route::get('/reportes/word', [ReporteController::class, 'exportarWord'])
        ->name('admin.reportes.word');
});



require __DIR__ . '/auth.php';

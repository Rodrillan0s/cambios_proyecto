import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";

export default function Dashboard({
    rol,
    user,
    postulante = null,
    examenes = [],
    docente = null,
    asignaciones = [],
    asistencias = [],
    hoyDia = "",
    hoyFecha = "",
    gestiones = [],
    selectedGestion = "",
    stats = { postulantes: 0, aprobados: 0, reprobados: 0, ingresos: 0 },
    carrerasData = []
}) {
    // --- ESTADOS PARA EL IMPORTADOR DE POSTULANTES ---
    const [showImporter, setShowImporter] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
        setReport(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("Debes seleccionar un archivo .csv o .xlsx primero.");
            return;
        }

        const formData = new FormData();
        formData.append("archivo", file);

        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await axios.post("/admin/importar-postulantes", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setReport(response.data.data || response.data);
            setFile(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    // --- MANEJO DE ASISTENCIA DEL DOCENTE ---
    const [markingAttendance, setMarkingAttendance] = useState(false);

    const handleMarcarAsistencia = async (asig) => {
        if (!docente) return;
        setMarkingAttendance(true);
        try {
            const res = await axios.post("/admin/asistencias", {
                id_docente: docente.id_docente,
                id_grupo: asig.id_grupo,
                id_materia: asig.id_materia,
                fecha: hoyFecha,
                tiene_asistencia: true
            });
            if (res.data.success || res.status === 200) {
                alert("Asistencia de hoy marcada correctamente.");
                router.reload();
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "No se pudo registrar la asistencia.");
        } finally {
            setMarkingAttendance(false);
        }
    };

    // --- CAMBIO DE GESTIÓN (ADMIN / COORDINADOR / AUTORIDAD) ---
    const handleGestionChange = (e) => {
        router.get(route("dashboard"), { gestion: e.target.value }, { preserveState: true });
    };

    // Calificación de postulantes
    const totalDesempeno = stats.aprobados + stats.reprobados;
    const porcAprobados = totalDesempeno > 0 ? Math.round((stats.aprobados * 100) / totalDesempeno) : 0;
    const porcReprobados = totalDesempeno > 0 ? Math.round((stats.reprobados * 100) / totalDesempeno) : 0;

    return (
        <AuthenticatedLayout 
            header={
                <h2 className="text-xl font-bold text-slate-800">
                    {rol === 1 && "Panel de Administración"}
                    {rol === 5 && "Panel del Coordinador"}
                    {rol === 4 && "Panel de Autoridad Académica"}
                    {rol === 2 && "Panel del Docente"}
                    {rol === 3 && "Portal del Postulante"}
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 space-y-8">

                {/* ==============================================================
                    1. ROL: ADMINISTRADOR, COORDINADOR O AUTORIDAD
                ============================================================== */}
                {(rol === 1 || rol === 4 || rol === 5) && (
                    <div className="space-y-8">
                        {/* Selector de Gestión y Bienvenida */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 leading-snug">
                                    Resumen y Estadísticas Operativas
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Bienvenido, {user.nombre}. Visualiza el estado actual de las admisiones.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-inner">
                                <span className="text-xs font-bold text-slate-500 pl-2">Gestión Activa:</span>
                                <select
                                    value={selectedGestion}
                                    onChange={handleGestionChange}
                                    className="bg-transparent border-0 ring-0 focus:ring-0 text-xs font-black text-slate-800 py-1 pl-1 pr-8 outline-none cursor-pointer"
                                >
                                    {gestiones.map(g => (
                                        <option key={g} value={g}>
                                            {g.substring(4) === "01" ? "1" : "2"}-{g.substring(0, 4)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tarjetas Estadísticas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Card 1 */}
                            <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-2xl border border-indigo-100/60 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Postulantes Registrados</span>
                                    <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.postulantes}</h4>
                                </div>
                                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Card 2 */}
                            <div className="bg-gradient-to-br from-emerald-50/50 to-white p-5 rounded-2xl border border-emerald-100/60 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Postulantes Admitidos</span>
                                    <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.aprobados}</h4>
                                </div>
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Card 3 */}
                            <div className="bg-gradient-to-br from-rose-50/50 to-white p-5 rounded-2xl border border-rose-100/60 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Postulantes Reprobados</span>
                                    <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.reprobados}</h4>
                                </div>
                                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Card 4 */}
                            <div className="bg-gradient-to-br from-amber-50/50 to-white p-5 rounded-2xl border border-amber-100/60 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Ingresos Recaudados</span>
                                    <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.ingresos.toLocaleString()} Bs.</h4>
                                </div>
                                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Gráficos Básicos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Distribución por Carrera */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                    📊 Postulantes por Carrera
                                </h4>
                                <div className="space-y-3.5">
                                    {carrerasData.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">Sin datos registrados para esta gestión.</p>
                                    ) : (
                                        carrerasData.map((c, i) => {
                                            const totalGlobal = stats.postulantes || 1;
                                            const pct = Math.round((c.total * 100) / totalGlobal);
                                            return (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                                        <span className="truncate">{c.carrera}</span>
                                                        <span className="font-mono text-slate-800">{c.total} alumnos ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full bg-indigo-600 transition-all duration-500" 
                                                            style={{ width: `${pct}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Tasa de Aprobación */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                    📈 Rendimiento Académico Final (CUP)
                                </h4>

                                {totalDesempeno === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-6 text-center">No hay registros de rendimiento final consolidados aún.</p>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-around gap-4">
                                            <div className="text-center">
                                                <span className="block text-2xl font-black text-emerald-600">{porcAprobados}%</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Tasa Aprobados</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-2xl font-black text-rose-600">{porcReprobados}%</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Tasa Reprobados</span>
                                            </div>
                                        </div>

                                        <div className="flex h-4 w-full rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${porcAprobados}%` }} title={`Aprobados: ${porcAprobados}%`} />
                                            <div className="h-full bg-rose-500" style={{ width: `${porcReprobados}%` }} title={`Reprobados: ${porcReprobados}%`} />
                                        </div>

                                        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Admitidos ({stats.aprobados})</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-50 rounded-full" /> Reprobados ({stats.reprobados})</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Atajos de Navegación según Rol */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                            <h4 className="font-extrabold text-slate-800 text-sm">
                                Accesos Rápidos
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Atajo de Reportes (Autoridad, Coordinador, Admin) */}
                                <Link
                                    href="/admin/reportes"
                                    className="p-4 bg-slate-50 border border-slate-100 hover:border-indigo-200 rounded-2xl text-left block hover:bg-indigo-50/20 transition group"
                                >
                                    <span className="text-xl group-hover:scale-110 inline-block transition duration-200">📋</span>
                                    <h5 className="font-bold text-slate-800 text-xs mt-2">Tablero de Reportes</h5>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Generación, impresión y descargas oficiales.</p>
                                </Link>

                                {rol === 1 && (
                                    <>
                                        {/* CRUD Postulantes */}
                                        <Link
                                            href="/admin/postulantes"
                                            className="p-4 bg-slate-50 border border-slate-100 hover:border-indigo-200 rounded-2xl text-left block hover:bg-indigo-50/20 transition group"
                                        >
                                            <span className="text-xl group-hover:scale-110 inline-block transition duration-200">👥</span>
                                            <h5 className="font-bold text-slate-800 text-xs mt-2">Gestionar Postulantes</h5>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Control de preinscripciones y pagos.</p>
                                        </Link>

                                        {/* Importador */}
                                        <button
                                            onClick={() => setShowImporter(!showImporter)}
                                            className={`p-4 border rounded-2xl text-left block transition group w-full ${
                                                showImporter 
                                                    ? "bg-indigo-50 border-indigo-200" 
                                                    : "bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20"
                                            }`}
                                        >
                                            <span className="text-xl group-hover:scale-110 inline-block transition duration-200">📤</span>
                                            <h5 className="font-bold text-slate-800 text-xs mt-2">Importación Masiva</h5>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Procesar planilla Excel de estudiantes.</p>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Importador Masivo (Bajo demanda) */}
                        {showImporter && rol === 1 && (
                            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm animate-fade-in">
                                <div className="bg-emerald-50/60 border-b border-emerald-100 px-6 py-4 flex justify-between items-center">
                                    <h4 className="font-extrabold text-emerald-900 text-sm">Carga Masiva de Alumnos (Excel / CSV)</h4>
                                    <button onClick={() => setShowImporter(false)} className="text-emerald-500 hover:text-emerald-800 font-bold text-sm">Cerrar</button>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
                                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition">
                                            <input
                                                type="file"
                                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                                onChange={handleFileChange}
                                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer mx-auto"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-2">Asegúrese de respetar el orden de las columnas (C.I., Nombres, Apellidos, Teléfono, Correo, etc.)</p>
                                        </div>

                                        {error && <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 text-xs font-semibold rounded-xl">⚠️ {error}</div>}

                                        <button
                                            type="submit"
                                            disabled={loading || !file}
                                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow disabled:opacity-40"
                                        >
                                            {loading ? "Procesando registros..." : "Procesar Archivo"}
                                        </button>
                                    </form>

                                    {report && (
                                        <div className="mt-6 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <h5 className="font-bold text-slate-800 text-xs mb-3">Resultados de la Carga</h5>
                                            <div className="flex gap-4">
                                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl flex-1 text-center">
                                                    <span className="block text-2xl font-black">{report.registrados || 0}</span>
                                                    <span className="text-[9px] uppercase font-bold text-slate-400">Registrados</span>
                                                </div>
                                                <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl flex-1 text-center">
                                                    <span className="block text-2xl font-black">{report.duplicados || 0}</span>
                                                    <span className="text-[9px] uppercase font-bold text-slate-400">Duplicados</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ==============================================================
                    2. ROL: DOCENTE
                ============================================================== */}
                {rol === 2 && (
                    <div className="space-y-6">
                        {/* Tarjeta Bienvenida */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <h3 className="text-lg font-black text-slate-800 leading-snug">
                                Panel del Profesor
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Docente: {docente ? `${docente.nombres} ${docente.apellidos}` : user.nombre} | C.I. {docente?.ci}
                            </p>
                        </div>

                        {/* Control de Asistencia de Hoy */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                            <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                                📅 Control de Asistencia Diario (Hoy)
                            </h4>

                            <div className="space-y-3">
                                {asignaciones.filter(a => a.dia_semana === hoyDia).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-2">No tiene asignaturas programadas para el día de hoy ({hoyDia}).</p>
                                ) : (
                                    asignaciones.filter(a => a.dia_semana === hoyDia).map((asig, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                            <div className="space-y-1">
                                                <span className="block text-xs font-bold text-slate-800">{asig.materia}</span>
                                                <span className="block text-[10px] text-slate-500 font-semibold uppercase">Grupo: {asig.grupo} | Horario: {asig.hora_inicio} - {asig.hora_fin}</span>
                                            </div>

                                            <div>
                                                {asig.asistencia_hoy === "PENDIENTE" ? (
                                                    <button
                                                        onClick={() => handleMarcarAsistencia(asig)}
                                                        disabled={markingAttendance}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 disabled:opacity-50"
                                                    >
                                                        {markingAttendance ? "Marcando..." : "Marcar Asistencia"}
                                                    </button>
                                                ) : (
                                                    <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                                        asig.asistencia_hoy === "ASISTIO"
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                            : "bg-rose-50 text-rose-700 border border-rose-100"
                                                    }`}>
                                                        {asig.asistencia_hoy === "ASISTIO" ? "ASISTENCIA REGISTRADA ✅" : "FALTA DETECTADA ❌"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Listado de Asignaciones y Horarios */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                                <h4 className="font-extrabold text-slate-800 text-sm">
                                    Mis Grupos y Horarios Asignados
                                </h4>
                                <div className="divide-y divide-slate-100">
                                    {asignaciones.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No registra asignaciones de carga horaria.</p>
                                    ) : (
                                        asignaciones.map((asig, i) => (
                                            <div key={i} className="py-3 flex items-center justify-between text-xs font-semibold">
                                                <div className="space-y-0.5">
                                                    <span className="block text-slate-800">{asig.materia}</span>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold">{asig.dia_semana} · {asig.hora_inicio} - {asig.hora_fin}</span>
                                                </div>
                                                <span className="text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] border border-indigo-100">
                                                    {asig.grupo}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Historial Asistencias */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                                <h4 className="font-extrabold text-slate-800 text-sm">
                                    Historial Reciente de Asistencias
                                </h4>
                                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                                    {asistencias.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No registra asistencias guardadas aún.</p>
                                    ) : (
                                        asistencias.map((as, i) => (
                                            <div key={i} className="py-2.5 flex justify-between items-center text-xs font-semibold">
                                                <div>
                                                    <span className="block text-slate-800">{as.materia}</span>
                                                    <span className="block text-[10px] text-slate-400 font-mono">{as.fecha} ({as.grupo})</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase ${
                                                    as.tiene_asistencia 
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                                        : "bg-rose-50 text-rose-700 border border-rose-100"
                                                }`}>
                                                    {as.tiene_asistencia ? "ASISTIÓ" : "FALTÓ"}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==============================================================
                    3. ROL: POSTULANTE (Estudiante)
                ============================================================== */}
                {rol === 3 && (
                    <div className="space-y-6">
                        {/* Boleta Informativa */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-800 leading-snug">
                                    Perfil del Postulante
                                </h3>
                                <p className="text-xs text-slate-500 font-semibold">
                                    Postulante: {postulante ? postulante.nombre_completo : user.nombre} | C.I.: {postulante?.ci}
                                </p>
                            </div>

                            {postulante && (
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">Código de Matrícula</span>
                                    <span className="text-base font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl block mt-0.5">
                                        CUP-{new Date().getFullYear()}-{String(postulante.id_postulante).padStart(6, "0")}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Listado de Exámenes y Calificaciones */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Boleta de Notas */}
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                                <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">
                                    Calificaciones por Examen
                                </h4>

                                <div className="overflow-x-auto">
                                    {examenes.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 space-y-2">
                                            <span className="text-3xl">📝</span>
                                            <p className="text-xs font-bold">Aún no se registran exámenes en el sistema.</p>
                                            <p className="text-[10px] text-slate-500 max-w-sm mx-auto">Las notas de tus exámenes teóricos o prácticos aparecerán listadas aquí una vez que sean cargadas por la coordinación académica.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-slate-700 text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                                    <th className="px-4 py-3">Materia</th>
                                                    <th className="px-4 py-3">Nro. Examen</th>
                                                    <th className="px-4 py-3">Fecha de Evaluación</th>
                                                    <th className="px-4 py-3 text-right">Nota / 100</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                                                {examenes.map((ex, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                                                        <td className="px-4 py-3 text-slate-800">{ex.materia}</td>
                                                        <td className="px-4 py-3">Examen {ex.nro_examen}</td>
                                                        <td className="px-4 py-3 font-mono text-slate-400">{ex.fecha_examen}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{ex.nota} Pts.</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Resumen Promedio */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-extrabold text-slate-800 text-sm">
                                        Estado de Aprobación
                                    </h4>

                                    {examenes.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No es posible calcular promedios sin exámenes cargados.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-2xl">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Promedio Acumulado</span>
                                                <h3 className="text-4xl font-black text-slate-800 mt-1">
                                                    {Math.round(examenes.reduce((acc, x) => acc + parseFloat(x.nota), 0) / examenes.length)} Pts.
                                                </h3>
                                            </div>

                                            {(() => {
                                                const avg = examenes.reduce((acc, x) => acc + parseFloat(x.nota), 0) / examenes.length;
                                                const aprobado = avg >= 51;
                                                return (
                                                    <div className={`p-4 border rounded-2xl text-center space-y-1.5 ${
                                                        aprobado 
                                                            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                                                            : "bg-rose-50 border-rose-100 text-rose-800"
                                                    }`}>
                                                        <span className="block text-xs font-black uppercase tracking-wider">{aprobado ? "ADMITIDO" : "NO HABILITADO"}</span>
                                                        <p className="text-[9px] font-semibold text-slate-500 leading-normal">
                                                            {aprobado 
                                                                ? "¡Felicidades! Has superado la nota mínima de admisión (51 Pts.) para formar parte de la FICCT." 
                                                                : "Tu nota acumulada actual es inferior a los 51 puntos mínimos exigidos para la admisión."}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] font-semibold text-indigo-700 leading-normal">
                                    ℹ️ En caso de disconformidad con sus notas cargadas, comuníquese con ventanilla del CUP.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
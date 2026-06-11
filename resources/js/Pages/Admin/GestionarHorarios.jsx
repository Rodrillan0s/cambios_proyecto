import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes"];

const coloresMateria = {
    MATEMATICAS: "bg-blue-50 text-blue-700 border-blue-200",
    FISICA: "bg-emerald-50 text-emerald-700 border-emerald-200",
    INGLES: "bg-amber-50 text-amber-700 border-amber-200",
    COMPUTACION: "bg-purple-50 text-purple-700 border-purple-200",
};

const getColor = (materia) => {
    if (!materia) return "bg-slate-50 text-slate-700 border-slate-200";
    return coloresMateria[materia.toUpperCase()] || "bg-slate-50 text-slate-700 border-slate-200";
};

export default function GestionarHorarios() {
    const [data, setData] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [crear, setCrear] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Selector de Gestión
    const [gestionAnio, setGestionAnio] = useState("2026");
    const [gestionPeriodo, setGestionPeriodo] = useState("1");

    const [form, setForm] = useState({
        id_grupo: "",
        id_materia: "",
        tipo: "",
        hora_inicio: "",
        hora_fin: ""
    });

    const [filtros, setFiltros] = useState({
        grupo: "",
        materia: "",
        dia: ""
    });

    // =========================
    // CARGA GENERAL
    // =========================
    useEffect(() => {
        cargar();
        cargarMaterias();
    }, [gestionAnio, gestionPeriodo]);

    const cargar = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await axios.get("/admin/horarios/data", {
                params: { gestion: `${gestionAnio}0${gestionPeriodo}` }
            });
            setData(res.data || []);
        } catch (e) {
            setErrorMsg("Error al cargar los horarios de la gestión.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const cargarMaterias = async () => {
        try {
            const res = await axios.get("/admin/materias");
            setMaterias(res.data || []);
        } catch {
            setMaterias([]);
        }
    };

    const cargarBloques = async (idGrupo) => {
        try {
            const res = await axios.get(`/admin/horarios/bloques/disponibles/${idGrupo}`);
            setBloques(res.data || []);
        } catch {
            setBloques([]);
        }
    };

    // =========================
    // AGRUPAR POR GRUPO
    // =========================
    const gruposData = useMemo(() => {
        const map = {};

        data
            .filter(h => {
                if (filtros.grupo && h.nombre_grupo !== filtros.grupo) return false;
                if (filtros.materia && h.id_materia != filtros.materia) return false;
                if (filtros.dia && h.dia_semana != filtros.dia) return false;
                return true;
            })
            .forEach(h => {
                if (!map[h.id_grupo]) {
                    map[h.id_grupo] = {
                        id_grupo: h.id_grupo,
                        nombre_grupo: h.nombre_grupo,
                        id_turno: h.id_turno,
                        horarios: []
                    };
                }
                if (h.id_materia) {
                    map[h.id_grupo].horarios.push(h);
                }
            });

        return Object.values(map);
    }, [data, filtros]);

    // =========================
    // ESTADÍSTICAS
    // =========================
    const estadisticas = useMemo(() => {
        const totalGrupos = [...new Set(data.map(d => d.id_grupo))].length;
        const totalClases = data.filter(d => d.id_materia).length;
        const materiasUnicas = [...new Set(data.filter(d => d.id_materia).map(d => d.materia))].length;

        return {
            grupos: totalGrupos,
            clases: totalClases,
            materias: materiasUnicas
        };
    }, [data]);

    // =========================
    // MATERIAS DISPONIBLES
    // =========================
    const materiasDisponibles = useMemo(() => {
        if (!crear) return materias;

        const grupo = gruposData.find(g => g.id_grupo === crear.id_grupo);
        if (!grupo) return materias;

        const usadas = grupo.horarios.map(h => Number(h.id_materia));
        return materias.filter(m => !usadas.includes(Number(m.id_materia)));
    }, [materias, gruposData, crear]);

    // =========================
    // GUARDAR
    // =========================
    const guardar = async () => {
        if (
            !form.id_grupo ||
            !form.id_materia ||
            !form.tipo ||
            !form.hora_inicio ||
            !form.hora_fin
        ) {
            setErrorMsg("Complete todos los campos del bloque.");
            return;
        }

        try {
            const res = await axios.post("/admin/horarios", form);
            if (res.data.success) {
                setMensaje("Horario asignado con éxito.");
                setCrear(null);
                setForm({
                    id_grupo: "",
                    id_materia: "",
                    tipo: "",
                    hora_inicio: "",
                    hora_fin: ""
                });
                cargar();
                setTimeout(() => setMensaje(""), 4000);
            } else {
                setErrorMsg(res.data.message || "Error al asignar el horario.");
            }
        } catch (e) {
            setErrorMsg(e.response?.data?.message || "Ocurrió un error en el servidor.");
        }
    };

    // =========================
    // ELIMINAR
    // =========================
    const eliminar = async (h) => {
        if (!confirm(`¿Está seguro de quitar el horario de ${h.materia} para el ${h.nombre_grupo}?`)) return;

        try {
            const res = await axios.delete("/admin/horarios", {
                headers: { Accept: "application/json" },
                data: {
                    id_grupo: h.id_grupo,
                    id_materia: h.id_materia
                }
            });

            if (res.data.success) {
                setMensaje("Horario eliminado correctamente");
                cargar();
                setTimeout(() => setMensaje(""), 4000);
            }
        } catch (err) {
            setErrorMsg("No se pudo eliminar el horario asignado.");
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            Gestión de Horarios Académicos
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Asignación y distribución de materias y docentes por periodos.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* MENSAJES */}
                {mensaje && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{mensaje}</span>
                    </div>
                )}
                {errorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                        <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* TARJETAS ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-indigo-500 tracking-wider">Grupos con Horario</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.grupos}</h3>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-emerald-500 tracking-wider">Clases Distribuidas</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.clases}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-amber-500 tracking-wider">Materias en Curso</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.materias}</h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* FILTROS Y CONTROL DE GESTIÓN */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        {/* Selector de Gestión */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-bold text-slate-700">Gestión Académica:</span>
                            <div className="flex items-center gap-2">
                                <select
                                    className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 font-semibold text-slate-700 py-1.5"
                                    value={gestionAnio}
                                    onChange={(e) => setGestionAnio(e.target.value)}
                                >
                                    {Array.from({ length: 11 }, (_, i) => 2025 + i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <select
                                    className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 font-semibold text-slate-700 py-1.5"
                                    value={gestionPeriodo}
                                    onChange={(e) => setGestionPeriodo(e.target.value)}
                                >
                                    <option value="1">Gestión 1 (Ene-Jun)</option>
                                    <option value="2">Gestión 2 (Jul-Dic)</option>
                                </select>
                            </div>
                        </div>

                        {/* Limpiar Filtros */}
                        <button
                            className="w-full lg:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                            onClick={() => setFiltros({ grupo: "", materia: "", dia: "" })}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Limpiar Filtros
                        </button>
                    </div>

                    {/* SELECTORES DE FILTROS INTERNOS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-600">Filtrar por Grupo</label>
                            <select
                                className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
                                value={filtros.grupo}
                                onChange={(e) => setFiltros({ ...filtros, grupo: e.target.value })}
                            >
                                <option value="">Todos los grupos</option>
                                {[...new Map(data.map(d => [d.nombre_grupo, d])).values()].map((g, i) => (
                                    <option key={i} value={g.nombre_grupo}>
                                        {g.nombre_grupo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-600">Filtrar por Materia</label>
                            <select
                                className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
                                value={filtros.materia}
                                onChange={(e) => setFiltros({ ...filtros, materia: e.target.value })}
                            >
                                <option value="">Todas las materias</option>
                                {materias.map(m => (
                                    <option key={m.id_materia} value={m.id_materia}>
                                        {m.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-600">Filtrar por Día</label>
                            <select
                                className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
                                value={filtros.dia}
                                onChange={(e) => setFiltros({ ...filtros, dia: e.target.value })}
                            >
                                <option value="">Todos los días</option>
                                {DIAS.map(d => (
                                    <option key={d} value={d} className="capitalize">
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* CONTENEDOR DE HORARIOS */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(n => (
                            <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
                                <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
                                <div className="grid grid-cols-5 gap-3">
                                    {[1, 2, 3, 4, 5].map(x => (
                                        <div key={x} className="h-24 bg-slate-100 rounded-xl"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    gruposData.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center">
                            <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="text-slate-800 font-bold text-lg">No hay horarios registrados</h4>
                            <p className="text-slate-500 text-sm max-w-sm mt-1">
                                No se encontraron cargas horarias para los grupos de la gestión {gestionAnio}-0{gestionPeriodo}.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {gruposData.map(grupo => {
                                const isManana = grupo.id_turno === 1;

                                return (
                                    <div key={grupo.id_grupo} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition duration-200">
                                        {/* Cabecera del Grupo */}
                                        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-black text-lg tracking-wide">
                                                    {grupo.nombre_grupo}
                                                </h3>
                                                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 bg-white/10 rounded-full text-slate-300">
                                                    Gestión {gestionAnio}-0{gestionPeriodo}
                                                </span>
                                            </div>

                                            {/* Turno Badge */}
                                            <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 px-3 py-1 rounded-xl">
                                                {isManana ? (
                                                    <>
                                                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                        <span className="text-amber-300">Turno Mañana</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                        </svg>
                                                        <span className="text-indigo-300">Turno Tarde</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Grid de los 5 días */}
                                        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/40">
                                            {DIAS.map(dia => {
                                                const horariosDia = grupo.horarios.filter(h => h.dia_semana === dia);

                                                return (
                                                    <div key={dia} className="flex flex-col min-h-[160px] p-4">
                                                        {/* Nombre del día */}
                                                        <div className="text-slate-700 font-bold text-xs uppercase tracking-wider mb-3 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                                                            <span>{dia}</span>
                                                            <span className="text-[10px] text-slate-400 font-normal">({horariosDia.length})</span>
                                                        </div>

                                                        {/* Lista de clases */}
                                                        <div className="space-y-2.5 flex-1">
                                                            {horariosDia.map((h, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`group relative border border-slate-200/80 rounded-xl p-3 text-xs shadow-sm transition-all duration-200 border-l-4 ${getColor(h.materia)}`}
                                                                >
                                                                    <div className="font-extrabold pr-4 truncate">
                                                                        {h.materia}
                                                                    </div>
                                                                    <div className="text-[10px] font-semibold text-slate-600 mt-1 flex items-center gap-1">
                                                                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                                                                    </div>
                                                                    <div className="text-[10px] font-medium text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                                                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                        </svg>
                                                                        {h.nombre_docente}
                                                                    </div>

                                                                    {/* Botón Quitar */}
                                                                    <button
                                                                        onClick={() => eliminar(h)}
                                                                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                                        title="Quitar Horario"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* Botón Agregar */}
                                                            <button
                                                                onClick={async () => {
                                                                    await cargarBloques(grupo.id_grupo);
                                                                    setCrear({ id_grupo: grupo.id_grupo, dia_semana: dia });
                                                                    setForm({
                                                                        id_grupo: grupo.id_grupo,
                                                                        id_materia: "",
                                                                        tipo: "",
                                                                        hora_inicio: "",
                                                                        hora_fin: ""
                                                                    });
                                                                }}
                                                                className="w-full py-2 border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-[11px] font-bold text-slate-400 hover:text-indigo-600 rounded-xl transition flex items-center justify-center gap-1"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                Asignar Clase
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>

            {/* MODAL DE ASIGNAR HORARIO */}
            {crear && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100/80 animate-scale-in">
                        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-base">Asignar Clase en Horario</h3>
                                <p className="text-[10px] text-slate-300 capitalize mt-0.5">Día seleccionado: {crear.dia_semana}</p>
                            </div>
                            <button
                                onClick={() => setCrear(null)}
                                className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Materia Académica</label>
                                <select
                                    className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
                                    value={form.id_materia}
                                    onChange={(e) => setForm({ ...form, id_materia: e.target.value })}
                                >
                                    <option value="">Seleccione una materia</option>
                                    {materiasDisponibles.map(m => (
                                        <option key={m.id_materia} value={m.id_materia}>
                                            {m.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Bloque Horario Disponible</label>
                                <select
                                    className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
                                    onChange={(e) => {
                                        const bloque = bloques.find(
                                            b => `${b.tipo}_${b.hora_inicio}_${b.hora_fin}` === e.target.value
                                        );
                                        if (!bloque) return;

                                        setForm({
                                            ...form,
                                            tipo: bloque.tipo,
                                            hora_inicio: bloque.hora_inicio,
                                            hora_fin: bloque.hora_fin
                                        });
                                    }}
                                >
                                    <option value="">Seleccione un bloque de turno</option>
                                    {bloques.map((b, i) => (
                                        <option key={i} value={`${b.tipo}_${b.hora_inicio}_${b.hora_fin}`}>
                                            Frecuencia {b.tipo} | {b.hora_inicio.slice(0, 5)} - {b.hora_fin.slice(0, 5)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-500 flex items-start gap-2 border border-slate-100">
                                <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <span className="font-bold text-slate-700 block mb-0.5">Nota sobre frecuencias:</span>
                                    Frecuencia <b>LV</b> asignará la clase de forma automática a los días <b>Lunes, Miércoles y Viernes</b>. Frecuencia <b>MJ</b> asignará la clase a los días <b>Martes y Jueves</b>.
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setCrear(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardar}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
                            >
                                Asignar Clase
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
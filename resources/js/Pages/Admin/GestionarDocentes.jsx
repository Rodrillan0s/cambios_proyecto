import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

export default function GestionarDocentes() {
    const [docentes, setDocentes] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [grupos, setGrupos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Modals
    const [modalDocente, setModalDocente] = useState(false);
    const [modalAsignar, setModalAsignar] = useState(false);

    // Forms
    const [docenteForm, setDocenteForm] = useState({
        id_docente: "",
        ci: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        correo: "",
        profesion: "",
        maestria: false,
        diplomado_es: false
    });

    const [asignarForm, setAsignarForm] = useState({
        id_docente: "",
        id_grupo: "",
        id_materia: ""
    });

    // =========================
    // CARGAR DATOS
    // =========================
    useEffect(() => {
        cargarTodo();
    }, []);

    const cargarTodo = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const [resDoc, resMat, resGru] = await Promise.all([
                axios.get("/admin/docentes/data"),
                axios.get("/admin/materias"),
                axios.get("/admin/grupos/data")
            ]);

            setDocentes(resDoc.data || []);
            setMaterias(resMat.data || []);
            setGrupos(resGru.data || []);

        } catch (e) {
            console.error("Error cargando datos:", e);
            setErrorMsg("No se pudieron obtener los datos de los docentes.");
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // GUARDAR DOCENTE (CREAR / EDITAR)
    // =========================
    const guardarDocente = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!docenteForm.ci || !docenteForm.nombres || !docenteForm.apellidos) {
            setErrorMsg("CI, Nombres y Apellidos son requeridos.");
            return;
        }

        try {
            if (docenteForm.id_docente) {
                // Editar
                const res = await axios.put(`/admin/docentes/${docenteForm.id_docente}`, docenteForm);
                setMensaje(res.data.msg || "Docente actualizado con éxito.");
            } else {
                // Crear
                const res = await axios.post("/admin/docentes", docenteForm);
                setMensaje("Docente registrado con éxito.");
            }

            setModalDocente(false);
            limpiarDocenteForm();
            cargarTodo();
            setTimeout(() => setMensaje(""), 4000);

        } catch (e) {
            setErrorMsg(e.response?.data?.message || "Ocurrió un error al guardar el docente.");
        }
    };

    const limpiarDocenteForm = () => {
        setDocenteForm({
            id_docente: "",
            ci: "",
            nombres: "",
            apellidos: "",
            telefono: "",
            correo: "",
            profesion: "",
            maestria: false,
            diplomado_es: false
        });
    };

    // =========================
    // ELIMINAR DOCENTE
    // =========================
    const eliminarDocente = async (docente) => {
        if (!confirm(`¿Está seguro de eliminar al docente ${docente.nombres} ${docente.apellidos}? Esto quitará todas sus asignaciones.`)) return;

        setErrorMsg("");
        try {
            const res = await axios.delete(`/admin/docentes/${docente.id_docente}`);
            setMensaje(res.data.msg || "Docente eliminado correctamente.");
            cargarTodo();
            setTimeout(() => setMensaje(""), 4000);
        } catch (e) {
            setErrorMsg("Error al eliminar el docente.");
        }
    };

    // =========================
    // ASIGNAR MATERIA
    // =========================
    const asignarMateria = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!asignarForm.id_grupo || !asignarForm.id_materia) {
            setErrorMsg("Debe seleccionar un grupo y una materia.");
            return;
        }

        try {
            const res = await axios.post("/admin/docentes/asignar", asignarForm);
            setMensaje(res.data.msg || "Materia asignada correctamente.");
            setModalAsignar(false);
            setAsignarForm({ id_docente: "", id_grupo: "", id_materia: "" });
            cargarTodo();
            setTimeout(() => setMensaje(""), 4000);
        } catch (e) {
            setErrorMsg(e.response?.data?.msg || "Error al asignar la materia.");
        }
    };

    // =========================
    // QUITAR MATERIA
    // =========================
    const quitarMateria = async (id_docente, id_grupo, id_materia) => {
        if (!confirm("¿Está seguro de quitar esta materia asignada?")) return;

        setErrorMsg("");
        try {
            const res = await axios.delete("/admin/docentes/quitar", {
                data: { id_docente, id_grupo, id_materia }
            });
            setMensaje(res.data.msg || "Asignación removida.");
            cargarTodo();
            setTimeout(() => setMensaje(""), 4000);
        } catch (e) {
            setErrorMsg("Error al remover la asignación.");
        }
    };

    // =========================
    // BÚSQUEDA Y FILTRADO
    // =========================
    const docentesFiltrados = useMemo(() => {
        if (!busqueda) return docentes;
        const q = busqueda.toLowerCase().trim();
        return docentes.filter(d => 
            d.nombres.toLowerCase().includes(q) || 
            d.apellidos.toLowerCase().includes(q) || 
            d.ci.includes(q) ||
            (d.profesion && d.profesion.toLowerCase().includes(q))
        );
    }, [docentes, busqueda]);

    // =========================
    // ESTADÍSTICAS
    // =========================
    const estadisticas = useMemo(() => {
        const total = docentes.length;
        const conMaestria = docentes.filter(d => d.maestria).length;
        const conDiplomado = docentes.filter(d => d.diplomado_es).length;
        const conClases = docentes.filter(d => d.materias && d.materias.length > 0).length;

        return { total, conMaestria, conDiplomado, conClases };
    }, [docentes]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            Gestión de Personal Docente
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Administración de perfiles profesionales y carga docente.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            limpiarDocenteForm();
                            setModalDocente(true);
                        }}
                        className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        Registrar Docente
                    </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-indigo-500 tracking-wider font-mono">Total Docentes</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.total}</h3>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-violet-50 to-white p-5 rounded-2xl border border-violet-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-violet-500 tracking-wider font-mono">Con Maestría</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.conMaestria}</h3>
                        </div>
                        <div className="p-3 bg-violet-500/10 text-violet-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-emerald-500 tracking-wider font-mono">Con Diplomado ES</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.conDiplomado}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-amber-500 tracking-wider font-mono">Carga Asignada</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.conClases}</h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar docente por nombres, apellidos, CI o profesión..."
                            className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full pl-10"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                {/* LISTADO DE DOCENTES */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                                        <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                                    </div>
                                </div>
                                <div className="h-10 bg-slate-100 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    docentesFiltrados.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center">
                            <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h4 className="text-slate-800 font-bold text-lg">No se encontraron docentes</h4>
                            <p className="text-slate-500 text-sm max-w-sm mt-1">
                                {busqueda ? "Ningún docente coincide con el criterio de búsqueda." : "No hay docentes registrados en el sistema."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {docentesFiltrados.map(d => (
                                <div key={d.id_docente} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-lg font-black shrink-0">
                                                    {d.nombres.charAt(0)}{d.apellidos.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-slate-800 text-base leading-snug">
                                                        {d.nombres} {d.apellidos}
                                                    </h3>
                                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                                        C.I. {d.ci}
                                                    </p>
                                                    {d.profesion && (
                                                        <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1.5 uppercase">
                                                            {d.profesion}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Grados académicos */}
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                {d.maestria && (
                                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md">
                                                        Maestría
                                                    </span>
                                                )}
                                                {d.diplomado_es && (
                                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                                                        Diplomado ES
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contacto */}
                                        <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-t border-b border-slate-100">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span>{d.telefono || "-"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-600 truncate">
                                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">{d.correo || "-"}</span>
                                            </div>
                                        </div>

                                        {/* Materias asignadas */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Materias Asignadas:</h4>
                                            {d.materias && d.materias.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {d.materias.map((m, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700">
                                                            <span className="font-semibold">{m.materia} <span className="text-indigo-600 font-bold ml-1">({m.grupo})</span></span>
                                                            <button
                                                                onClick={() => quitarMateria(d.id_docente, m.id_grupo, m.id_materia)}
                                                                className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition"
                                                                title="Quitar Asignación"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">Ninguna materia asignada.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Panel de acciones */}
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                                        <button
                                            onClick={() => {
                                                setAsignarForm({ id_docente: d.id_docente, id_grupo: "", id_materia: "" });
                                                setModalAsignar(true);
                                            }}
                                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Asignar Materia
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setDocenteForm({
                                                        id_docente: d.id_docente,
                                                        ci: d.ci,
                                                        nombres: d.nombres,
                                                        apellidos: d.apellidos,
                                                        telefono: d.telefono || "",
                                                        correo: d.correo || "",
                                                        profesion: d.profesion || "",
                                                        maestria: !!d.maestria,
                                                        diplomado_es: !!d.diplomado_es
                                                    });
                                                    setModalDocente(true);
                                                }}
                                                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition flex items-center gap-1"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => eliminarDocente(d)}
                                                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* MODAL CREAR / EDITAR DOCENTE */}
            {modalDocente && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <form onSubmit={guardarDocente} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100/80 animate-scale-in">
                        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
                            <h3 className="font-extrabold text-base">
                                {docenteForm.id_docente ? "Modificar Datos del Docente" : "Registrar Nuevo Docente"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalDocente(false)}
                                className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Cédula de Identidad (CI)</label>
                                    <input
                                        type="text"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={docenteForm.ci}
                                        onChange={(e) => setDocenteForm({ ...docenteForm, ci: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Profesión / Título</label>
                                    <input
                                        type="text"
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={docenteForm.profesion}
                                        onChange={(e) => setDocenteForm({ ...docenteForm, profesion: e.target.value })}
                                        placeholder="Ej: Lic. en Ciencias de la Computación"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Nombres</label>
                                    <input
                                        type="text"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={docenteForm.nombres}
                                        onChange={(e) => setDocenteForm({ ...docenteForm, nombres: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Apellidos</label>
                                    <input
                                        type="text"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={docenteForm.apellidos}
                                        onChange={(e) => setDocenteForm({ ...docenteForm, apellidos: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Teléfono</label>
                                    <input
                                        type="text"
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={docenteForm.telefono}
                                        onChange={(e) => setDocenteForm({ ...docenteForm, telefono: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={docenteForm.correo}
                                        onChange={(e) => setDocenteForm({ ...docenteForm, correo: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Requisitos de Grado Académico */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Estudios de Postgrado</h4>
                                <div className="flex flex-col gap-2.5">
                                    <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            checked={docenteForm.maestria}
                                            onChange={(e) => setDocenteForm({ ...docenteForm, maestria: e.target.checked })}
                                        />
                                        <span>¿Cuenta con Grado de Maestría?</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            checked={docenteForm.diplomado_es}
                                            onChange={(e) => setDocenteForm({ ...docenteForm, diplomado_es: e.target.checked })}
                                        />
                                        <span>¿Cuenta con Diplomado en Educación Superior?</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setModalDocente(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
                            >
                                Guardar Datos
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL ASIGNAR MATERIA */}
            {modalAsignar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <form onSubmit={asignarMateria} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100/80 animate-scale-in">
                        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
                            <h3 className="font-extrabold text-base">Asignar Materia a Docente</h3>
                            <button
                                type="button"
                                onClick={() => setModalAsignar(false)}
                                className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Grupo de Estudiantes</label>
                                <select
                                    required
                                    className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
                                    value={asignarForm.id_grupo}
                                    onChange={(e) => setAsignarForm({ ...asignarForm, id_grupo: e.target.value })}
                                >
                                    <option value="">Seleccione un grupo</option>
                                    {grupos.map(g => (
                                        <option key={g.id_grupo} value={g.id_grupo}>
                                            {g.nombre_grupo} (Turno {g.id_turno === 1 ? 'Mañana' : 'Tarde'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Materia Académica</label>
                                <select
                                    required
                                    className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
                                    value={asignarForm.id_materia}
                                    onChange={(e) => setAsignarForm({ ...asignarForm, id_materia: e.target.value })}
                                >
                                    <option value="">Seleccione una materia</option>
                                    {materias.map(m => (
                                        <option key={m.id_materia} value={m.id_materia}>
                                            {m.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setModalAsignar(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
                            >
                                Asignar Materia
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

export default function Reportes({ gestiones = [] }) {
    // List of reports (No emojis in labels)
    const reportesList = [
        { id: "general-postulantes", label: "Lista General de Postulantes", icon: "", category: "Postulantes", desc: "Lista de postulantes registrados con sus datos de contacto y estado de pago." },
        { id: "postulantes-aprobados", label: "Postulantes Aprobados", icon: "", category: "Postulantes", desc: "Postulantes que superaron el examen de admisión con promedio final de aprobación." },
        { id: "postulantes-admitidos", label: "Postulantes Admitidos", icon: "", category: "Postulantes", desc: "Postulantes oficialmente admitidos en base al cupo y promedio final." },
        { id: "postulantes-reprobados", label: "Postulantes Reprobados", icon: "", category: "Postulantes", desc: "Postulantes con notas acumuladas insuficientes para la admisión." },
        { id: "promedios-generales", label: "Promedios Generales", icon: "", category: "Postulantes", desc: "Promedio general obtenido por materia evaluada en la gestión actual." },
        { id: "postulantes-concurrentes", label: "Postulantes Concurrentes", icon: "", category: "Postulantes", desc: "Postulantes históricos con múltiples intentos de admisión en el sistema." },

        { id: "grupos-habilitados", label: "Cantidad de Grupos Habilitados", icon: "", category: "Grupos", desc: "Listado de grupos activos con turnos, capacidades e inscritos." },
        { id: "grupos-aprobados", label: "Grupos con más Admitidos", icon: "", category: "Grupos", desc: "Grupos de estudiantes ordenados por cantidad de alumnos admitidos." },

        { id: "docentes-grupo", label: "Docentes por Grupos", icon: "", category: "Docentes", desc: "Asignación detallada de docentes y materias por grupos." },
        { id: "docentes-faltas", label: "Docentes con más Faltas", icon: "", category: "Docentes", desc: "Docentes ordenados por inasistencias en clases programadas." },
        { id: "docentes-perfecta", label: "Docentes con Asistencia Perfecta", icon: "", category: "Docentes", desc: "Docentes con cumplimiento de asistencia óptimo o perfecto (>= 95%)." },
        { id: "docentes-aprobados", label: "Docentes con mayor tasa de Aprobados", icon: "", category: "Docentes", desc: "Docentes clasificados por el rendimiento de aprobación de sus grupos asignados." },

        { id: "estadisticas-materia", label: "Estadísticas por Materia", icon: "", category: "Materias", desc: "Rendimiento, promedios e índices de aprobación para cada materia." },
        { id: "materia-reprobados", label: "Materia con más Reprobados", icon: "", category: "Materias", desc: "Materias ordenadas descendentemente por tasa de reprobación de postulantes." },

        { id: "ingresos-gestion", label: "Total Ingresos por Gestión", icon: "", category: "Ingresos", desc: "Total recaudado por inscripciones agrupado por periodo académico." },
        { id: "ingresos-carrera", label: "Total Ingresos por Carrera", icon: "", category: "Ingresos", desc: "Total recaudado agrupado por la carrera elegida como primera opción." },
    ];

    // States
    const [selectedReport, setSelectedReport] = useState("general-postulantes");
    const [selectedGestion, setSelectedGestion] = useState(gestiones[0] || "");
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    
    // Sidebar search & category tab filter
    const [sidebarSearch, setSidebarSearch] = useState("");
    const [activeTab, setActiveTab] = useState("Todos");

    // Voice recognition states
    const [listening, setListening] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState("");

    // Fetch report data
    const cargarDatos = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await axios.get(route('admin.reportes.datos'), {
                params: {
                    type: selectedReport,
                    gestion: selectedReport === "ingresos-gestion" || selectedReport === "postulantes-concurrentes" ? "" : selectedGestion
                }
            });
            if (res.data && res.data.ok) {
                setReportData(res.data.data || []);
            } else {
                setReportData([]);
            }
        } catch (e) {
            console.error("Error cargando reporte:", e);
            setErrorMsg("Error al obtener los datos. Verifique la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [selectedReport, selectedGestion]);

    // Export Excel (.xlsx)
    const handleExportExcel = () => {
        const url = route('admin.reportes.excel', {
            type: selectedReport,
            gestion: selectedGestion
        });
        window.open(url, '_blank');
    };

    // Export Word (.doc Landscape)
    const handleExportWord = () => {
        const url = route('admin.reportes.word', {
            type: selectedReport,
            gestion: selectedGestion
        });
        window.open(url, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    // Voice commands listener
    const startSpeech = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Su navegador no soporta Speech Recognition API. Use Google Chrome o MS Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setListening(true);
            setVoiceFeedback("Escuchando...");
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.onerror = (e) => {
            console.error("Speech recognition error", e);
            setListening(false);
            setVoiceFeedback("Error de audio");
            setTimeout(() => setVoiceFeedback(""), 3000);
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript.toLowerCase();
            setVoiceFeedback(`Escuchado: "${text}"`);
            
            // 1. Normalizar números y palabras clave de periodo
            let normalizedText = text
                .replace(/\buno\b/g, "1")
                .replace(/\bdos\b/g, "2")
                .replace(/\bprimer\b/g, "1")
                .replace(/\bsegundo\b/g, "2")
                .replace(/\bprimera\b/g, "1")
                .replace(/\bsegunda\b/g, "2")
                .replace(/\bdos\b/g, "2")
                .replace(/\bmil\b/g, "")
                .replace(/\bveinticinco\b/g, "25")
                .replace(/\bveinticuatro\b/g, "24")
                .replace(/\bveintiseis\b/g, "26")
                .replace(/\bveintitrés\b/g, "23")
                .replace(/\bveintitres\b/g, "23");

            // 2. Extraer Año y Periodo
            let year = null;
            let period = null;

            const p1 = normalizedText.match(/\b([12])\s*[-/]?\s*de?l?\s*(20\d{2})\b/);
            const p2 = normalizedText.match(/\b(20\d{2})\s*[-/]?\s*([12])\b/);
            const p3 = normalizedText.match(/\b([12])\s+e?n?\s*(20\d{2})\b/);
            const p4 = normalizedText.match(/\b([12])\s*-\s*(\d{2})\b/);

            if (p1) {
                period = p1[1];
                year = p1[2];
            } else if (p2) {
                year = p2[1];
                period = p2[2];
            } else if (p3) {
                period = p3[1];
                year = p3[2];
            } else if (p4) {
                period = p4[1];
                year = "20" + p4[2];
            } else {
                const yearMatch = normalizedText.match(/\b(20\d{2})\b/);
                if (yearMatch) {
                    year = yearMatch[1];
                }
            }

            // Aplicar gestión si se detectó
            let detectedGestionStr = "";
            if (year) {
                if (period) {
                    const candidate = `${year}${period === "1" ? "01" : "02"}`;
                    if (gestiones.includes(candidate)) {
                        setSelectedGestion(candidate);
                        detectedGestionStr = ` para la Gestión ${period}-${year}`;
                    }
                } else {
                    const candidate = gestiones.find(g => g.startsWith(year));
                    if (candidate) {
                        setSelectedGestion(candidate);
                        const pNum = candidate.substring(4) === "01" ? "1" : "2";
                        detectedGestionStr = ` para la Gestión ${pNum}-${year}`;
                    }
                }
            }

            // 3. Buscar coincidencia de reporte
            let match = null;

            if (text.includes("falta") || text.includes("inasistencia")) {
                match = "docentes-faltas";
            } else if (text.includes("asistencia perfecta") || text.includes("perfecta") || text.includes("asistencia óptima") || text.includes("optima")) {
                match = "docentes-perfecta";
            } else if (text.includes("ingresos por gestión") || text.includes("ingresos por gestion") || text.includes("ingresos gestion")) {
                match = "ingresos-gestion";
            } else if (text.includes("ingresos por carrera") || text.includes("ingresos carrera") || text.includes("monetario por carrera") || text.includes("ingreso por carrera")) {
                match = "ingresos-carrera";
            } else if (text.includes("docentes con más aprobados") || text.includes("docentes aprobados") || text.includes("mayor aprobados")) {
                match = "docentes-aprobados";
            } else if (text.includes("materia con más reprobados") || text.includes("materia reprobados") || text.includes("mas reprobados")) {
                match = "materia-reprobados";
            } else if (text.includes("concurrentes") || text.includes("re-postulantes") || text.includes("repetidos")) {
                match = "postulantes-concurrentes";
            } else if (text.includes("lista general") || text.includes("general postulantes") || text.includes("lista de postulantes")) {
                match = "general-postulantes";
            } else if (text.includes("postulantes admitidos") || text.includes("estudiantes admitidos") || text.includes("reporte de admitidos") || text.includes("admitidos")) {
                match = "postulantes-admitidos";
            } else if (text.includes("postulantes aprobados") || text.includes("estudiantes aprobados") || text.includes("reporte de aprobados") || text.includes("aprobados")) {
                match = "postulantes-aprobados";
            } else if (text.includes("postulantes reprobados") || text.includes("estudiantes reprobados") || text.includes("reporte de reprobados") || text.includes("reprobados")) {
                match = "postulantes-reprobados";
            } else if (text.includes("promedios") || text.includes("notas medias")) {
                match = "promedios-generales";
            } else if (text.includes("grupos habilitados") || text.includes("total grupos")) {
                match = "grupos-habilitados";
            } else if (text.includes("estadísticas por materia") || text.includes("estadisticas materia")) {
                match = "estadisticas-materia";
            } else if (text.includes("docentes por grupo") || text.includes("docentes grupo")) {
                match = "docentes-grupo";
            } else if (text.includes("grupos con más aprobados") || text.includes("grupos aprobados")) {
                match = "grupos-aprobados";
            }

            if (match) {
                setSelectedReport(match);
                setVoiceFeedback(`Cargando: ${reportesList.find(r => r.id === match)?.label}${detectedGestionStr}`);
            } else if (detectedGestionStr) {
                setVoiceFeedback(`Cargando periodo:${detectedGestionStr}`);
            } else {
                setVoiceFeedback("Comando no reconocido. Revisa la guía de comandos.");
            }

            setTimeout(() => setVoiceFeedback(""), 5000);
        };

        recognition.start();
    };

    // Header mappings for display
    const headerMapping = {
        ci: "C.I.",
        nombres: "Nombres",
        nombre: "Nombre",
        apellidos: "Apellidos",
        postulante: "Postulante",
        profesion: "Profesión",
        total_clases: "Total Clases",
        faltas: "Faltas",
        asistencias: "Asistencias",
        porcentaje: "Porcentaje %",
        total_pagos: "Total Transacciones",
        total_ingresos: "Total Ingresos (Bs.)",
        carrera: "Carrera de Admisión",
        carrera_admitido: "Carrera Admitida",
        total_estudiantes: "Alumnos Inscritos",
        aprobados: "Aprobados",
        admitidos: "Admitidos",
        tasa_aprobacion: "Tasa Aprobación %",
        tasa_admision: "Tasa Admisión %",
        tasa_aprobados: "Tasa Aprobación %",
        tasa_admitidos: "Tasa Admisión %",
        materia: "Materia",
        total_alumnos: "Alumnos Evaluados",
        tasa_reprobados: "Tasa Reprobación %",
        promedio_nota: "Nota Promedio",
        postulaciones: "Postulaciones",
        gestiones: "Gestiones Registradas",
        correo: "Correo Electrónico",
        telefono: "Teléfono de Contacto",
        fecha_registro: "Fecha Inscripción",
        carrera_1: "Primera Opción",
        carrera_2: "Segunda Opción",
        monto_pago: "Monto Cancelado (Bs.)",
        estado_pago: "Estado Pago",
        promedio_matematicas: "Matemáticas",
        promedio_fisica: "Física",
        promedio_computacion: "Computación",
        promedio_ingles: "Inglés",
        promedio_final: "Promedio Final",
        nombre_grupo: "Grupo Asignado",
        avg_matematicas: "Matemáticas",
        avg_fisica: "Física",
        avg_computacion: "Computación",
        avg_ingles: "Inglés",
        avg_final: "Promedio Final",
        total_postulantes: "Evaluados",
        capacidad: "Capacidad Máx.",
        turno: "Turno Horario",
        ci_docente: "C.I. Docente",
        docente: "Docente Asignado"
    };

    // Dynamic metrics calculation for stats panel
    const metricasResumen = useMemo(() => {
        if (!reportData || reportData.length === 0) return [];
        const count = reportData.length;

        switch (selectedReport) {
            case "docentes-faltas":
                const totalFaltas = reportData.reduce((acc, row) => acc + intVal(row.faltas), 0);
                const maxFaltas = Math.max(...reportData.map(row => intVal(row.faltas)));
                return [
                    { label: "Total Docentes con Faltas", value: count, color: "text-rose-600 bg-rose-50" },
                    { label: "Faltas Totales Registradas", value: totalFaltas, color: "text-amber-600 bg-amber-50" },
                    { label: "Récord de Faltas Unitario", value: maxFaltas > 0 ? maxFaltas : 0, color: "text-red-700 bg-red-50" }
                ];
            case "docentes-perfecta":
                return [
                    { label: "Docentes con Cumplimiento", value: count, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Calificación Promedio", value: "95% - 100%", color: "text-indigo-600 bg-indigo-50" }
                ];
            case "ingresos-gestion":
                const totalGestionIng = reportData.reduce((acc, row) => acc + floatVal(row.total_ingresos), 0);
                const maxIngGestion = reportData.length > 0 ? reportData[0].gestion : "-";
                return [
                    { label: "Recaudación Histórica", value: `${totalGestionIng.toLocaleString()} Bs.`, color: "text-indigo-600 bg-indigo-50" },
                    { label: "Gestiones Registradas", value: count, color: "text-slate-600 bg-slate-50" },
                    { label: "Última Gestión", value: maxIngGestion, color: "text-emerald-600 bg-emerald-50" }
                ];
            case "ingresos-carrera":
                const totalCarreraIng = reportData.reduce((acc, row) => acc + floatVal(row.total_ingresos), 0);
                const carreraTop = reportData.length > 0 ? reportData[0].carrera : "-";
                return [
                    { label: "Total Recaudado Periodo", value: `${totalCarreraIng.toLocaleString()} Bs.`, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Carreras con Ingresos", value: count, color: "text-indigo-600 bg-indigo-50" },
                    { label: "Carrera Mayor Demanda", value: carreraTop, color: "text-amber-600 bg-amber-50" }
                ];
            case "docentes-aprobados":
                const maxTasaAdm = count > 0 ? `${reportData[0].tasa_admision}%` : "-";
                return [
                    { label: "Docentes Analizados", value: count, color: "text-slate-600 bg-slate-50" },
                    { label: "Mayor Tasa Admisión", value: maxTasaAdm, color: "text-emerald-600 bg-emerald-50" }
                ];
            case "materia-reprobados":
            case "estadisticas-materia":
                const materiaMasDificil = reportData.length > 0 ? reportData[0].materia : "-";
                const tasaMaxRep = count > 0 ? `${reportData[0].tasa_reprobados}%` : "-";
                return [
                    { label: "Materias Analizadas", value: count, color: "text-indigo-600 bg-indigo-50" },
                    { label: "Materia con Más Reprobados", value: materiaMasDificil, color: "text-rose-600 bg-rose-50" },
                    { label: "Tasa Máxima Reprobación", value: tasaMaxRep, color: "text-red-600 bg-red-50" }
                ];
            case "postulantes-concurrentes":
                const maxPostulaciones = count > 0 ? Math.max(...reportData.map(row => intVal(row.postulaciones))) : 0;
                return [
                    { label: "Postulantes Concurrentes", value: count, color: "text-amber-600 bg-amber-50" },
                    { label: "Máximas Re-postulaciones", value: `${maxPostulaciones} intentos`, color: "text-indigo-600 bg-indigo-50" }
                ];
            case "general-postulantes":
                const pagosAprobados = reportData.filter(p => p.estado_pago === "APROBADO").length;
                return [
                    { label: "Postulantes Totales", value: count, color: "text-slate-600 bg-slate-50" },
                    { label: "Pagos Confirmados", value: pagosAprobados, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Porcentaje Pagado", value: count > 0 ? `${round(pagosAprobados * 100.0 / count)}%` : "0%", color: "text-indigo-600 bg-indigo-50" }
                ];
            case "postulantes-aprobados":
                const notaMasAlta = count > 0 ? floatVal(reportData[0].promedio_final) : 0;
                return [
                    { label: "Total Aprobados", value: count, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Nota Más Alta", value: `${notaMasAlta} Pts.`, color: "text-amber-600 bg-amber-50" }
                ];
            case "postulantes-admitidos":
                const notaMasAltaAdm = count > 0 ? floatVal(reportData[0].promedio_final) : 0;
                return [
                    { label: "Total Admitidos", value: count, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Nota Más Alta", value: `${notaMasAltaAdm} Pts.`, color: "text-amber-600 bg-amber-50" }
                ];
            case "postulantes-reprobados":
                return [
                    { label: "Total Reprobados", value: count, color: "text-rose-600 bg-rose-50" }
                ];
            case "promedios-generales":
                const pFinal = reportData[0]?.avg_final || 0;
                return [
                    { label: "Promedio Global CUP", value: `${pFinal} / 100`, color: "text-indigo-600 bg-indigo-50" },
                    { label: "Total Evaluados", value: reportData[0]?.total_postulantes || 0, color: "text-slate-600 bg-slate-50" }
                ];
            case "grupos-habilitados":
                const totalCapacidad = reportData.reduce((acc, row) => acc + intVal(row.capacidad), 0);
                const totalInscritos = reportData.reduce((acc, row) => acc + intVal(row.total_postulantes), 0);
                return [
                    { label: "Grupos Habilitados", value: count, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Inscritos Totales", value: totalInscritos, color: "text-indigo-600 bg-indigo-50" },
                    { label: "Capacidad Total", value: totalCapacidad, color: "text-slate-600 bg-slate-50" }
                ];
            case "grupos-aprobados":
                const topGrupo = reportData.length > 0 ? reportData[0].nombre_grupo : "-";
                const maxAdmitidosGrupo = reportData.length > 0 ? reportData[0].admitidos : 0;
                return [
                    { label: "Grupos Evaluados", value: count, color: "text-slate-600 bg-slate-50" },
                    { label: "Grupo con Más Admitidos", value: topGrupo, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Admitidos del Grupo", value: maxAdmitidosGrupo, color: "text-amber-600 bg-amber-50" }
                ];
            default:
                return [{ label: "Registros en Consulta", value: count, color: "text-slate-600 bg-slate-50" }];
        }
    }, [reportData, selectedReport]);

    // Client-side text filter
    const dataFiltrada = useMemo(() => {
        if (!busqueda) return reportData;
        const q = busqueda.toLowerCase().trim();
        return reportData.filter(row => {
            return Object.values(row).some(val => {
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(q);
            });
        });
    }, [reportData, busqueda]);

    // Filter report list in sidebar dynamically
    const reportesListFiltrados = useMemo(() => {
        return reportesList.filter(rep => {
            // Category check
            if (activeTab !== "Todos" && rep.category !== activeTab) return false;
            // Search string check
            if (sidebarSearch) {
                const q = sidebarSearch.toLowerCase();
                return rep.label.toLowerCase().includes(q) || rep.desc.toLowerCase().includes(q);
            }
            return true;
        });
    }, [sidebarSearch, activeTab]);

    const tabsList = ["Todos", "Postulantes", "Grupos", "Docentes", "Materias", "Ingresos"];

    return (
        <AuthenticatedLayout
            fluid={true}
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 no-print">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            Tablero Integrado de Reportes
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Análisis estadístico, exportación automatizada y control por comandos de voz.
                        </p>
                    </div>

                    {/* Speech control indicator */}
                    <div className="flex items-center gap-3 bg-white border border-slate-100 p-2.5 rounded-2xl shadow-sm shrink-0">
                        {voiceFeedback && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3.5 py-2 rounded-xl animate-pulse">
                                {voiceFeedback}
                            </span>
                        )}
                        <button
                            onClick={startSpeech}
                            className={`px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                                listening 
                                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md shadow-rose-600/20" 
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                            }`}
                            title="Haz clic para ordenar por voz (ej. 'faltas', 'asistencia perfecta', 'recaudado por carrera')"
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-xs font-mono tracking-wider font-extrabold uppercase">Comando de Voz</span>
                        </button>
                    </div>
                </div>
            }
        >
            {/* Global Media Print Rules to hide all outer wrappers */}
            <style>{`
                @media print {
                    aside, header, nav, .no-print, [role="navigation"], button {
                        display: none !important;
                    }
                    body, .min-h-screen, .bg-gray-100, main, .max-w-7xl, .bg-white.p-6.rounded-lg.shadow-sm.border {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .print-area {
                        display: block !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto !important;
                        font-size: 9.5pt !important;
                        margin-top: 15px !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto !important;
                    }
                    th, td {
                        border: 1px solid #cbd5e1 !important;
                        padding: 6px 8px !important;
                        color: #000000 !important;
                    }
                    th {
                        background-color: #f1f5f9 !important;
                        font-weight: bold !important;
                    }
                }
            `}</style>

            <div className="flex flex-col lg:flex-row gap-6 print-area">
                
                {/* SIDEBAR DE REPORTES */}
                <div className="w-full lg:w-80 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 shrink-0 no-print">
                    
                    {/* Period filter */}
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Periodo Académico</span>
                        <select
                            disabled={selectedReport === "ingresos-gestion" || selectedReport === "postulantes-concurrentes"}
                            className="w-full rounded-xl border-slate-200 text-xs focus:border-indigo-500 focus:ring-indigo-500 font-extrabold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
                            value={selectedGestion}
                            onChange={(e) => setSelectedGestion(e.target.value)}
                        >
                            {gestiones.map(g => (
                                <option key={g} value={g}>
                                    Gestión: {g.substring(4) === '01' ? '1' : '2'}-{g.substring(0, 4)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Mobile report selector */}
                    <div className="space-y-1 block lg:hidden">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Seleccionar Reporte</span>
                        <select
                            className="w-full rounded-xl border-slate-200 text-xs focus:border-indigo-500 focus:ring-indigo-500 font-extrabold text-slate-800"
                            value={selectedReport}
                            onChange={(e) => {
                                setSelectedReport(e.target.value);
                                setBusqueda("");
                            }}
                        >
                            {reportesList.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t border-slate-100 hidden lg:block"></div>

                    {/* Search bar inside sidebar */}
                    <div className="relative hidden lg:block">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar reporte..."
                            className="rounded-xl border-slate-200 text-xs focus:border-indigo-500 focus:ring-indigo-500 w-full pl-8 py-1.5"
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                        />
                    </div>

                    {/* Category tabs */}
                    <div className="hidden lg:flex flex-wrap gap-1">
                        {tabsList.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition ${
                                    activeTab === tab 
                                        ? "bg-indigo-600 text-white shadow-sm" 
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Sidebar reports list scrollable */}
                    <div className="space-y-1 max-h-[45vh] overflow-y-auto pr-1 hidden lg:block">
                        {reportesListFiltrados.length === 0 ? (
                            <p className="text-xs text-slate-400 italic p-3 text-center">Sin resultados.</p>
                        ) : (
                            reportesListFiltrados.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedReport(r.id);
                                        setBusqueda("");
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-start gap-2.5 select-none ${
                                        selectedReport === r.id
                                            ? "bg-slate-900 text-white shadow"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <span className="block truncate leading-snug">{r.label}</span>
                                        <span className={`block text-[9px] mt-0.5 truncate leading-tight ${selectedReport === r.id ? "text-slate-300" : "text-slate-400"}`}>
                                            {r.desc}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Command guidelines card */}
                    <div className="bg-indigo-900 text-indigo-100 rounded-2xl p-4 space-y-2.5 shadow-sm text-xs font-medium hidden lg:block">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="font-bold uppercase tracking-wider text-[10px]">Guía de Voz</span>
                        </div>
                        <p className="text-[10px] text-indigo-200 leading-normal">
                            Haz clic en <strong>Comando de voz</strong> e indica frases como:
                        </p>
                        <ul className="space-y-1 text-[9px] font-mono text-indigo-300 list-disc list-inside">
                            <li>"Docentes con más faltas"</li>
                            <li>"Asistencia perfecta de la gestión 1-2025"</li>
                            <li>"Ingresos por gestión"</li>
                            <li>"Ingresos por carrera"</li>
                            <li>"Postulantes aprobados"</li>
                            <li>"Materia con más reprobados de 2026-2"</li>
                            <li>"Postulantes concurrentes"</li>
                        </ul>
                    </div>

                </div>

                {/* DETALLE Y TABLA */}
                <div className="flex-1 space-y-6">
                    
                    {/* ACCIONES Y BUSCADOR LOCAL */}
                    <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Filtrar datos de la tabla..."
                                className="rounded-2xl border-slate-200 text-xs focus:border-indigo-500 focus:ring-indigo-500 w-full pl-9"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>

                        {/* Export links (No emojis in text) */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                onClick={handleExportExcel}
                                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                title="Descargar como planilla Excel (.xlsx)"
                            >
                                Descargar Excel
                            </button>
                            <button
                                onClick={handleExportWord}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 text-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                title="Descargar como documento Word (.doc Landscape)"
                            >
                                Descargar Word
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                title="Imprimir reporte / Guardar PDF"
                            >
                                Imprimir PDF
                            </button>
                        </div>
                    </div>

                    {/* DYNAMIC METRIC CARDS */}
                    {metricasResumen.length > 0 && !loading && !errorMsg && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                            {metricasResumen.map((m, i) => (
                                <div key={i} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{m.label}</span>
                                        <h4 className="text-xl font-black text-slate-800 mt-1">{m.value}</h4>
                                    </div>
                                    <div className={`p-2.5 rounded-xl font-bold text-lg ${m.color || "bg-slate-50 text-slate-600"}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TABLA PRINCIPAL DE DATOS */}
                    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[50vh] print:border-none print:shadow-none">
                        
                        {/* Title block */}
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-none print:bg-white print:p-0">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">
                                    {reportesList.find(r => r.id === selectedReport)?.label}
                                </h3>
                                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest font-mono">
                                    {selectedReport === "ingresos-gestion" || selectedReport === "postulantes-concurrentes" 
                                        ? "Historial Consolidado del Sistema" 
                                        : `Gestión Académica Seleccionada: ${selectedGestion.substring(4) === '01' ? '1' : '2'}-${selectedGestion.substring(0, 4)}`}
                                </p>
                            </div>
                            <div className="text-right shrink-0 print:text-left print:mt-1">
                                <span className="text-[9px] text-slate-400 font-black font-mono block uppercase">
                                    {dataFiltrada.length} Registros Encontrados
                                </span>
                                <span className="text-[8px] text-slate-400 font-bold font-mono block mt-0.5 print:block hidden">
                                    Fecha de Generación: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* View Table Area */}
                        <div className="overflow-x-auto flex-1">
                            {loading ? (
                                <div className="p-12 space-y-4">
                                    <div className="h-6 bg-slate-100 rounded-xl w-1/4 animate-pulse"></div>
                                    <div className="space-y-2.5">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <div key={n} className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                                        ))}
                                    </div>
                                </div>
                            ) : errorMsg ? (
                                <div className="p-16 text-center flex flex-col items-center justify-center text-rose-600">
                                    <svg className="w-10 h-10 text-rose-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <h4 className="font-black text-sm">{errorMsg}</h4>
                                    <button onClick={cargarDatos} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow">Reintentar Cargar</button>
                                </div>
                            ) : dataFiltrada.length === 0 ? (
                                <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400">
                                    <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5M5 19v-2a2 2 0 002-2h2a2 2 0 002 2v2M9 5h4" />
                                    </svg>
                                    <h4 className="font-extrabold text-slate-800 text-sm">Sin registros para mostrar</h4>
                                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                                        {busqueda ? "Ningún registro local coincide con la búsqueda." : "No se encontraron datos en el sistema para esta gestión académica."}
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-slate-700 text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider print:bg-slate-100 print:text-black">
                                            {Object.keys(dataFiltrada[0]).map((key) => {
                                                if (str_starts_with(key, 'id_') && key !== 'id_grupo') {
                                                    return null;
                                                }
                                                return (
                                                    <th key={key} className="px-5 py-4 font-black">
                                                        {headerMapping[key] || key.replace(/_/g, ' ').toUpperCase()}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                                        {dataFiltrada.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition duration-150 print:hover:bg-white">
                                                {Object.keys(row).map((key) => {
                                                    if (str_starts_with(key, 'id_') && key !== 'id_grupo') {
                                                        return null;
                                                    }
                                                    const value = row[key];
                                                    
                                                    // State badges
                                                    if (key === 'aprobado' || key === 'tiene_asistencia') {
                                                        const isOk = !!value;
                                                        return (
                                                            <td key={key} className="px-5 py-3.5 print:py-2">
                                                                <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                                                                    isOk ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                                                                }`}>
                                                                    {isOk ? 'SÍ' : 'NO'}
                                                                </span>
                                                            </td>
                                                        );
                                                    }

                                                    if (key === 'estado_pago' || key === 'resultado_final') {
                                                        const isOk = value === 'APROBADO' || value === 'ADMITIDO' || value === 'LIQUIDADO';
                                                        return (
                                                            <td key={key} className="px-5 py-3.5 print:py-2">
                                                                <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                                                                    isOk ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                                                                }`}>
                                                                    {value}
                                                                </span>
                                                            </td>
                                                        );
                                                    }

                                                    const isNumeric = typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)) && (key.includes('monto') || key.includes('promedio') || key.includes('tasa') || key.includes('porcentaje')));

                                                    return (
                                                        <td key={key} className={`px-5 py-3.5 print:py-2 ${isNumeric ? 'font-mono text-slate-800' : 'text-slate-600'}`}>
                                                            {value === null || value === undefined ? '-' : String(value)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer card */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 font-black uppercase tracking-wider font-mono text-center no-print">
                            CUP Admisión • Generado con Reportes Integrados en Base de Datos
                        </div>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}

// Helpers
function str_starts_with(str, prefix) {
    return str.indexOf(prefix) === 0;
}

function intVal(val) {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
}

function floatVal(val) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0.0 : parsed;
}

function round(val) {
    return Math.round(val);
}

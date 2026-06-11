import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

export default function GestionarGrupos() {
    const [selectedYear, setSelectedYear] = useState('2026');
    const [selectedPeriod, setSelectedPeriod] = useState('1');
    const gestion = `${selectedYear}0${selectedPeriod}`;
    const [grupos, setGrupos] = useState([]);
    const [estadisticas, setEstadisticas] = useState({ grupos: 0, estudiantes: 0, capacidad: 0 });
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/grupos/data', {
                params: { gestion }
            });
            setGrupos(res.data.grupos || []);
            setEstadisticas(res.data.estadisticas || { grupos: 0, estudiantes: 0, capacidad: 0 });
        } catch (error) {
            console.error('Error al cargar datos de grupos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [gestion]);

    const handleGenerarGrupos = async () => {
        setGenerating(true);
        try {
            await axios.post('/admin/grupos/generar', { gestion });
            await cargarDatos();
        } catch (error) {
            console.error('Error al generar grupos:', error);
            const msg = error.response?.data?.message || 'Ocurrió un error al generar los grupos. Por favor intente de nuevo.';
            alert(msg);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Gestión de Grupos
                    </h2>
                </div>
            }
        >
            <Head title="Gestión de Grupos" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                {/* PANEL DE CONTROL UNIFICADO */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Planificación del Periodo
                        </h3>
                        <p className="text-sm text-slate-500">
                            Filtra por gestión académica o genera la asignación de grupos de forma automatizada.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Selector de Gestión */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-inner">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-transparent border-0 ring-0 focus:ring-0 text-sm font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer"
                            >
                                {Array.from({ length: 11 }, (_, i) => 2025 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="w-px h-6 bg-slate-200" />
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="bg-transparent border-0 ring-0 focus:ring-0 text-sm font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer"
                            >
                                <option value="1">Gestión 1 (Ene-Jun)</option>
                                <option value="2">Gestión 2 (Jul-Dic)</option>
                            </select>
                        </div>

                        {/* Botón Generar Grupos */}
                        <button
                            disabled={generating || loading}
                            onClick={handleGenerarGrupos}
                            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 select-none ${
                                generating
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                            }`}
                        >
                            {generating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    GENERANDO GRUPOS...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    GENERAR GRUPOS
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* TARJETAS DE ESTADÍSTICAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tarjeta Grupos */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Grupos</p>
                            <p className="text-3xl font-black text-slate-800">{loading ? '...' : (estadisticas.grupos || 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>

                    {/* Tarjeta Estudiantes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estudiantes Asignados</p>
                            <p className="text-3xl font-black text-slate-800">{loading ? '...' : (estadisticas.estudiantes || 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                            </svg>
                        </div>
                    </div>

                    {/* Tarjeta Capacidad */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow duration-300">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Capacidad Maxima</p>
                            <p className="text-3xl font-black text-slate-800">{loading ? '...' : (estadisticas.capacidad || 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN PRINCIPAL: LISTADO O EMPTY STATE */}
                <div>
                    {loading ? (
                        // SKELETON LOADER
                        <div className="grid md:grid-cols-2 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="h-6 bg-slate-200 rounded w-1/3" />
                                        <div className="h-5 bg-slate-200 rounded-full w-20" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2.5 bg-slate-200 rounded w-full" />
                                        <div className="flex justify-between text-xs">
                                            <div className="h-3.5 bg-slate-200 rounded w-16" />
                                            <div className="h-3.5 bg-slate-200 rounded w-12" />
                                        </div>
                                    </div>
                                    <div className="pt-3 flex justify-between items-center">
                                        <div className="h-4 bg-slate-200 rounded w-24" />
                                        <div className="h-4 bg-slate-200 rounded w-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : grupos.length === 0 ? (
                        // ESTADO VACÍO (EMPTY STATE)
                        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto my-6 space-y-6 shadow-sm">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-slate-800">No hay grupos creados</h4>
                                <p className="text-sm text-slate-500 max-w-md mx-auto">
                                    No existen grupos registrados para la gestión <strong>{selectedYear}-0{selectedPeriod}</strong>. Puedes generarlos automáticamente con los estudiantes preinscritos.
                                </p>
                            </div>
                            <button
                                disabled={generating}
                                onClick={handleGenerarGrupos}
                                className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200 select-none ${
                                    generating
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 cursor-pointer'
                                }`}
                            >
                                {generating ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Generando grupos...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Generar Grupos Ahora
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        // LISTA DE TARJETAS DE GRUPOS
                        <div className="grid md:grid-cols-2 gap-6">
                            {grupos.map((g) => {
                                const occupancyRate = Math.min(Math.round((g.cantidad_estudiantes / 70) * 100), 100);
                                let progressColor = 'bg-emerald-500';
                                if (occupancyRate >= 95) progressColor = 'bg-amber-500';
                                else if (occupancyRate >= 75) progressColor = 'bg-blue-600';
                                else if (occupancyRate === 0) progressColor = 'bg-slate-200';

                                return (
                                    <div
                                        key={g.id_grupo}
                                        onClick={() => {
                                            router.visit(route('admin.grupos.detalle', g.id_grupo));
                                        }}
                                        className="group bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h4 className="font-extrabold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                                                    {g.nombre}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-medium">Asignación Directa · ID #{g.id_grupo}</p>
                                            </div>

                                            {g.turno === 'Mañana' ? (
                                                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                                    </svg>
                                                    Mañana
                                                </span>
                                            ) : g.turno === 'Tarde' ? (
                                                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                    </svg>
                                                    Tarde
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                    {g.turno}
                                                </span>
                                            )}
                                        </div>

                                        {/* Barra de progreso de capacidad */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-semibold text-slate-500">
                                                <span>Ocupación de alumnos</span>
                                                <span className="text-slate-800">{g.cantidad_estudiantes} / 70 ({occupancyRate}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                    style={{ width: `${occupancyRate}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Detalle inferior */}
                                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <span className="font-medium">Docentes asignados, horarios e inscritos</span>
                                            <svg className="w-4.5 h-4.5 transform group-hover:translate-x-1.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
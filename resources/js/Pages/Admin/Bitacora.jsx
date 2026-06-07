import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

const MODULOS = [
    "AUTENTICACIÓN", "POSTULANTES", "PAGOS", "EXAMENES", 
    "DOCENTES", "REPORTES"
];

export default function Bitacora() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ modulo: '', accion: '', fecha: '', busqueda: '' });
    
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, ...filters };
            const response = await axios.get('/admin/bitacora/data', { params });
            setLogs(response.data.data || response.data);
            setMeta(response.data);
        } catch (error) {
            console.error("Error cargando la bitácora:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const clearFilters = () => {
        setFilters({ modulo: '', accion: '', fecha: '', busqueda: '' });
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return { fecha: '-', hora: '-' };
        const date = new Date(timestamp);
        return {
            fecha: date.toLocaleDateString('es-BO'),
            hora: date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-black text-blue-900 tracking-wide uppercase">Auditoría del Sistema</h2>}>
            <Head title="Bitácora" />

            <div className="py-8 max-w-[90rem] mx-auto sm:px-6 lg:px-8 space-y-6">
                
                {/* ==========================================
                    BARRA DE FILTROS 
                ========================================== */}
                <div className="bg-white p-5 shadow-sm rounded border border-gray-200 flex flex-wrap gap-4 items-end justify-between animate-fade-in-up">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end w-full">
                        <div>
                            <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wide">Módulo</label>
                            <select className="mt-1 block w-40 rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700" value={filters.modulo} onChange={e => setFilters({...filters, modulo: e.target.value})}>
                                <option value="">Todos</option>
                                {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wide">Fecha</label>
                            <input type="date" className="mt-1 block w-40 rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700" value={filters.fecha} onChange={e => setFilters({...filters, fecha: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wide">Buscar Detalles / Acción</label>
                            <input type="text" className="mt-1 block w-64 rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700" value={filters.busqueda} onChange={e => setFilters({...filters, busqueda: e.target.value})} placeholder="Ej. Eliminación, C.I., Error..." />
                        </div>
                        <div className="flex gap-2 ml-auto">
                            <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded text-sm font-bold hover:bg-slate-800 transition shadow">
                                Filtrar
                            </button>
                            <button type="button" onClick={clearFilters} className="bg-white text-gray-600 border border-gray-300 px-6 py-2.5 rounded text-sm font-bold hover:bg-gray-50 transition">
                                Resetear Filtros
                            </button>
                        </div>
                    </form>
                </div>

                {/* ==========================================
                    TABLA DE REGISTROS
                ========================================== */}
                <div className="bg-white shadow-sm rounded border border-gray-200 overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700">
                            <thead className="bg-white text-[11px] text-blue-900 uppercase font-black border-b-2 border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Fecha | Hora | ID_REGISTRO</th>
                                    <th className="px-6 py-4">Usuario y Sesión</th>
                                    <th className="px-6 py-4">Módulo | Acción</th>
                                    <th className="px-6 py-4 w-1/3">Descripción del Evento</th>
                                    <th className="px-6 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-10 font-bold text-gray-400">Cargando registros...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 font-bold text-gray-400">No se encontraron registros.</td></tr>
                                ) : (
                                    logs.map((log) => {
                                        const timestamp = formatTimestamp(log.fecha_registro);
                                        const isErrorOrDelete = log.accion?.toUpperCase().includes('ELIMIN') || log.accion?.toUpperCase().includes('ERROR');
                                        
                                        return (
                                            <tr key={log.id_bitacora} className="hover:bg-slate-50 transition">
                                                
                                                {/* FECHA Y HORA */}
                                                <td className="px-6 py-4 align-top w-36">
                                                    <div className="font-bold text-slate-800">{timestamp.fecha}</div>
                                                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{timestamp.hora}</div>
                                                    <div className="text-[9px] text-gray-400 mt-1 uppercase" title="ID Interno de la Bitácora">ID: {log.id_bitacora}</div>
                                                </td>

                                                {/* ACTOR, IP Y SESIÓN */}
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black uppercase ${log.usuario_nombre ? 'text-slate-800' : 'text-slate-500 italic'}`}>
                                                            {log.usuario_nombre || 'SISTEMA'}
                                                        </span>
                                                        {!log.usuario_nombre && (
                                                            <span className="bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded tracking-wide">AUTO</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5 mb-2">
                                                        ID USUARIO: {log.id_usuario || 'N/A'}
                                                    </div>
                                                    
                                                    {/* Tarjeta de Sesión */}
                                                    <div className="bg-gray-50 rounded border border-gray-200 p-2 mt-1">
                                                        {log.ip_direccion ? (
                                                            <>
                                                                <div className="text-[10px] text-blue-700 font-black flex items-center gap-1">
                                                                    IP: {log.ip_direccion}
                                                                </div>
                                                                <div className="text-[9px] text-gray-500 mt-1 uppercase font-semibold">
                                                                    Sesión: {log.fecha_inicio ? formatTimestamp(log.fecha_inicio).hora : 'Desconocida'}
                                                                    {log.fecha_fin ? ` - ${formatTimestamp(log.fecha_fin).hora}` : ' (Activa)'}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                                                SESIÓN: SIN REGISTRO
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* MÓDULO Y ACCIÓN */}
                                                <td className="px-6 py-4 align-top w-48">
                                                    <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-1 rounded inline-block border border-blue-100 uppercase tracking-wider mb-1 shadow-sm">
                                                        {log.modulo}
                                                    </span>
                                                    <div className={`text-[11px] font-black mt-1.5 uppercase ${isErrorOrDelete ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {log.accion}
                                                    </div>
                                                </td>

                                                {/* DESCRIPCIÓN */}
                                                <td className="px-6 py-4 align-top">
                                                    <p className="text-[12px] text-slate-700 leading-relaxed font-medium">
                                                        {log.descripcion || '-'}
                                                    </p>
                                                </td>

                                                {/* METADATA (ACCIONES) */}
                                                <td className="px-6 py-4 text-center align-middle">
                                                    {log.metadata ? (
                                                        <button 
                                                            onClick={() => setSelectedLog(log)}
                                                            className="w-full text-center bg-white hover:bg-gray-50 text-slate-800 font-black text-[10px] py-2 px-3 rounded border border-gray-300 transition uppercase tracking-wide shadow-sm"
                                                        >
                                                            Ver Detalles
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase italic">Sin Detalles</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* PAGINACIÓN */}
                    {!loading && meta.last_page > 1 && (
                        <div className="bg-white px-6 py-4 flex justify-between items-center border-t border-gray-200">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Página {meta.current_page} de {meta.last_page}</span>
                            <div className="space-x-2">
                                <button disabled={meta.current_page === 1} onClick={() => fetchLogs(meta.current_page - 1)} className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold disabled:opacity-50 hover:bg-gray-50 text-slate-700 shadow-sm transition">Anterior</button>
                                <button disabled={meta.current_page === meta.last_page} onClick={() => fetchLogs(meta.current_page + 1)} className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold disabled:opacity-50 hover:bg-gray-50 text-slate-700 shadow-sm transition">Siguiente</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ==========================================
                    VISOR DE METADATA (MODAL)
                ========================================== */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
                            
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                                <div>
                                    <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide">
                                        Detalles Técnicos del Evento:
                                    </h3>
                                    <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase">
                                        ID REGISTRO: {selectedLog.id_bitacora} | {formatTimestamp(selectedLog.fecha_registro).fecha}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-red-600 text-xl font-bold leading-none transition">&times;</button>
                            </div>

                            <div className="p-6 overflow-y-auto bg-slate-900 shadow-inner">
                                <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
                                    {typeof selectedLog.metadata === 'string' 
                                        ? (() => {
                                            try { return JSON.stringify(JSON.parse(selectedLog.metadata), null, 4); } 
                                            catch { return selectedLog.metadata; }
                                          })()
                                        : JSON.stringify(selectedLog.metadata, null, 4)
                                    }
                                </pre>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                                <button onClick={() => setSelectedLog(null)} className="px-6 py-2.5 bg-blue-700 text-white rounded text-xs font-bold shadow hover:bg-blue-800 transition">
                                    Cerrar Visor
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
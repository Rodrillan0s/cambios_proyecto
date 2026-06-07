import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';

export default function Dashboard() {
    // --- ESTADOS PARA EL IMPORTADOR ---
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
            setError('Debes seleccionar un archivo .csv o .xlsx primero.');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', file);

        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await axios.post('/admin/importar-postulantes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setReport(response.data.data || response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-slate-800">Panel de Administración</h2>}>
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8">

                    {/* --- MENÚ PRINCIPAL (TARJETAS) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Tarjeta 1: Acceso al CRUD */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition">
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4">
                                    👥
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Gestionar Postulantes</h3>
                                <p className="text-sm text-gray-500 mb-6">Busca, edita, elimina o registra manualmente postulantes en el sistema.</p>
                                {/* Asegúrate de que esta ruta exista en web.php o usa la URL directa '/admin/postulantes' */}
                                <Link
                                    href="/admin/postulantes"
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition"
                                >
                                    Ingresar al Módulo
                                </Link>
                            </div>
                        </div>

                        {/* Tarjeta 2: Acceso al Importador */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition">
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">
                                    📊
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Importación Masiva</h3>
                                <p className="text-sm text-gray-500 mb-6">Sube registros de pagos por ventanilla utilizando archivos Excel (.xlsx) o CSV.</p>
                                <button
                                    onClick={() => setShowImporter(!showImporter)}
                                    className={`w-full font-bold py-3 px-4 rounded-lg transition ${showImporter ? 'bg-gray-200 text-slate-800 hover:bg-gray-300' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                >
                                    {showImporter ? 'Cerrar Herramienta' : 'Abrir Herramienta'}
                                </button>
                            </div>
                        </div>


                        {/* Tarjeta 3: Acceso a Bitácora */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition">
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mb-4">
                                    📜
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Bitácora</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Consulta los registros de auditoría del sistema por módulo.
                                </p>
                                <Link
                                    href="/admin/bitacora"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
                                >
                                    Ingresar al Módulo
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* --- HERRAMIENTA DE IMPORTACIÓN (Se despliega al hacer clic) --- */}
                    {showImporter && (
                        <div className="bg-white shadow-lg sm:rounded-xl border border-emerald-200 overflow-hidden transform transition-all">
                            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-emerald-900">Subir archivo Excel/CSV</h3>
                                <button onClick={() => setShowImporter(false)} className="text-emerald-400 hover:text-emerald-700 font-bold">&times; Cerrar</button>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleUpload} className="space-y-4 max-w-2xl mx-auto">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
                                        <input
                                            type="file"
                                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer mx-auto"
                                        />
                                        <p className="text-xs text-gray-400 mt-3">Las cabeceras deben coincidir exactamente con el formato definido.</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-100 text-red-700 rounded text-sm font-semibold border border-red-200">
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <button
                                            type="submit"
                                            disabled={loading || !file}
                                            className="bg-slate-800 text-white px-8 py-3 rounded-lg text-sm font-bold shadow-lg hover:bg-slate-700 disabled:opacity-50 transition"
                                        >
                                            {loading ? 'Procesando archivo...' : 'Ejecutar Importación Masiva'}
                                        </button>
                                    </div>
                                </form>

                                {/* Reporte de Resultados */}
                                {report && (
                                    <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl max-w-2xl mx-auto">
                                        <h4 className="font-bold text-slate-800 mb-4 text-lg">📊 Reporte de Ejecución</h4>
                                        <div className="flex gap-4 mb-4">
                                            <div className="bg-emerald-100 text-emerald-800 p-4 rounded-xl flex-1 text-center shadow-inner">
                                                <span className="block text-3xl font-black">{report.registrados || 0}</span>
                                                <span className="text-xs uppercase font-bold tracking-wider">Registrados</span>
                                            </div>
                                            <div className="bg-amber-100 text-amber-800 p-4 rounded-xl flex-1 text-center shadow-inner">
                                                <span className="block text-3xl font-black">{report.duplicados || 0}</span>
                                                <span className="text-xs uppercase font-bold tracking-wider">Omitidos</span>
                                            </div>
                                        </div>

                                        {report.errores && report.errores.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-bold text-red-600 mb-2">Logs de omisión/errores:</p>
                                                <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1 h-32 overflow-y-auto bg-white p-3 border border-slate-200 rounded-lg shadow-inner">
                                                    {report.errores.map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Dashboard() {
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
            
            setReport(response.data.data);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || 
                'Explotó el servidor (Revisa tu terminal o laravel.log).'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">🧪 Laboratorio: Importación Masiva (PruebaX)</h2>}
        >
            <Head title="Laboratorio CSV/XLSX" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border border-slate-200">
                        <div className="p-6 text-gray-900">
                            
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Subir archivo CSV/XLSX</h3>
                            
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <input 
                                        type="file" 
                                        accept=".csv,.xlsx"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">El archivo debe tener las columnas exactas definidas en el controlador.</p>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm font-semibold">
                                        ⚠️ {error}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={loading || !file}
                                    className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-700 disabled:opacity-50 transition"
                                >
                                    {loading ? 'Procesando miles de datos...' : 'Ejecutar Importación'}
                                </button>
                            </form>

                            {report && (
                                <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                    <h4 className="font-bold text-slate-800 mb-3 text-lg">📊 Reporte de Ejecución</h4>
                                    
                                    <div className="flex gap-4 mb-4">
                                        <div className="bg-emerald-100 text-emerald-800 p-3 rounded-lg flex-1 text-center">
                                            <span className="block text-2xl font-black">{report.registrados}</span>
                                            <span className="text-xs uppercase font-bold tracking-wider">Registrados</span>
                                        </div>
                                        <div className="bg-amber-100 text-amber-800 p-3 rounded-lg flex-1 text-center">
                                            <span className="block text-2xl font-black">{report.duplicados}</span>
                                            <span className="text-xs uppercase font-bold tracking-wider">Duplicados Omitidos</span>
                                        </div>
                                    </div>

                                    {report.errores && report.errores.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-bold text-red-600 mb-2">Logs de omisión/errores:</p>
                                            <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1 h-32 overflow-y-auto bg-white p-2 border border-slate-200 rounded">
                                                {report.errores.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {report.debug_headers && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                            <p className="font-bold mb-1">🔍 Diagnóstico de Cabeceras leídas por PHP:</p>
                                            <code>[{report.debug_headers.join(', ')}]</code>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

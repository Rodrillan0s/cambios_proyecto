import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

export default function GestionarGrupos() {

    const [gestion, setGestion] = useState('202601');
    const [grupos, setGrupos] = useState([]);
    const [estadisticas, setEstadisticas] = useState({});
    const [loading, setLoading] = useState(true);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/grupos/data', {
                params: { gestion }
            });

            setGrupos(res.data.grupos || []);
            setEstadisticas(res.data.estadisticas || {});
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [gestion]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-black text-blue-900 uppercase">
                    Gestión de Grupos
                </h2>
            }
        >
            <Head title="Grupos" />

            <div className="py-6 max-w-6xl mx-auto space-y-6">

                {/* FILTRO */}
                <div className="bg-white p-4 rounded border flex gap-4 items-center">
                    <label className="font-bold text-sm">Gestión:</label>

                    <select
                        value={gestion}
                        onChange={(e) => setGestion(e.target.value)}
                        className="border rounded px-3 py-1 text-sm"
                    >
                        <option value="202601">202601</option>
                        <option value="202602">202602</option>
                    </select>
                </div>

                {/* BOTÓN GENERAR */}
                <div className="bg-white p-4 rounded border flex flex-wrap items-center justify-between gap-4">

                    <div>
                        <h3 className="font-black text-slate-800">
                            Gestión de Grupos
                        </h3>

                        <p className="text-xs text-gray-500">
                            Genera automáticamente los grupos para la gestión seleccionada
                        </p>
                    </div>

                    <button
                        onClick={async () => {
                            try {
                                await axios.post('/admin/grupos/generar', {
                                    gestion
                                });

                                await cargarDatos();
                            } catch (error) {
                                console.error(error);
                            }
                        }}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded text-sm font-bold hover:bg-slate-800 transition"
                    >
                        GENERAR GRUPOS
                    </button>

                </div>

                {/* ESTADÍSTICAS */}
                <div className="grid grid-cols-3 gap-4">

                    <div className="bg-white p-4 rounded border">
                        <p className="text-xs text-gray-500">Grupos</p>
                        <p className="text-2xl font-black">{estadisticas.grupos}</p>
                    </div>

                    <div className="bg-white p-4 rounded border">
                        <p className="text-xs text-gray-500">Estudiantes</p>
                        <p className="text-2xl font-black">{estadisticas.estudiantes}</p>
                    </div>

                    <div className="bg-white p-4 rounded border">
                        <p className="text-xs text-gray-500">Capacidad</p>
                        <p className="text-2xl font-black">{estadisticas.capacidad}</p>
                    </div>

                </div>

                {/* LISTA DE GRUPOS */}
                <div className="grid md:grid-cols-2 gap-4">

                    {loading ? (
                        <p className="text-gray-500">Cargando...</p>
                    ) : (
                        grupos.map((g) => (
                            <div
                                key={g.id_grupo}
                                onClick={() => {
                                    router.visit(route('admin.grupos.detalle', g.id_grupo));
                                }}
                                className="bg-white p-5 rounded border hover:shadow-md hover:border-slate-400 transition cursor-pointer"
                            >

                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-slate-800">
                                        {g.nombre}
                                    </h3>

                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {g.cantidad_estudiantes} alumnos
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500 mt-2">
                                    Click para ver docentes, estudiantes y detalles del grupo
                                </p>

                            </div>
                        ))
                    )}

                </div>

            </div>

        </AuthenticatedLayout>
    );
}
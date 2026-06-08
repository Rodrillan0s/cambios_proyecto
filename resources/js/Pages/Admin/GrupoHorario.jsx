import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { Head } from "@inertiajs/react";

export default function GrupoHorarios({ id }) {

    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargar();
    }, []);

    const cargar = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/admin/grupos/${id}/horarios`);
            setHorarios(res.data);
        } finally {
            setLoading(false);
        }
    };

    // días ordenados
    const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

    // agrupar por día
    const porDia = (dia) =>
        horarios.filter(h => h.dia_semana === dia);

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="p-6 text-gray-500">
                    Cargando horarios...
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-black text-slate-800 uppercase">
                    Horario del Grupo {id}
                </h2>
            }
        >

            <Head title="Horarios" />

            <div className="p-6 max-w-7xl mx-auto">

                {/* GRID SEMANAL */}
                <div className="grid md:grid-cols-5 gap-4">

                    {dias.map((dia) => (
                        <div key={dia} className="bg-white border rounded-xl p-4 shadow-sm">

                            <h3 className="font-bold text-slate-800 capitalize mb-3">
                                {dia}
                            </h3>

                            {porDia(dia).length === 0 ? (
                                <p className="text-xs text-gray-400">
                                    Sin clases
                                </p>
                            ) : (
                                porDia(dia).map((h, i) => (
                                    <div
                                        key={i}
                                        className="mb-3 p-3 rounded-lg bg-slate-50 border"
                                    >
                                        <p className="font-semibold text-sm text-slate-800">
                                            {h.materia}
                                        </p>

                                        <p className="text-xs text-gray-600 mt-1">
                                             {h.hora_inicio} - {h.hora_fin}
                                        </p>
                                    </div>
                                ))
                            )}

                        </div>
                    ))}

                </div>

            </div>

        </AuthenticatedLayout>
    );
}
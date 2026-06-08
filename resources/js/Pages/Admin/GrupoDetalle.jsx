import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

export default function GrupoDetalle({
    grupo,
    estudiantes = [],
    docentes = [],
    estudiantes_count,
    docentes_count
}) {

    const [search, setSearch] = useState("");

    const estudiantesFiltrados = useMemo(() => {
        return estudiantes.filter((e) =>
            `${e.nombre} ${e.apellidos} ${e.ci}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [search, estudiantes]);

    const exportarExcel = () => {
        const ws = XLSX.utils.json_to_sheet(estudiantes);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
        XLSX.writeFile(wb, `grupo_${grupo?.id_grupo}_estudiantes.xlsx`);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 uppercase">
                        Detalle de Grupo
                    </h2>

                    <span className="text-xs bg-slate-900 text-white px-3 py-1 rounded-full">
                        {grupo?.nombre_grupo}
                    </span>
                </div>
            }
        >
            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* 🧠 RESUMEN */}
                <div className="grid md:grid-cols-3 gap-4">

                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <p className="text-xs text-gray-500">Gestión</p>
                        <p className="text-xl font-bold text-slate-800">
                            {grupo?.gestion}
                        </p>
                    </div>

                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <p className="text-xs text-gray-500">Estudiantes</p>
                        <p className="text-xl font-bold text-blue-600">
                            {estudiantes_count}
                        </p>
                    </div>

                    <div className="bg-white border rounded-xl p-5 shadow-sm">
                        <p className="text-xs text-gray-500">Docentes</p>
                        <p className="text-xl font-bold text-green-600">
                            {docentes_count}
                        </p>
                    </div>

                </div>
                

<div className="bg-white border shadow rounded-xl p-6">

    <h2 className="text-lg font-bold text-slate-800 mb-4">
        Docentes asignados
    </h2>

    {docentes.length === 0 ? (
        <p className="text-sm text-gray-500">
            No hay docentes asignados a este grupo
        </p>
    ) : (
        <div className="grid md:grid-cols-2 gap-4">

            {docentes.map((d, i) => (
                <div
                    key={i}
                    className="border rounded-xl p-5 hover:shadow-md transition bg-slate-50"
                >

                    {/* NOMBRE */}
                    <p className="text-base font-bold text-slate-800">
                        {d.nombre_completo}
                    </p>

                    {/* MATERIA */}
                    <p className="text-sm text-blue-600 font-medium mt-1">
                        📘 {d.materia || "Sin materia asignada"}
                    </p>

                    {/* INFO EXTRA */}
                    <div className="mt-3 space-y-1 text-sm text-gray-600">

                        <p>📞 {d.telefono || "-"}</p>
                        <p>📧 {d.correo || "-"}</p>

                    </div>

                </div>
            ))}

        </div>
    )}
</div>
                {/* 👨‍🎓 ESTUDIANTES */}
                <div className="bg-white border rounded-xl shadow-sm p-6">

                    {/* TOOLBAR */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

                        <h3 className="text-lg font-bold text-slate-800">
                            Estudiantes
                        </h3>

                        <div className="flex gap-2">

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar estudiante..."
                                className="border rounded-lg px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />

                            <button
                                onClick={exportarExcel}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition"
                            >
                                Exportar
                            </button>

                        </div>
                    </div>

                    {/* TABLA */}
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">

                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="p-3 text-left">CI</th>
                                    <th className="p-3 text-left">Nombre</th>
                                    <th className="p-3 text-left">Apellidos</th>
                                    <th className="p-3 text-left">Correo</th>
                                </tr>
                            </thead>

                            <tbody>
                                {estudiantesFiltrados.map((e, i) => (
                                    <tr
                                        key={i}
                                        className="border-t hover:bg-slate-50 transition"
                                    >
                                        <td className="p-3">{e.ci}</td>
                                        <td className="p-3 font-medium">{e.nombre}</td>
                                        <td className="p-3">{e.apellidos}</td>
                                        <td className="p-3 text-gray-500">
                                            {e.correo || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                        Mostrando {estudiantesFiltrados.length} estudiantes
                    </p>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
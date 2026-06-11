import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ControlAsistencia() {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filtros, setFiltros] = useState({
        grupo: "",
        docente: "",
        materia: "",
        estado: "",
        fecha: ""
    });

    const cargar = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                "/admin/asistencias/data"
            );

            setData(res.data || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        cargar();
    }, []);

    const exportarExcel = () => {

    const datos = asistenciasFiltradas.map(f => ({
        Fecha: f.fecha,
        HoraInicio: f.hora_inicio,
        HoraFin: f.hora_fin,
        Docente: f.nombre_docente,
        Materia: f.materia,
        Grupo: f.nombre_grupo,
        Estado: f.estado
    }));

    const ws = XLSX.utils.json_to_sheet(datos);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Asistencias"
    );

    const excelBuffer =
        XLSX.write(
            wb,
            {
                bookType: "xlsx",
                type: "array"
            }

        );

    const file =
        new Blob(
            [excelBuffer],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        );

    saveAs(
        file,
        "asistencias.xlsx"
    );
};

   const exportarPDF = () => {

    const doc = new jsPDF();

    doc.text(
        "Control de Asistencia",
        14,
        15
    );

    autoTable(doc, {
        startY: 25,
        head: [[
            "Fecha",
            "Hora",
            "Docente",
            "Materia",
            "Grupo",
            "Estado"
        ]],
        body: asistenciasFiltradas.map(f => [
            f.fecha,
            `${f.hora_inicio} - ${f.hora_fin}`,
            f.nombre_docente,
            f.materia,
            f.nombre_grupo,
            f.estado
        ])
    });

    doc.save(
        "asistencias.pdf"
    );
};
    const marcarAsistencia = async (fila, valor) => {

        try {

            await axios.post(
                "/admin/asistencias",
                {
                    id_docente: fila.id_docente,
                    id_grupo: fila.id_grupo,
                    id_materia: fila.id_materia,
                    fecha: fila.fecha,
                    tiene_asistencia: valor
                }
            );

            cargar();

        } catch (error) {
            console.error(error);
        }
    };

    const asistenciasFiltradas = useMemo(() => {

        return data.filter(fila => {

            if (
                filtros.grupo &&
                fila.nombre_grupo !== filtros.grupo
            ) return false;

            if (
                filtros.docente &&
                fila.nombre_docente !== filtros.docente
            ) return false;

            if (
                filtros.materia &&
                fila.materia !== filtros.materia
            ) return false;

            if (
                filtros.estado &&
                fila.estado !== filtros.estado
            ) return false;

            if (
                filtros.fecha &&
                fila.fecha !== filtros.fecha
            ) return false;

            return true;
        });

    }, [data, filtros]);

    const grupos = [
        ...new Set(
            data.map(x => x.nombre_grupo)
        )
    ];

    const docentes = [
        ...new Set(
            data.map(x => x.nombre_docente)
        )
    ];

    const materias = [
        ...new Set(
            data.map(x => x.materia)
        )
    ];

    const colorEstado = (estado) => {

        if (estado === "ASISTIO") {
            return "bg-green-100 text-green-700";
        }

        if (estado === "FALTO") {
            return "bg-red-100 text-red-700";
        }

        return "bg-yellow-100 text-yellow-700";
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold">
                    Control de Asistencia
                </h2>
            }
        >

            <div className="p-6 space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="bg-green-100 border rounded p-4">
                        <div className="text-sm">
                            Asistieron
                        </div>

                        <div className="text-2xl font-bold">
                            {
                                asistenciasFiltradas.filter(
                                    x => x.estado === "ASISTIO"
                                ).length
                            }
                        </div>
                    </div>

                    <div className="bg-red-100 border rounded p-4">
                        <div className="text-sm">
                            Faltaron
                        </div>

                        <div className="text-2xl font-bold">
                            {
                                asistenciasFiltradas.filter(
                                    x => x.estado === "FALTO"
                                ).length
                            }
                        </div>
                    </div>

                    <div className="bg-yellow-100 border rounded p-4">
                        <div className="text-sm">
                            Pendientes
                        </div>

                        <div className="text-2xl font-bold">
                            {
                                asistenciasFiltradas.filter(
                                    x => x.estado === "PENDIENTE"
                                ).length
                            }
                        </div>
                    </div>

                </div>

                <div className="bg-white border rounded p-4 flex flex-wrap gap-2">

                    <select
                        className="border rounded p-2"
                        value={filtros.grupo}
                        onChange={(e) =>
                            setFiltros({
                                ...filtros,
                                grupo: e.target.value
                            })
                        }
                    >
                        <option value="">
                            Todos los grupos
                        </option>

                        {grupos.map(g => (
                            <option key={g} value={g}>
                                {g}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded p-2"
                        value={filtros.docente}
                        onChange={(e) =>
                            setFiltros({
                                ...filtros,
                                docente: e.target.value
                            })
                        }
                    >
                        <option value="">
                            Todos los docentes
                        </option>

                        {docentes.map(d => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded p-2"
                        value={filtros.materia}
                        onChange={(e) =>
                            setFiltros({
                                ...filtros,
                                materia: e.target.value
                            })
                        }
                    >
                        <option value="">
                            Todas las materias
                        </option>

                        {materias.map(m => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border rounded p-2"
                        value={filtros.estado}
                        onChange={(e) =>
                            setFiltros({
                                ...filtros,
                                estado: e.target.value
                            })
                        }
                    >
                        <option value="">
                            Todos los estados
                        </option>

                        <option value="ASISTIO">
                            ASISTIÓ
                        </option>

                        <option value="FALTO">
                            FALTÓ
                        </option>

                        <option value="PENDIENTE">
                            PENDIENTE
                        </option>

                    </select>

                    <input
                        type="date"
                        className="border rounded p-2"
                        value={filtros.fecha}
                        onChange={(e) =>
                            setFiltros({
                                ...filtros,
                                fecha: e.target.value
                            })
                        }
                    />

                    <button
                        className="bg-gray-200 px-3 rounded"
                        onClick={() =>
                            setFiltros({
                                grupo: "",
                                docente: "",
                                materia: "",
                                estado: "",
                                fecha: ""
                            })
                        }
                    >
                        Limpiar
                    </button>
                  <button
    onClick={exportarExcel}
    className="bg-green-700 text-white px-4 py-2 rounded"
>
    Exportar Excel
</button>

<button
    onClick={exportarPDF}
    className="bg-red-700 text-white px-4 py-2 rounded"
>
    Exportar PDF
</button>
                </div>

                {loading ? (

                    <div>Cargando...</div>

                ) : (

                    <div className="bg-white rounded border overflow-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-slate-900 text-white">

                                <tr>

                                    <th className="p-2 text-left">
                                        Fecha
                                    </th>

                                    <th className="p-2 text-left">
                                        Hora
                                    </th>

                                    <th className="p-2 text-left">
                                        Docente
                                    </th>

                                    <th className="p-2 text-left">
                                        Materia
                                    </th>

                                    <th className="p-2 text-left">
                                        Grupo
                                    </th>

                                    <th className="p-2 text-center">
                                        Estado
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {asistenciasFiltradas.map((fila, index) => (

                                    <tr
                                        key={index}
                                        className="border-t"
                                    >

                                        <td className="p-2">
                                            {fila.fecha}
                                        </td>

                                        <td className="p-2">
                                            {fila.hora_inicio}
                                            {" - "}
                                            {fila.hora_fin}
                                        </td>

                                        <td className="p-2">
                                            {fila.nombre_docente}
                                        </td>

                                        <td className="p-2">
                                            {fila.materia}
                                        </td>

                                        <td className="p-2">
                                            {fila.nombre_grupo}
                                        </td>

                                        <td className="p-2 text-center">

                                            {fila.estado === "PENDIENTE" ? (

                                                <div className="flex justify-center gap-2">

                                                    <button
                                                        onClick={() =>
                                                            marcarAsistencia(
                                                                fila,
                                                                true
                                                            )
                                                        }
                                                        className="bg-green-600 text-white px-2 py-1 rounded"
                                                    >
                                                        Asistió
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            marcarAsistencia(
                                                                fila,
                                                                false
                                                            )
                                                        }
                                                        className="bg-red-600 text-white px-2 py-1 rounded"
                                                    >
                                                        Faltó
                                                    </button>

                                                </div>

                                            ) : (

                                                <span
                                                    className={`px-2 py-1 rounded font-bold ${colorEstado(fila.estado)}`}
                                                >
                                                    {fila.estado}
                                                </span>

                                            )}

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </AuthenticatedLayout>
    );
}
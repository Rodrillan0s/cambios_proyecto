import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DesempenoFinal() {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generando, setGenerando] = useState(false);

    // filtros
    const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | aprobados | reprobados
    const [filtroGrupo, setFiltroGrupo] = useState("todos");
    const [filtroAdmitidos, setFiltroAdmitidos] = useState("todos");
    const [FiltroGestion, setFiltroGestion] = useState("todos");
   const exportarPDF = () => {
    const doc = new jsPDF();

    doc.text("Desempeño Final", 14, 15);

    autoTable(doc, {
        startY: 25,
        head: [[
            "CI",
            "Postulante",
            "Grupo",
            "Mat",
            "Fis",
            "Comp",
            "Ing",
            "Final",
            "Estado"
        ]],
        body: dataFiltrada.map(d => [
            d.ci,
            d.postulante,
            d.nombre_grupo,
            d.promedio_matematicas,
            d.promedio_fisica,
            d.promedio_computacion,
            d.promedio_ingles,
            d.promedio_final,
            d.aprobado ? "APROBADO" : "REPROBADO",
       
        ])
    });

    doc.save("desempeno_final.pdf");
};


    const exportarExcel = () => {
    const datos = dataFiltrada.map(d => ({
        CI: d.ci,
        Postulante: d.postulante,
        Grupo: d.nombre_grupo,
        Matematicas: d.promedio_matematicas,
        Fisica: d.promedio_fisica,
        Computacion: d.promedio_computacion,
        Ingles: d.promedio_ingles,
        Final: d.promedio_final,
        Estado: d.aprobado ? "APROBADO" : "REPROBADO",
       
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Desempeño");

    const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array"
    });

    const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(file, "desempeno_final.xlsx");
};
    // =========================
    // CARGAR DATA
    // =========================
    
    const cargar = async () => {
        try {
            setLoading(true);

            const res = await axios.get("/admin/desempeno/data");
            setData(res.data || []);

        } catch (error) {
            console.error("Error cargando desempeño:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    // =========================
    // GENERAR RESULTADOS (SP)
    // =========================
    const generar = async () => {
        try {
            setGenerando(true);

            await axios.post("/admin/desempeno/generar");

            await cargar();

            alert("Resultados generados correctamente");

        } catch (error) {
            console.error(error);
            alert("Error al generar resultados");
        } finally {
            setGenerando(false);
        }
    };
  
    // =========================
    // LISTA DE GRUPOS (dinámico)
    // =========================
    const grupos = useMemo(() => {
        const unique = new Set();
        data.forEach(d => {
            if (d.nombre_grupo) unique.add(d.nombre_grupo);
        });
        return ["todos", ...Array.from(unique)];
    }, [data]);

        const gestion = useMemo(() => {
        const unique = new Set();
        data.forEach(d => {
            if (d.gestion) unique.add(d.gestion);
        });
        return ["todos", ...Array.from(unique)];
    }, [data]);

    
    const resultado_final= useMemo(() => {
        const unique = new Set(); 
        data.forEach(d => {
            if (d.resultado_final) unique.add(d.resultado_final);
        });
        return ["todos", ...Array.from(unique)];
    }, [data]);

    // =========================
    // FILTRO PRINCIPAL
    // =========================
    
    
    const dataFiltrada = useMemo(() => {

        let result = [...data];

        // filtro estado
        if (filtroEstado === "aprobados") {
            result = result.filter(d => d.aprobado === true);
        }

        if (filtroEstado === "reprobados") {
            result = result.filter(d => d.aprobado === false);
        }

        // filtro grupo
        if (filtroGrupo !== "todos") {
            result = result.filter(d => d.nombre_grupo === filtroGrupo);
        }
        
        if (filtroAdmitidos === "NO ADMITIDO") {
            result = result.filter(d => d.resultado_final === "NO ADMITIDO");
        }
      if (filtroAdmitidos !== "todos") {
    result = result.filter(d =>
        (d.resultado_final || "")
            .toString()
            .trim()
            .toUpperCase() === filtroAdmitidos
            
    );
    
    
}
        if (FiltroGestion !== "todos") {
            result = result.filter(d => d.gestion === FiltroGestion);
        }   
        return result;

    }, [data, filtroEstado, filtroGrupo, filtroAdmitidos, FiltroGestion]);

    const admitidosPorCarrera = useMemo(() => {
    const map = {};

    dataFiltrada.forEach(d => {
        if ((d.resultado_final || "").toUpperCase() === "ADMITIDO") {
            const carrera = d.carrera || "SIN CARRERA";

            if (!map[carrera]) {
                map[carrera] = 0;
            }

            map[carrera]++;
        }
    });

    return map;
}, [dataFiltrada]);
    // =========================
    // KPIs
    // =========================
    const total = dataFiltrada.length;

    const aprobados = dataFiltrada.filter(d => d.aprobado).length;
    const reprobados = dataFiltrada.filter(d => !d.aprobado).length;

    const promedioGeneral = useMemo(() => {
        if (!dataFiltrada.length) return 0;

        const sum = dataFiltrada.reduce(
            (acc, d) => acc + Number(d.promedio_final || 0),
            0
        );

        return (sum / dataFiltrada.length).toFixed(2);

    }, [dataFiltrada]);

    // =========================
    // EXPORTAR (placeholder futuro)
    // ========================

    // =========================
    // UI
    // =========================
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold">Desempeño Final</h2>}
        >

            <div className="p-6 space-y-4">

                {/* ================= KPIs ================= */}
                <div className="grid md:grid-cols-4 gap-3">

                    <div className="bg-white border p-4 rounded">
                        <p className="text-sm text-gray-500">Registros</p>
                        <p className="text-xl font-bold">{total}</p>
                    </div>

                    <div className="bg-green-100 border p-4 rounded">
                        <p className="text-sm text-green-700">Aprobados</p>
                        <p className="text-xl font-bold text-green-800">{aprobados}</p>
                    </div>

                    <div className="bg-red-100 border p-4 rounded">
                        <p className="text-sm text-red-700">Reprobados</p>
                        <p className="text-xl font-bold text-red-800">{reprobados}</p>
                    </div>

                    <div className="bg-blue-100 border p-4 rounded">
                        <p className="text-sm text-blue-700">Promedio General</p>
                        <p className="text-xl font-bold text-blue-800">
                            {promedioGeneral}
                        </p>
                    </div>

                </div>
{/* ================= ADMITIDOS POR CARRERA ================= */}
<div className="grid md:grid-cols-4 gap-3">

    {Object.entries(admitidosPorCarrera).map(([carrera, cantidad], i) => (
        <div key={i} className="bg-white border rounded p-4 shadow-sm">
            <p className="text-sm text-gray-500">Admitidos</p>
            <p className="font-bold text-blue-700">{carrera}</p>
            <p className="text-xl font-bold">{cantidad}</p>
        </div>
    ))}

</div>
                {/* ================= ACCIONES ================= */}
                <div className="flex flex-wrap gap-2 items-center">

                    <button
                        onClick={generar}
                        disabled={generando}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        {generando ? "Generando..." : "Generar Resultados"}
                    </button>

                    <button
                        onClick={exportarExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        Excel
                    </button>

                    <button
                        onClick={exportarPDF}
                        className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                        PDF
                    </button>

                    {/* filtro estado */}
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="border px-2 py-2 rounded"
                    >
                        <option value="todos">Todos</option>
                        <option value="aprobados">Aprobados</option>
                        <option value="reprobados">Reprobados</option>
                    </select>

                    {/* filtro grupo */}
                    <select
                        value={filtroGrupo}
                        onChange={(e) => setFiltroGrupo(e.target.value)}
                        className="border px-2 py-2 rounded"
                    >
                        {grupos.map((g, i) => (
                            <option key={i} value={g}>
                                {g === "todos" ? "Todos los grupos" : g}
                            </option>
                        ))}
                    </select>

                         {/* filtro grupo */}
                  <select
    value={filtroAdmitidos}
    onChange={(e) => setFiltroAdmitidos(e.target.value)}
    className="border px-2 py-2 rounded"
>
    <option value="todos">Todos</option>
    <option value="ADMITIDO">Admitido</option>
    <option value="NO ADMITIDO">No admitido</option>

</select>
  <select
    value={FiltroGestion}
    onChange={(e) => setFiltroGestion(e.target.value)}
    className="border px-2 py-2 rounded"
    
    
>   
       {gestion.map((g, i) => (
                            <option key={i} value={g}>
                                {g === "todos" ? "Todos las gestiones" : g}
                            </option>
                        ))}
</select>



                </div>

                {/* ================= TABLA ================= */}
                <div className="bg-white border rounded overflow-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="p-2">CI</th>
                                <th className="p-2">Postulante</th>
                                <th className="p-2">Grupo</th>

                                <th className="p-2">Mat</th>
                                <th className="p-2">Fis</th>
                                <th className="p-2">Comp</th>
                                <th className="p-2">Ing</th>

                                <th className="p-2">Final</th>
                                <th className="p-2">Estado</th>
                        
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-4 text-center">
                                        Cargando...
                                    </td>
                                </tr>
                            ) : dataFiltrada.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-4 text-center">
                                        Sin resultados
                                    </td>
                                </tr>
                            ) : (
                                dataFiltrada.map((d, i) => (
                                    <tr key={i} className="border-t">

                                        <td className="p-2">{d.ci}</td>
                                        <td className="p-2">{d.postulante}</td>
                                        <td className="p-2">{d.nombre_grupo || "-"}</td>

                                        <td className="p-2">{d.promedio_matematicas}</td>
                                        <td className="p-2">{d.promedio_fisica}</td>
                                        <td className="p-2">{d.promedio_computacion}</td>
                                        <td className="p-2">{d.promedio_ingles}</td>

                                        <td className="p-2 font-bold">
                                            {d.promedio_final}
                                        </td>

                                        <td className="p-2">
                                            {d.aprobado ? (
                                                <span className="text-green-600 font-bold">
                                                    APROBADO
                                                </span>
                                            ) : (
                                                <span className="text-red-600 font-bold">
                                                    REPROBADO
                                                </span>
                                            )}
                                        </td>

                                    

                                    </tr>
                                ))
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </AuthenticatedLayout>
    );
}
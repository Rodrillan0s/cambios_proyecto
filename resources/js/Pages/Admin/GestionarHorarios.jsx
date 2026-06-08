import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes"];

const coloresMateria = {
    MATEMATICAS: "bg-blue-200 border-blue-400",
    FISICA: "bg-green-200 border-green-400",
    INGLES: "bg-yellow-200 border-yellow-400",
    COMPUTACION: "bg-purple-200 border-purple-400",
};

const getColor = (materia) => {
    if (!materia) return "bg-gray-200 border-gray-400";
    return coloresMateria[materia.toUpperCase()] || "bg-gray-200 border-gray-400";
};

export default function GestionarHorarios() {

    const [data, setData] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [crear, setCrear] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [form, setForm] = useState({
        id_grupo: "",
        id_materia: "",
        tipo: "",
        hora_inicio: "",
        hora_fin: ""
    });

    const [filtros, setFiltros] = useState({
    grupo: "",
    materia: "",
    dia: ""
});

    // =========================
    // CARGA GENERAL
    // =========================
    useEffect(() => {
        cargar();
        cargarMaterias();
    }, []);

    const cargar = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/admin/horarios/data");
            setData(res.data || []);
        } finally {
            setLoading(false);
        }
    };

    const cargarMaterias = async () => {
        try {
            const res = await axios.get("/admin/materias");
            setMaterias(res.data || []);
        } catch {
            setMaterias([]);
        }
    };

    const cargarBloques = async (idGrupo) => {
        try {
            const res = await axios.get(
                `/admin/horarios/bloques/disponibles/${idGrupo}`
            );
            setBloques(res.data || []);
        } catch {
            setBloques([]);
        }
    };

    // =========================
    // AGRUPAR POR GRUPO
    // =========================
const gruposData = useMemo(() => {
    const map = {};

    data
        .filter(h => {
            if (filtros.grupo && h.nombre_grupo !== filtros.grupo) return false;
            if (filtros.materia && h.id_materia != filtros.materia) return false;
            if (filtros.dia && h.dia_semana != filtros.dia) return false;
            return true;
        })
        .forEach(h => {
            if (!map[h.id_grupo]) {
                map[h.id_grupo] = {
                    id_grupo: h.id_grupo,
                    nombre_grupo: h.nombre_grupo,
                    horarios: []
                };
            }
            map[h.id_grupo].horarios.push(h);
        });

    return Object.values(map);
}, [data, filtros]);

    // =========================
    // MATERIAS DISPONIBLES
    // =========================
    const materiasDisponibles = useMemo(() => {
        if (!crear) return materias;

        const grupo = gruposData.find(
            g => g.id_grupo === crear.id_grupo
        );

        if (!grupo) return materias;

        const usadas = grupo.horarios
            .map(h => Number(h.id_materia));

        return materias.filter(
            m => !usadas.includes(Number(m.id_materia))
        );
    }, [materias, gruposData, crear]);

    // =========================
    // GUARDAR
    // =========================
    const guardar = async () => {
        if (
            !form.id_grupo ||
            !form.id_materia ||
            !form.tipo ||
            !form.hora_inicio ||
            !form.hora_fin
        ) return;

        await axios.post("/admin/horarios", form);

        setCrear(null);
        setForm({
            id_grupo: "",
            id_materia: "",
            tipo: "",
            hora_inicio: "",
            hora_fin: ""
        });

        cargar();
    };

    // =========================
    // ELIMINAR
    // =========================
const eliminar = async (h) => {
    try {
        const res = await axios.delete("/admin/horarios", {
            headers: { Accept: "application/json" },
            data: {
                id_grupo: h.id_grupo,
                id_materia: h.id_materia
            }
        });

        console.log("RESPUESTA REAL:", res.data);

        setMensaje("Horario eliminado correctamente");
        cargar();

        setTimeout(() => setMensaje(""), 3000);

    } catch (err) {
        console.log("ERROR REAL:", err.response?.data || err.message);
    }
};

    // =========================
    // UI
    // =========================
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold">
                    Gestión de Horarios
                </h2>
            }
        >

            <div className="p-6 space-y-6">
                <div className="bg-white p-4 rounded border flex gap-3 mb-4">

    <select
        className="border p-2"
        value={filtros.grupo}
        onChange={(e) =>
            setFiltros({ ...filtros, grupo: e.target.value })
        }
    >
    
     <option value="">Todos los grupos</option>

{[...new Map(data.map(d => [d.nombre_grupo, d])).values()]
    .map((g, i) => (
        <option key={i} value={g.nombre_grupo}>
            {g.nombre_grupo}
        </option>
))}
    </select>

    <select
        className="border p-2"
        value={filtros.materia}
        onChange={(e) =>
            setFiltros({ ...filtros, materia: e.target.value })
        }
    >
        <option value="">Todas las materias</option>
        {materias.map(m => (
            <option key={m.id_materia} value={m.id_materia}>
                {m.nombre}
            </option>
        ))}
    </select>

    <select
        className="border p-2"
        value={filtros.dia}
        onChange={(e) =>
            setFiltros({ ...filtros, dia: e.target.value })
        }
    >
        <option value="">Todos los días</option>
        {DIAS.map(d => (
            <option key={d} value={d}>
                {d}
            </option>
        ))}
    </select>

    <button
        className="px-3 py-2 bg-gray-200"
        onClick={() =>
            setFiltros({ grupo: "", materia: "", dia: "" })
        }
    >
        Limpiar
    </button>

</div>
                {loading ? (
                    <p>Cargando...</p>
                ) : (

                    gruposData.map(grupo => (

                        <div key={grupo.id_grupo} className="bg-white border rounded-xl">

                            <div className="bg-slate-900 text-white px-4 py-3 font-bold">
                                {grupo.nombre_grupo}
                            </div>

                            <div className="grid grid-cols-5 gap-2 p-4">

                                {DIAS.map(dia => {

                                    const horariosDia = grupo.horarios.filter(
                                        h => h.dia_semana === dia
                                    );

                                    return (
                                        <div key={dia} className="border rounded bg-gray-50">

                                            <div className="bg-slate-700 text-white text-center text-xs py-1 capitalize">
                                                {dia}
                                            </div>

                                            <div className="p-2 space-y-2">

                                                {horariosDia.map((h, i) => (

                                                    <div
                                                        key={i}
                                                        className={`relative border-l-4 p-2 text-xs ${getColor(h.materia)}`}
                                                    >

                                                        <div className="font-bold">
                                                            {h.materia}
                                                        </div>

                                                        <div>
                                                            {h.hora_inicio} - {h.hora_fin}
                                                        </div>

                                                        <div className="text-[10px]">
                                                            {h.nombre_docente}
                                                        </div>

                                                        <button
                                                            onClick={() => eliminar(h)}
                                                            className="absolute top-1 right-1 text-red-600 text-[10px]"
                                                        >
                                                            ✕
                                                        </button>

                                                    </div>
                                                ))}

                                                <button
                                                    onClick={async () => {
                                                        await cargarBloques(grupo.id_grupo);

                                                        setCrear({
                                                            id_grupo: grupo.id_grupo
                                                        });

                                                        setForm({
                                                            id_grupo: grupo.id_grupo,
                                                            id_materia: "",
                                                            tipo: "",
                                                            hora_inicio: "",
                                                            hora_fin: ""
                                                        });
                                                    }}
                                                    className="text-xs text-blue-600"
                                                >
                                                    + agregar
                                                </button>

                                            </div>

                                        </div>
                                    );
                                })}

                            </div>

                        </div>

                    ))

                )}

            </div>

            {crear && (

                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

                    <div className="bg-white p-6 rounded w-96 space-y-3">

                        <h3 className="font-bold">
                            Asignar horario
                        </h3>

                        <select
                            className="border p-2 w-full"
                            value={form.id_materia}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    id_materia: e.target.value
                                })
                            }
                        >
                            <option value="">Seleccionar materia</option>

                            {materiasDisponibles.map(m => (
                                <option key={m.id_materia} value={m.id_materia}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            className="border p-2 w-full"
                            onChange={(e) => {
                                const bloque = bloques.find(
                                    b =>
                                        `${b.tipo}_${b.hora_inicio}_${b.hora_fin}`
                                        === e.target.value
                                );

                                if (!bloque) return;

                                setForm({
                                    ...form,
                                    tipo: bloque.tipo,
                                    hora_inicio: bloque.hora_inicio,
                                    hora_fin: bloque.hora_fin
                                });
                            }}
                        >
                            <option value="">Seleccionar bloque</option>

                            {bloques.map((b, i) => (
                                <option
                                    key={i}
                                    value={`${b.tipo}_${b.hora_inicio}_${b.hora_fin}`}
                                >
                                    {b.tipo} | {b.hora_inicio} - {b.hora_fin}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2">

                            <button
                                onClick={() => setCrear(null)}
                                className="border px-3 py-1 rounded"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={guardar}
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                            >
                                Guardar
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </AuthenticatedLayout>
    );
}
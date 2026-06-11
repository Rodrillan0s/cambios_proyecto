import { useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

export default function Notas() {

    const [notas, setNotas] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(false);
const [idEditar, setIdEditar] = useState(null);
    const [file, setFile] = useState(null);

    const editar = (n) => {
    setForm({
        ci: n.ci,
        //id_materia: n.id_materia,
        nro_examen: n.nro_examen,
        nota: n.nota,
        fecha_examen: n.fecha_examen
    });

    setIdEditar(n.id_examen);
    setEditando(true);
};
const eliminar = async (id) => {

    if (!confirm("¿Eliminar nota?")) return;

    try {
        await axios.delete(`/admin/notas/${id}`);
        cargar();
    } catch (error) {
        console.error(error);
    }
};
    const [form, setForm] = useState({
        ci: "",
        id_materia: "",
        nro_examen: "",
        nota: "",
        fecha_examen: ""
    });

    const [filtros, setFiltros] = useState({
        materia: "",
        ci: ""
    });

    // =========================
    // CARGAR DATA
    // =========================
    const cargar = async () => {
        try {
            setLoading(true);

            const [notasRes, materiasRes] = await Promise.all([
                axios.get("/admin/notas/data"),
                axios.get("/admin/notas/materias")
            ]);

            setNotas(notasRes.data || []);
            setMaterias(materiasRes.data || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    // =========================
    // IMPORTAR EXCEL
    // =========================
    const importarNotas = async () => {

        if (!file) {
            alert("Selecciona un archivo");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post("/admin/notas/importar", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            alert("Importación exitosa");

            setFile(null);
            cargar();

        } catch (error) {
            console.error(error);
            alert("Error en importación");
        }
    };

    // =========================
    // GUARDAR NOTA
    // =========================
const guardar = async () => {

    if (!form.ci || !form.id_materia || !form.nro_examen || !form.nota) {
        alert("Completa todos los campos");
        return;
    }

    try {

        if (editando) {
            await axios.put(`/admin/notas/${idEditar}`, form);
        } else {
            await axios.post("/admin/notas", form);
        }

        setForm({
            ci: "",
            id_materia: "",
            nro_examen: "",
            nota: "",
            fecha_examen: ""
        });

        setEditando(false);
        setIdEditar(null);

        cargar();

    } catch (error) {
        console.error(error);
    }
};
    // =========================
    // FILTROS
    // =========================
    const notasFiltradas = useMemo(() => {

        return (notas || []).filter(n => {

            if (filtros.ci && !n.ci.includes(filtros.ci)) return false;

            if (filtros.materia && String(n.id_materia) !== filtros.materia) return false;

            return true;
        });

    }, [notas, filtros]);

    // =========================
    // UI
    // =========================
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold">Control de Notas</h2>}
        >

            <div className="p-6 space-y-4">

                {/* ================= FORM ================= */}
                <div className="bg-white border rounded p-4">

                    <h3 className="font-bold mb-3">Registrar Nota</h3>

                    <div className="grid md:grid-cols-2 gap-3">

                        <input
                            className="border p-2 rounded"
                            placeholder="CI del postulante"
                            value={form.ci}
                            onChange={e => setForm({ ...form, ci: e.target.value })}
                        />

                        <select
                            className="border p-2 rounded"
                            value={form.id_materia}
                            onChange={e => setForm({ ...form, id_materia: e.target.value })}
                        >
                            <option value="">Materia</option>
                            {materias.map(m => (
                                <option key={m.id_materia} value={m.id_materia}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>

                        <input
                            className="border p-2 rounded"
                            type="number"
                            placeholder="Nro Examen"
                            value={form.nro_examen}
                            onChange={e => setForm({ ...form, nro_examen: e.target.value })}
                        />

                        <input
                            className="border p-2 rounded"
                            type="number"
                            placeholder="Nota"
                            value={form.nota}
                            onChange={e => setForm({ ...form, nota: e.target.value })}
                        />

                        <input
                            className="border p-2 rounded"
                            type="date"
                            value={form.fecha_examen}
                            onChange={e => setForm({ ...form, fecha_examen: e.target.value })}
                        />

                    </div>

                    <button
                        onClick={guardar}
                        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Guardar Nota
                    </button>
                </div>

                {/* ================= IMPORTAR + FILTROS ================= */}
                <div className="bg-white border rounded p-4 flex gap-2 items-center">

                    {/* IMPORTAR */}
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="border p-2 rounded"
                        onChange={(e) => setFile(e.target.files[0])}
                    />

                    <button
                        onClick={importarNotas}
                        className="bg-blue-600 text-white px-3 py-2 rounded"
                    >
                        Importar Excel
                    </button>

                    {/* FILTROS */}
                    <input
                        className="border p-2 rounded"
                        placeholder="Buscar CI"
                        value={filtros.ci}
                        onChange={e => setFiltros({ ...filtros, ci: e.target.value })}
                    />

                    <select
                        className="border p-2 rounded"
                        value={filtros.materia}
                        onChange={e => setFiltros({ ...filtros, materia: e.target.value })}
                    >
                        <option value="">Todas las materias</option>
                        {materias.map(m => (
                            <option key={m.id_materia} value={m.id_materia}>
                                {m.nombre}
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
                                <th className="p-2">Materia</th>
                                <th className="p-2">Examen</th>
                                <th className="p-2">Nota</th>
                                <th className="p-2">Fecha</th>
                            </tr>
                        </thead>

<tbody>

    {loading ? (
        <tr>
            <td colSpan="6" className="p-4">
                Cargando...
            </td>
        </tr>
    ) : (

        notasFiltradas.map(n => (
            <tr key={n.id_examen} className="border-t">

                <td className="p-2">{n.ci}</td>
                <td className="p-2">{n.postulante}</td>
                <td className="p-2">{n.materia}</td>
                <td className="p-2">{n.nro_examen}</td>
                <td className="p-2 font-bold">{n.nota}</td>
                <td className="p-2">{n.fecha_examen}</td>

                <td className="p-2">
                   <button
    onClick={() => eliminar(n.id_examen)}
    className="bg-red-600 text-white px-2 py-1 rounded"
>
    Eliminar
</button>

                <button
    onClick={() => editar(n)}
    className="bg-yellow-500 text-white px-2 py-1 rounded"
>
    Editar
</button>

<button
    onClick={guardar}
    className={`mt-3 px-4 py-2 rounded text-white ${
        editando ? "bg-yellow-600" : "bg-blue-600"
    }`}
>
    {editando ? "Actualizar Nota" : "Guardar Nota"}
</button>
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
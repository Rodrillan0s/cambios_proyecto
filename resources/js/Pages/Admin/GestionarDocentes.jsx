import { useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

export default function GestionarDocentes() {

    const [docentes, setDocentes] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [grupos, setGrupos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    const [form, setForm] = useState({
        id_docente: "",
        id_grupo: "",
        id_materia: ""
    });

    // =========================
    // CARGAR DATOS
    // =========================
    useEffect(() => {
        cargarTodo();
    }, []);

    const cargarTodo = async () => {
        setLoading(true);

        try {
            const [resDoc, resMat, resGru] = await Promise.all([
                axios.get("/admin/docentes/data"),
                axios.get("/admin/materias"),
                axios.get("/admin/grupos/data")
            ]);

            setDocentes(resDoc.data || []);
            setMaterias(resMat.data || []);
            setGrupos(resGru.data || []);

        } catch (e) {
            console.error("Error cargando datos:", e);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // ASIGNAR
    // =========================
    const asignar = async () => {
        try {
            const res = await axios.post("/admin/docentes/asignar", form);

            alert(res.data.msg || "OK");

            setModal(false);
            setForm({ id_docente: "", id_grupo: "", id_materia: "" });

            cargarTodo();

        } catch (e) {
            alert(e.response?.data?.msg || "Error");
        }
    };

    // =========================
    // QUITAR
    // =========================
    const quitar = async (id_docente, id_grupo, id_materia) => {

        if (!confirm("¿Seguro?")) return;

        try {
            await axios.delete("/admin/docentes/quitar", {
                data: { id_docente, id_grupo, id_materia }
            });

            cargarTodo();

        } catch (e) {
            alert("Error al quitar");
        }
    };

    return (
        <AuthenticatedLayout header={<h2>Docentes</h2>}>

            <div className="p-6">

                {loading ? (
                    <p>Cargando...</p>
                ) : (

                    docentes.length === 0 ? (
                        <p>No hay docentes</p>
                    ) : (

                        docentes.map(d => (

                            <div key={d.id_docente} className="border p-4 mb-3 bg-white">

                                <div className="flex justify-between">

                                    <div>
                                        <b>{d.nombres} {d.apellidos}</b>
                                        <p className="text-sm text-gray-500">
                                            CI: {d.ci}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setModal(true);
                                            setForm({ ...form, id_docente: d.id_docente });
                                        }}
                                        className="text-blue-600"
                                    >
                                        Asignar
                                    </button>

                                </div>

                                {/* MATERIAS */}
                                <div className="mt-3">

                                    {d.materias && d.materias.length > 0 ? (

                                        d.materias.map((m, i) => (
                                            <div key={i} className="flex justify-between bg-gray-100 p-2 mt-1">
                                                <span>
                                                    {m.materia} - Grupo {m.grupo}
                                                </span>

                                                <button
                                                    onClick={() => quitar(d.id_docente, m.id_grupo, m.id_materia)}
                                                    className="text-red-600"
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        ))

                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            Sin materias
                                        </p>
                                    )}

                                </div>

                            </div>

                        ))

                    )

                )}

            </div>

            {/* MODAL */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

                    <div className="bg-white p-4 w-96">

                        <select
                            className="w-full border p-2 mb-2"
                            onChange={e => setForm({ ...form, id_grupo: e.target.value })}
                        >
                            <option value="">Grupo</option>
                            {grupos.map(g => (
                                <option key={g.id_grupo} value={g.id_grupo}>
                                    {g.nombre_grupo}
                                </option>
                            ))}
                        </select>

                        <select
                            className="w-full border p-2 mb-2"
                            onChange={e => setForm({ ...form, id_materia: e.target.value })}
                        >
                            <option value="">Materia</option>
                            {materias.map(m => (
                                <option key={m.id_materia} value={m.id_materia}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2">

                            <button onClick={() => setModal(false)}>
                                Cancelar
                            </button>

                            <button onClick={asignar} className="bg-blue-600 text-white px-3 py-1">
                                Guardar
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </AuthenticatedLayout>
    );
}
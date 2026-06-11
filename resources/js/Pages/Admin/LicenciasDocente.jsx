import { useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import axios from "axios";

export default function LicenciasDocente() {

    const [licencias, setLicencias] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        id_docente: "",
        fecha_inicio: "",
        fecha_fin: "",
        motivo: "",
        observacion: ""
    });

    const [filtros, setFiltros] = useState({
        docente: "",
        fecha_inicio: "",
        fecha_fin: ""
    });

const cargar = async () => {
    try {
        setLoading(true);

        const licenciasRes = await axios.get("/admin/licencias-docente/data");
        const docentesRes = await axios.get("/admin/licencias-docente/docentes");

        console.log("LICENCIAS RAW:", licenciasRes.data);
        console.log("DOCENTES RAW:", docentesRes.data);

        setLicencias(licenciasRes.data || []);
        setDocentes(docentesRes.data || []);

    } catch (error) {
        console.error("ERROR CARGA:", error);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        cargar();
    }, []);

    const guardar = async () => {

        if (
            !form.id_docente ||
            !form.fecha_inicio ||
            !form.fecha_fin ||
            !form.motivo
        ) {
            alert("Complete los campos obligatorios");
            return;
        }

        if (form.fecha_fin < form.fecha_inicio) {
            alert("La fecha fin no puede ser menor a la fecha inicio");
            return;
        }

        try {

            await axios.post(
                "/admin/licencias-docente",
                form
            );

            setForm({
                id_docente: "",
                fecha_inicio: "",
                fecha_fin: "",
                motivo: "",
                observacion: ""
            });

            cargar();

        } catch (error) {
            console.error(error);
        }
    };

    const eliminar = async (id) => {

        if (!confirm("¿Eliminar licencia?")) {
            return;
        }

        try {

            await axios.delete(
                `/admin/licencias-docente/${id}`
            );

            cargar();

        } catch (error) {
            console.error(error);
        }
    };

    const obtenerEstado = (fila) => {

        const hoy = new Date();

        const inicio = new Date(fila.fecha_inicio);
        const fin = new Date(fila.fecha_fin);

        if (hoy < inicio) {
            return "PROGRAMADA";
        }

        if (hoy > fin) {
            return "FINALIZADA";
        }

        return "ACTIVA";
    };

const licenciasFiltradas = useMemo(() => {

    const lista = Array.isArray(licencias) ? licencias : [];

    return lista.filter(f => {

        if (
            filtros.docente &&
            String(f.id_docente) !== filtros.docente
        ) return false;

        if (
            filtros.fecha_inicio &&
            f.fecha_inicio < filtros.fecha_inicio
        ) return false;

        if (
            filtros.fecha_fin &&
            f.fecha_fin > filtros.fecha_fin
        ) return false;

        return true;
    });

}, [licencias, filtros]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold">
                    Licencias de Docentes
                </h2>
            }
        >
            <div className="p-6 space-y-4">

                {/* DASHBOARD */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="bg-blue-100 border rounded p-4">
                        <div>Total Licencias</div>
                        <div className="text-2xl font-bold">
                            {licenciasFiltradas.length}
                        </div>
                    </div>

                    <div className="bg-green-100 border rounded p-4">
                        <div>Activas</div>
                        <div className="text-2xl font-bold">
                            {
                                licenciasFiltradas.filter(
                                    x => obtenerEstado(x) === "ACTIVA"
                                ).length
                            }
                        </div>
                    </div>

                    <div className="bg-gray-100 border rounded p-4">
                        <div>Finalizadas</div>
                        <div className="text-2xl font-bold">
                            {
                                licenciasFiltradas.filter(
                                    x => obtenerEstado(x) === "FINALIZADA"
                                ).length
                            }
                        </div>
                    </div>

                </div>

                {/* FORMULARIO */}

                <div className="bg-white border rounded p-4">

                    <h3 className="font-bold mb-3">
                        Registrar Licencia
                    </h3>

                    <div className="grid md:grid-cols-2 gap-3">

                        <select
                            className="border rounded p-2"
                            value={form.id_docente}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    id_docente: e.target.value
                                })
                            }
                        >
                            <option value="">
                                Seleccione docente
                            </option>

                            {docentes.map(d => (
                                <option
                                    key={d.id_docente}
                                    value={d.id_docente}
                                >
                                    {d.apellidos} {d.nombres}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Motivo"
                            className="border rounded p-2"
                            value={form.motivo}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    motivo: e.target.value
                                })
                            }
                        />

                        <input
                            type="date"
                            className="border rounded p-2"
                            value={form.fecha_inicio}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    fecha_inicio: e.target.value
                                })
                            }
                        />

                        <input
                            type="date"
                            className="border rounded p-2"
                            value={form.fecha_fin}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    fecha_fin: e.target.value
                                })
                            }
                        />

                    </div>

                    <textarea
                        className="border rounded p-2 w-full mt-3"
                        rows="3"
                        placeholder="Observación"
                        value={form.observacion}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                observacion: e.target.value
                            })
                        }
                    />

                    <button
                        onClick={guardar}
                        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Guardar Licencia
                    </button>

                </div>

                {/* FILTROS */}

                <div className="bg-white border rounded p-4 flex flex-wrap gap-2">

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
                            <option
                                key={d.id_docente}
                                value={d.id_docente}
                            >
                                {d.apellidos} {d.nombres}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="border rounded p-2"
                        value={filtros.fecha_inicio}
                        onChange={(e) =>
                            setFiltros({
                                ...filtros,
                                fecha_inicio: e.target.value
                            })
                        }
                    />

                    <input
                        type="date"
                        className="border rounded p-2"
                        value={filtros.fecha_fin}
                        onChange={(e) =>
                            setFiltros({
                                ...filtros,
                                fecha_fin: e.target.value
                            })
                        }
                    />

                </div>

                {/* TABLA */}

                <div className="bg-white border rounded overflow-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-slate-900 text-white">

                            <tr>
                                <th className="p-2 text-left">Docente</th>
                                <th className="p-2 text-left">Inicio</th>
                                <th className="p-2 text-left">Fin</th>
                                <th className="p-2 text-left">Motivo</th>
                                <th className="p-2 text-left">Observación</th>
                                <th className="p-2 text-center">Estado</th>
                                <th className="p-2 text-center">Acciones</th>
                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-4">
                                        Cargando...
                                    </td>
                                </tr>
                            ) : (

                                licenciasFiltradas.map(fila => (

                                    <tr
                                        key={fila.id_licencia}
                                        className="border-t"
                                    >
                                        <td className="p-2">
                                            {fila.docente}
                                        </td>

                                        <td className="p-2">
                                            {fila.fecha_inicio}
                                        </td>

                                        <td className="p-2">
                                            {fila.fecha_fin}
                                        </td>

                                        <td className="p-2">
                                            {fila.motivo}
                                        </td>

                                        <td className="p-2">
                                            {fila.observacion}
                                        </td>

                                        <td className="p-2 text-center">
                                            {obtenerEstado(fila)}
                                        </td>

                                        <td className="p-2 text-center">

                                            <button
                                                onClick={() =>
                                                    eliminar(
                                                        fila.id_licencia
                                                    )
                                                }
                                                className="bg-red-600 text-white px-2 py-1 rounded"
                                            >
                                                Eliminar
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
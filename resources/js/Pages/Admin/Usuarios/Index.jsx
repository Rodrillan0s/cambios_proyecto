import { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import axios from "axios";

export default function Index({ usuarios: initialUsuarios, roles, permisos, rolPermisos = {} }) {
    const currentUser = usePage().props.auth.user;

    const [usuarios, setUsuarios] = useState(initialUsuarios || []);
    const [busqueda, setBusqueda] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Modals
    const [modalCrear, setModalCrear] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);

    // Forms
    const [crearForm, setCrearForm] = useState({
        nombre: "",
        usuario: "",
        correo: "",
        id_rol: "",
        password: "",
        password_confirmation: "",
        permisos: []
    });

    const [editarForm, setEditarForm] = useState({
        id_usuario: "",
        nombre: "",
        usuario: "",
        correo: "",
        id_rol: "",
        estado: true,
        permisos: [] // Array of direct permission IDs
    });

    // Group all permissions by module name
    const permisosAgrupados = useMemo(() => {
        const groups = {};
        permisos.forEach(p => {
            if (!groups[p.nombre_modulo]) {
                groups[p.nombre_modulo] = [];
            }
            groups[p.nombre_modulo].push(p);
        });
        return groups;
    }, [permisos]);

    // =========================
    // RECARGAR DATOS
    // =========================
    const recargarUsuarios = async () => {
        try {
            // We can reload the page or fetch via API. For simplicity and SPA experience, let's fetch from the index JSON.
            const res = await axios.get("/usuarios", {
                headers: { "X-Requested-With": "XMLHttpRequest" }
            });
            if (res.data && res.data.data) {
                // Paginated Laravel response if paginate() was used, or raw array
                setUsuarios(res.data.data || res.data || []);
            } else {
                setUsuarios(res.data || []);
            }
        } catch (e) {
            console.error("Error al recargar usuarios:", e);
        }
    };

    // =========================
    // CREAR USUARIO
    // =========================
    const handleCrear = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (crearForm.password !== crearForm.password_confirmation) {
            setErrorMsg("Las contraseñas no coinciden.");
            return;
        }

        try {
            const res = await axios.post("/usuarios", crearForm);
            if (res.data.success) {
                setMensaje(res.data.message || "Usuario registrado correctamente.");
                setModalCrear(false);
                limpiarCrearForm();
                recargarUsuarios();
                setTimeout(() => setMensaje(""), 4000);
            }
        } catch (e) {
            setErrorMsg(e.response?.data?.message || "Ocurrió un error al crear la cuenta.");
        }
    };

    const limpiarCrearForm = () => {
        setCrearForm({
            nombre: "",
            usuario: "",
            correo: "",
            id_rol: "",
            password: "",
            password_confirmation: "",
            permisos: []
        });
    };

    // =========================
    // EDITAR USUARIO
    // =========================
    const handleEditar = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        try {
            const res = await axios.put(`/usuarios/${editarForm.id_usuario}`, editarForm);
            if (res.data.success) {
                setMensaje(res.data.message || "Usuario actualizado correctamente.");
                setModalEditar(false);
                recargarUsuarios();
                setTimeout(() => setMensaje(""), 4000);
            }
        } catch (e) {
            setErrorMsg(e.response?.data?.message || "Ocurrió un error al guardar cambios.");
        }
    };

    // =========================
    // ELIMINAR USUARIO
    // =========================
    const handleEliminar = async (usr) => {
        if (usr.id_usuario === currentUser.id_usuario) {
            alert("No puedes eliminar tu propio usuario en sesión.");
            return;
        }

        if (!confirm(`¿Está seguro de eliminar de forma permanente al usuario ${usr.nombre}?`)) return;

        setErrorMsg("");
        try {
            const res = await axios.delete(`/usuarios/${usr.id_usuario}`);
            if (res.data.success) {
                setMensaje(res.data.message || "Usuario eliminado correctamente.");
                recargarUsuarios();
                setTimeout(() => setMensaje(""), 4000);
            }
        } catch (e) {
            setErrorMsg(e.response?.data?.message || "Error al eliminar el usuario.");
        }
    };

    // =========================
    // CONTROL DE CHECKBOXES DE PERMISOS
    // =========================
    const togglePermisoCrear = (id) => {
        const act = [...crearForm.permisos];
        const idx = act.indexOf(id);
        if (idx > -1) {
            act.splice(idx, 1);
        } else {
            act.push(id);
        }
        setCrearForm({ ...crearForm, permisos: act });
    };

    const togglePermisoEditar = (id) => {
        const act = [...editarForm.permisos];
        const idx = act.indexOf(id);
        if (idx > -1) {
            act.splice(idx, 1);
        } else {
            act.push(id);
        }
        setEditarForm({ ...editarForm, permisos: act });
    };

    // =========================
    // FILTRADO
    // =========================
    const usuariosFiltrados = useMemo(() => {
        if (!busqueda) return usuarios;
        const q = busqueda.toLowerCase().trim();
        return usuarios.filter(u =>
            u.nombre.toLowerCase().includes(q) ||
            u.usuario.toLowerCase().includes(q) ||
            u.correo.toLowerCase().includes(q) ||
            u.nombre_rol.toLowerCase().includes(q)
        );
    }, [usuarios, busqueda]);

    // =========================
    // ESTADÍSTICAS
    // =========================
    const estadisticas = useMemo(() => {
        const total = usuarios.length;
        const activos = usuarios.filter(u => u.estado).length;
        const inactivos = total - activos;
        const admins = usuarios.filter(u => u.nombre_rol === "ADMINISTRADOR").length;

        return { total, activos, inactivos, admins };
    }, [usuarios]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            Administración de Cuentas y Accesos
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Gestión de roles y permisos específicos directos sobre los módulos.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            limpiarCrearForm();
                            setModalCrear(true);
                        }}
                        className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Nuevo Usuario
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* NOTIFICACIONES */}
                {mensaje && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{mensaje}</span>
                    </div>
                )}
                {errorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                        <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* TARJETAS ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-indigo-500 tracking-wider">Cuentas Registradas</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.total}</h3>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-emerald-500 tracking-wider">Usuarios Activos</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.activos}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-100/60 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-amber-500 tracking-wider">Administradores</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.admins}</h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Cuentas Bloqueadas</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{estadisticas.inactivos}</h3>
                        </div>
                        <div className="p-3 bg-slate-500/10 text-slate-600 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar usuario por nombre completo, alias, correo o rol..."
                            className="rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full pl-10"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                {/* LISTADO DE USUARIOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usuariosFiltrados.map(usr => {
                        const isSelf = usr.id_usuario === currentUser.id_usuario;

                        return (
                            <div key={usr.id_usuario} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                {usr.nombre.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-extrabold text-slate-800 text-sm truncate leading-snug">
                                                    {usr.nombre}
                                                </h3>
                                                <p className="text-xs font-semibold text-indigo-600 mt-0.5 truncate">
                                                    @{usr.usuario}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                                usr.estado ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                                            }`}>
                                                {usr.estado ? "Activo" : "Bloqueado"}
                                            </span>
                                            {isSelf && (
                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                                                    Mi Cuenta
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detalles */}
                                    <div className="space-y-2 text-xs py-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 font-semibold">Correo:</span>
                                            <span className="text-slate-700 truncate max-w-[180px] font-semibold">{usr.correo}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 font-semibold">Rol Asignado:</span>
                                            <span className="text-slate-800 font-bold uppercase tracking-wider text-[10px] bg-slate-100 px-2.5 py-0.5 rounded-md">
                                                {usr.nombre_rol}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 font-semibold">Permisos Directos:</span>
                                            <span className="text-slate-700 font-bold">
                                                {usr.permisos_directos ? usr.permisos_directos.length : 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                    <button
                                        onClick={() => {
                                            setEditarForm({
                                                id_usuario: usr.id_usuario,
                                                nombre: usr.nombre,
                                                usuario: usr.usuario,
                                                correo: usr.correo,
                                                id_rol: usr.id_rol,
                                                estado: !!usr.estado,
                                                permisos: usr.permisos_directos || []
                                            });
                                            setModalEditar(true);
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition"
                                    >
                                        Configurar Accesos
                                    </button>
                                    {!isSelf && (
                                        <button
                                            onClick={() => handleEliminar(usr)}
                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL CREAR USUARIO */}
            {modalCrear && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <form onSubmit={handleCrear} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100/80 animate-scale-in">
                        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
                            <h3 className="font-extrabold text-base">Crear Cuenta de Usuario</h3>
                            <button
                                type="button"
                                onClick={() => setModalCrear(false)}
                                className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={crearForm.nombre}
                                        onChange={(e) => setCrearForm({ ...crearForm, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Nombre de Usuario (Alias)</label>
                                    <input
                                        type="text"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={crearForm.usuario}
                                        onChange={(e) => setCrearForm({ ...crearForm, usuario: e.target.value })}
                                        placeholder="ej: juan.perez"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={crearForm.correo}
                                        onChange={(e) => setCrearForm({ ...crearForm, correo: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Rol del Sistema</label>
                                    <select
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={crearForm.id_rol}
                                        onChange={(e) => setCrearForm({ ...crearForm, id_rol: e.target.value })}
                                    >
                                        <option value="">Seleccione un Rol</option>
                                        {roles.map(r => (
                                            <option key={r.id_rol} value={r.id_rol}>
                                                {r.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={crearForm.password}
                                        onChange={(e) => setCrearForm({ ...crearForm, password: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={crearForm.password_confirmation}
                                        onChange={(e) => setCrearForm({ ...crearForm, password_confirmation: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setModalCrear(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
                            >
                                Registrar Cuenta
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL CONFIGURAR ACCESOS Y PERMISOS DIRECTOS */}
            {modalEditar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <form onSubmit={handleEditar} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100/80 animate-scale-in flex flex-col max-h-[90vh]">
                        {/* Cabecera */}
                        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-extrabold text-base">Modificar Accesos del Usuario</h3>
                                <p className="text-[10px] text-slate-300 mt-0.5">Definición de rol principal y permisos especiales directos.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalEditar(false)}
                                className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Cuerpo con Scroll */}
                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Información Básica */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={editarForm.nombre}
                                        onChange={(e) => setEditarForm({ ...editarForm, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600">Nombre de Usuario (Alias)</label>
                                    <input
                                        type="text"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={editarForm.usuario}
                                        onChange={(e) => setEditarForm({ ...editarForm, usuario: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-600">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={editarForm.correo}
                                        onChange={(e) => setEditarForm({ ...editarForm, correo: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600">Estado del Usuario</label>
                                    <select
                                        className="rounded-xl border-slate-200 text-sm w-full"
                                        value={editarForm.estado ? "1" : "0"}
                                        onChange={(e) => setEditarForm({ ...editarForm, estado: e.target.value === "1" })}
                                    >
                                        <option value="1">Activo / Permitido</option>
                                        <option value="0">Bloqueado / Suspendido</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600">Rol del Sistema</label>
                                <select
                                    required
                                    className="rounded-xl border-slate-200 text-sm w-full font-bold uppercase text-slate-800"
                                    value={editarForm.id_rol}
                                    onChange={(e) => setEditarForm({ ...editarForm, id_rol: e.target.value })}
                                >
                                    {roles.map(r => (
                                        <option key={r.id_rol} value={r.id_rol}>
                                            {r.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Panel de Permisos Especiales */}
                            <div className="border-t border-slate-100 pt-4 space-y-4">
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Asignación Directa de Permisos Especiales
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Marque las acciones del sistema que este usuario puede realizar de forma independiente a los permisos heredados de su rol.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {Object.keys(permisosAgrupados).map(moduloName => (
                                        <div key={moduloName} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block border-b border-slate-200/60 pb-1">
                                                Módulo: {moduloName}
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {permisosAgrupados[moduloName].map(p => {
                                                    const isInherited = rolPermisos[editarForm.id_rol]?.includes(p.id_permiso);
                                                    const isChecked = isInherited || editarForm.permisos.includes(p.id_permiso);

                                                    return (
                                                        <label
                                                            key={p.id_permiso}
                                                            className={`flex items-center justify-between gap-2.5 border rounded-xl p-2.5 text-[11px] font-semibold transition select-none ${
                                                                isInherited
                                                                    ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed opacity-80"
                                                                    : isChecked 
                                                                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 cursor-pointer" 
                                                                        : "bg-white hover:bg-slate-100/50 border-slate-200 text-slate-600 cursor-pointer"
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 mt-0.5"
                                                                    checked={isChecked}
                                                                    disabled={isInherited}
                                                                    onChange={() => togglePermisoEditar(p.id_permiso)}
                                                                />
                                                                <span className="leading-tight break-all uppercase tracking-wide">
                                                                    {p.nombre_permiso.replace(/_/g, " ")}
                                                                </span>
                                                            </div>
                                                            {isInherited && (
                                                                <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                                                                    Heredado
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Pie de modal */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setModalEditar(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
                            >
                                Guardar Configuración
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

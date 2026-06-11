import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

const CARRERAS_FICCT = [
    { id: 1874, nombre: "Ingeniería en Sistemas (187-4)" },
    { id: 1875, nombre: "Ingeniería en Redes y Telecomunicaciones (187-5)" },
    { id: 1876, nombre: "Ingeniería Informática (187-6)" },
    { id: 3230, nombre: "Ingeniería en Robótica (323-0)" }
];

export default function GestionarPostulantes() {
    const [currentView, setCurrentView] = useState('list');
    const [successMessage, setSuccessMessage] = useState('');
    const [postulantes, setPostulantes] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ ci: '', nombre: '', estado_pago: '', gestion: '' });
    const [processing, setProcessing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const initialState = {
        ci: '', nombre: '', apellidos: '', fecha_nacimiento: '', sexo: '',
        direccion: '', telefono: '', correo: '', ciudad: 'Santa Cruz',
        codigo_bachiller: '', fecha_bachiller: '', nombre_colegio: '',
        tipo_colegio: '', turno: '', id_carrera_1: '', id_carrera_2: '',
        modalidad: '', monto: 70, metodo_pago: 'CAJA_FICCT', estado_pago: 'APROBADO',
        cedula: null, bachiller: null
    };
    const [formData, setFormData] = useState(initialState);

    const fetchPostulantes = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, ...filters };
            const response = await axios.get('/admin/postulantes', { params });
            setPostulantes(response.data.data);
            setMeta(response.data);
        } catch (error) {
            console.error("Error cargando postulantes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPostulantes();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPostulantes(1);
    };

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value
        }));
    };

    const openCreateView = () => {
        setFormData(initialState);
        setCurrentId(null);
        setSuccessMessage('');
        setCurrentView('create');
    };

    const openEditView = (postulante) => {
        const cleanData = Object.keys(postulante).reduce((acc, key) => {
            acc[key] = postulante[key] === null ? '' : postulante[key];
            return acc;
        }, {});

        setFormData({
            ...initialState,
            ...cleanData,
            cedula: null,
            bachiller: null
        });
        setCurrentId(postulante.id_postulante);
        setSuccessMessage('');
        setCurrentView('edit');
    };

    const closeForm = () => {
        setCurrentView('list');
        setFormData(initialState);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });

        try {
            if (currentView === 'edit') {
                data.append('_method', 'PUT');
                await axios.post(`/admin/postulantes/${currentId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setSuccessMessage(`¡Los datos de ${formData.nombre} fueron actualizados correctamente!`);
                setCurrentView('list');
                fetchPostulantes(meta.current_page || 1);

            } else {
                const response = await axios.post('/admin/postulantes', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setSuccessMessage('¡Postulante registrado correctamente!');
                setCurrentView('list');
                fetchPostulantes(1);

                if (response.data.id_postulante) {
                    window.open(`/preinscripcion/comprobante/${response.data.id_postulante}`, '_blank');
                }
            }
        } catch (error) {
            console.error("Error guardando:", error);
            alert(error.response?.data?.message || "Ocurrió un error al procesar la solicitud.");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id, ci) => {
        if (confirm(`¿Estás seguro de eliminar permanentemente al C.I. ${ci}?`)) {
            try {
                await axios.delete(`/admin/postulantes/${id}`);
                setSuccessMessage('Postulante eliminado correctamente.');
                fetchPostulantes(meta.current_page || 1);
            } catch (error) {
                console.error("Error eliminando:", error);
            }
        }
    };

    const getNombreCarrera = (id) => {
        const carrera = CARRERAS_FICCT.find(c => c.id === parseInt(id));
        return carrera ? carrera.nombre : `ID: ${id}`;
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-black text-blue-900 tracking-wide">Gestión de Postulantes</h2>}>
            <Head title="Gestionar Postulantes" />

            <div className="py-8 max-w-[90rem] mx-auto sm:px-6 lg:px-8 space-y-6">

                {successMessage && currentView === 'list' && (
                    <div className="bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded shadow-sm flex justify-between items-center animate-pulse">
                        <p className="font-bold">{successMessage}</p>
                        <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-900 font-black">&times;</button>
                    </div>
                )}

                {/* ==========================================
                    VISTA 1:Listado de Datos de Postulantes con Paginación, Búsqueda y Filtros
                ========================================== */}
                {currentView === 'list' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="bg-white p-5 shadow-sm rounded border-t-4 border-blue-900 flex flex-wrap gap-4 items-end justify-between">
                            <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-black text-blue-900 uppercase tracking-wide">C.I.</label>
                                    <input type="text" className="mt-1 block w-32 rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500" value={filters.ci} onChange={e => setFilters({ ...filters, ci: e.target.value })} placeholder="C.I." />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-blue-900 uppercase tracking-wide">Nombre / Apellido</label>
                                    <input type="text" className="mt-1 block w-48 rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500" value={filters.nombre} onChange={e => setFilters({ ...filters, nombre: e.target.value })} placeholder="Nombre / Apellido" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-blue-900 uppercase tracking-wide">Estado Pago</label>
                                    <select className="mt-1 block w-32 rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500" value={filters.estado_pago} onChange={e => setFilters({ ...filters, estado_pago: e.target.value })}>
                                        <option value="">Todos</option>
                                        <option value="APROBADO">Aprobado</option>
                                        <option value="PENDIENTE">Pendiente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-blue-900 uppercase tracking-wide">Gestión</label>
                                    <select className="mt-1 block w-36 rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 font-bold" value={filters.gestion} onChange={e => setFilters({ ...filters, gestion: e.target.value })}>
                                        <option value="">Todos</option>
                                        <option value="202501">2025 - Gestión 1</option>
                                        <option value="202502">2025 - Gestión 2</option>
                                        <option value="202601">2026 - Gestión 1</option>
                                        <option value="202602">2026 - Gestión 2</option>
                                        <option value="202701">2027 - Gestión 1</option>
                                        <option value="202702">2027 - Gestión 2</option>
                                        <option value="202801">2028 - Gestión 1</option>
                                        <option value="202802">2028 - Gestión 2</option>
                                    </select>
                                </div>
                                <button type="submit" className="bg-slate-900 text-white px-5 py-2 rounded text-sm font-bold hover:bg-slate-800 transition shadow">
                                    Filtrar
                                </button>
                            </form>

                            <button onClick={openCreateView} className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-bold hover:bg-blue-700 shadow transition flex items-center gap-2">
                                + Registrar Postulante
                            </button>
                        </div>

                        <div className="bg-white shadow-sm rounded border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-700">
                                    <thead className="bg-gray-50 text-[11px] text-blue-900 uppercase font-black border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3">Identidad del Postulante</th>
                                            <th className="px-5 py-3">Datos de Contacto</th>
                                            <th className="px-5 py-3">Postulación (Carrera)</th>
                                            <th className="px-5 py-3">Estado Pago</th>
                                            <th className="px-5 py-3">Documentos</th>
                                            <th className="px-5 py-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr><td colSpan="6" className="text-center py-10 font-bold text-gray-400">Cargando registros...</td></tr>
                                        ) : postulantes.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-10 font-bold text-gray-400">No hay postulantes que coincidan con la búsqueda.</td></tr>
                                        ) : (
                                            postulantes.map((post) => (
                                                <tr key={post.id_postulante} className="hover:bg-blue-50/30 transition">

                                                    {/* COL 1: IDENTIDAD */}
                                                    <td className="px-5 py-3">
                                                        <div className="font-bold text-slate-800 uppercase">{post.apellidos} {post.nombre}</div>
                                                        <div className="text-xs text-gray-600 font-mono mt-0.5">C.I.: <span className="font-bold text-blue-800">{post.ci}</span></div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5 uppercase">NACIMIENTO: {post.fecha_nacimiento || '-'} |  SEXO: ({post.sexo === 'M' ? 'MASCULINO' : 'FEMENINO'})</div>
                                                    </td>

                                                    {/* COL 2: CONTACTO Y COLEGIO */}
                                                    <td className="px-5 py-3">
                                                        <div className="text-xs font-semibold text-slate-700"> {post.telefono || 'S/N'}</div>
                                                        <div className="text-[11px] text-blue-600 font-medium"> {post.correo || 'S/N'}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1 pt-1 border-t border-gray-100 uppercase truncate max-w-[200px]">
                                                            {post.nombre_colegio || 'COLEGIO NO REGISTRADO'}
                                                        </div>
                                                    </td>

                                                    {/* COL 3: CARRERAS */}
                                                    <td className="px-5 py-3">
                                                        <div className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-1 rounded inline-block border border-blue-100 mb-1">
                                                            Opción 1: {getNombreCarrera(post.id_carrera_1)}
                                                        </div>
                                                        {post.id_carrera_2 && (
                                                            <div className="text-[10px] text-gray-500 px-1 font-semibold truncate max-w-[250px]">
                                                                Opción 2: {getNombreCarrera(post.id_carrera_2)}
                                                            </div>
                                                        )}
                                                        <div className="text-[9px] font-bold text-gray-400 uppercase mt-1">Modalidad: {post.modalidad}</div>
                                                    </td>

                                                    {/* COL 4: FINANCIERO */}
                                                    <td className="px-5 py-3">
                                                        <div className={`text-[10px] font-black px-2 py-1 rounded w-fit ${post.estado_pago === 'APROBADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                            {post.estado_pago}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-slate-700 mt-1 uppercase">USD {post.monto || '0.00'} ({post.metodo_pago})</div>
                                                        <div className="text-[9px] text-gray-400 font-mono uppercase mt-0.5 truncate max-w-[120px]">Trx: {post.transaccion_id || '-'}</div>
                                                    </td>
                                                        
                                                    {/* COL 5: DOCUMENTOS */}
<td className="px-5 py-3">
  <div className="flex flex-col gap-1.5">
    {post.ruta_cedula ? (
      <a
        href={post.ruta_cedula}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] py-1 px-2 rounded border border-blue-200 transition"
      >
        📄 Cédula
      </a>
    ) : (
      <span className="text-[10px] text-gray-300 font-bold text-center">
        Sin cédula
      </span>
    )}

    {post.ruta_bachiller ? (
      <a
        href={post.ruta_bachiller}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] py-1 px-2 rounded border border-emerald-200 transition"
      >
        🎓 Bachiller
      </a>
    ) : (
      <span className="text-[10px] text-gray-300 font-bold text-center">
        Sin bachiller
      </span>
    )}
  </div>
</td>


                                                    {/* COL 5: ACCIONES */}
                                                    <td className="px-5 py-3 flex flex-col items-center justify-center gap-2">
                                                        <a href={`/preinscripcion/comprobante/${post.id_postulante}`} target="_blank" rel="noreferrer" className="w-full text-center bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold text-[10px] py-1 px-2 rounded border border-gray-300 transition" title="Imprimir Comprobante">
                                                            COMPROBANTE
                                                        </a>
                                                        <div className="flex gap-2 w-full justify-between">
                                                            <button onClick={() => openEditView(post)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] py-1 px-2 rounded border border-blue-200 transition">
                                                                Editar
                                                            </button>
                                                            <button onClick={() => handleDelete(post.id_postulante, post.ci)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] py-1 px-2 rounded border border-red-200 transition">
                                                                Borrar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {!loading && meta.last_page > 1 && (
                                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
                                    <span className="text-xs text-gray-500 font-bold uppercase">Página {meta.current_page} de {meta.last_page}</span>
                                    <div className="space-x-2">
                                        <button disabled={meta.current_page === 1} onClick={() => fetchPostulantes(meta.current_page - 1)} className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold disabled:opacity-50 hover:bg-gray-100 text-slate-700 shadow-sm">Anterior</button>
                                        <button disabled={meta.current_page === meta.last_page} onClick={() => fetchPostulantes(meta.current_page + 1)} className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold disabled:opacity-50 hover:bg-gray-100 text-slate-700 shadow-sm">Siguiente</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ==========================================
                    VISTA 2: FORMULARIO (CREAR / EDITAR)
                ========================================== */}
                {(currentView === 'create' || currentView === 'edit') && (
                    <div className="bg-white shadow-sm rounded border border-gray-200 overflow-hidden animate-fade-in-up">
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <span className="text-blue-400">{currentView === 'edit' ? 'ACTUALIZAR DATOS' : 'REGISTRAR'}</span>
                                {currentView === 'edit' ? `Postulante: ${formData.ci}` : 'Nuevo Postulante'}
                            </h3>
                            <button onClick={closeForm} className="text-gray-300 hover:text-white font-bold text-sm bg-slate-800 hover:bg-red-600 px-4 py-1.5 rounded transition">
                                Cancelar y Volver
                            </button>
                        </div>

                        <div className="p-8">
                            <form id="postulanteForm" onSubmit={handleSubmit} className="space-y-8">

                                {/* 1. DATOS PERSONALES */}
                                <div>
                                    <h4 className="text-sm font-black text-blue-900 mb-4 uppercase tracking-wider border-b-2 border-blue-100 pb-2">1. Datos Personales</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Cédula de Identidad *</label>
                                            <input required type="text" name="ci" value={formData.ci} onChange={handleInputChange}
                                                readOnly={currentView === 'edit'}
                                                className={`w-full mt-1 text-sm rounded border-gray-300 ${currentView === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-blue-500'}`}
                                            />
                                        </div>

                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Nombres *</label><input required type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 uppercase focus:ring-blue-500" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Apellidos *</label><input required type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 uppercase focus:ring-blue-500" /></div>

                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha Nacimiento *</label><input required type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Género</label><select name="sexo" value={formData.sexo} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500"><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Teléfono *</label><input required type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500" /></div>

                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico *</label>
                                            <input required type="email" name="correo" value={formData.correo} onChange={handleInputChange}
                                                className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Ciudad</label><input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 uppercase focus:ring-blue-500" /></div>

                                        <div className="md:col-span-3"><label className="text-xs font-bold text-gray-500 uppercase">Dirección</label><input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500" /></div>
                                    </div>
                                </div>

                                {/* 2. DATOS ACADÉMICOS */}
                                <div>
                                    <h4 className="text-sm font-black text-blue-900 mb-4 uppercase tracking-wider border-b-2 border-blue-100 pb-2">2. Historial Académico y Carrera</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Colegio de Egreso</label><input type="text" name="nombre_colegio" value={formData.nombre_colegio} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 uppercase focus:ring-blue-500" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Código RUDE / Bachiller</label><input type="text" name="codigo_bachiller" value={formData.codigo_bachiller} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500" /></div>

                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Tipo Colegio</label><select name="tipo_colegio" value={formData.tipo_colegio} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500"><option value="FISCAL">Fiscal</option><option value="PARTICULAR">Particular</option><option value="CONVENIO">Convenio</option></select></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Turno</label><select name="turno" value={formData.turno} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500"><option value="MAÑANA">Mañana</option><option value="TARDE">Tarde</option><option value="NOCHE">Noche</option></select></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha de Egreso</label><input type="date" name="fecha_bachiller" value={formData.fecha_bachiller} onChange={handleInputChange} className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500" /></div>

                                        {/* MENÚS DESPLEGABLES PARA CARRERAS */}
                                        <div className="bg-blue-50 p-4 rounded border border-blue-100 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-xs font-black text-blue-900 uppercase">1ra Opción (Carrera) *</label>
                                                <select required name="id_carrera_1" value={formData.id_carrera_1} onChange={handleInputChange}
                                                    disabled={currentView === 'edit'}
                                                    className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500">
                                                    <option value="" disabled>-- Seleccione una Carrera --</option>
                                                    {CARRERAS_FICCT.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-black text-blue-900 uppercase">2da Opción (Carrera)</label>
                                                <select name="id_carrera_2" value={formData.id_carrera_2 || ''} onChange={handleInputChange}
                                                    disabled={currentView === 'edit'}
                                                    className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500">

                                                    <option value="">-- Ninguna (Opcional) --</option>
                                                    {CARRERAS_FICCT.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-black text-blue-900 uppercase">Modalidad</label>
                                                <select name="modalidad" value={formData.modalidad} onChange={handleInputChange}
                                                    disabled={currentView === 'edit'}
                                                    className="w-full mt-1 text-sm rounded border-gray-300 focus:ring-blue-500"><option value="PRESENCIAL">Presencial</option><option value="VIRTUAL">Virtual</option></select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. PAGO Y ARCHIVOS */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-8">
                                    {/* Información de Pago */}
                                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                                        <h4 className="text-sm font-black text-blue-900 mb-4 uppercase tracking-wider border-b-2 border-blue-100 pb-2">
                                            3. Información de Pago
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Monto Cancelado (USD) *</label>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    name="monto"
                                                    value={formData.monto}
                                                    onChange={handleInputChange}
                                                    readOnly={currentView === 'edit'}
                                                    className={`w-full mt-1 text-sm rounded border-gray-300 ${currentView === 'edit' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-blue-500'}`}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Método</label>
                                                    <select
                                                        name="metodo_pago"
                                                        value={formData.metodo_pago}
                                                        onChange={handleInputChange}
                                                        disabled={currentView === 'edit'}
                                                        className="w-full mt-1 text-sm rounded border-gray-300 disabled:bg-gray-100"
                                                    >
                                                        <option value="CAJA_FICCT">Ventanilla FICCT</option>
                                                        <option value="PAYPAL">PayPal</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                                                    <select
                                                        name="estado_pago"
                                                        value={formData.estado_pago}
                                                        onChange={handleInputChange}
                                                        disabled={currentView === 'edit'}
                                                        className="w-full mt-1 text-sm rounded border-gray-300 disabled:bg-gray-100"
                                                    >
                                                        <option value="APROBADO">Aprobado</option>
                                                        <option value="PENDIENTE">Pendiente</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {currentView === 'edit' && (
                                                <p className="text-[10px] text-gray-400 font-bold">
                                                    * La información financiera y el C.I. están bloqueados por seguridad.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Documentación Digital */}
                                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                                        <h4 className="text-sm font-black text-blue-900 mb-4 uppercase tracking-wider border-b-2 border-blue-100 pb-2">
                                            4. Documentación Digital
                                        </h4>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Actualizar Cédula (.jpg, .pdf)</label>
                                                <input
                                                    type="file"
                                                    name="cedula"
                                                    onChange={handleInputChange}
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    className="block w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                />
                                                
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Actualizar Título / Libreta (.jpg, .pdf)</label>
                                                <input
                                                    type="file"
                                                    name="bachiller"
                                                    onChange={handleInputChange}
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    className="block w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                />
                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTONES DE ACCIÓN */}
                                <div className="border-t border-gray-200 pt-6 flex justify-end gap-4">
                                    <button type="button" onClick={closeForm} className="px-6 py-2 rounded text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition">
                                        Descartar Cambios
                                    </button>
                                    <button type="submit" disabled={processing} className="bg-slate-900 text-white px-8 py-2 rounded shadow text-sm font-black tracking-wide hover:bg-slate-800 disabled:opacity-50 transition">
                                        {processing ? 'Procesando...' : (currentView === 'edit' ? '✔ Guardar Actualización' : '🚀 Registrar y Generar Comprobante')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
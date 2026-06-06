import React, { useState } from 'react';

export default function PasoAcademico({ data, setData, errors, onBack, onNext }) {
    const [localError, setLocalError] = useState(null);

    // Manejador EXCLUSIVO del archivo de respaldo escolar (Paso 2)
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setData('foto_bachiller', e.target.files[0]);
            setLocalError(null);
        }
    };

    // Validador de negocio antes de ir a PayPal (Paso 3)
    const handleNextStep = (e) => {
        e.preventDefault();
        setLocalError(null);

        // 1. Evitar la colisión de carreras idénticas
        if (data.id_carrera_1 === data.id_carrera_2) {
            setLocalError("Tu Primera y Segunda opción de carrera no pueden ser la misma. Por favor, selecciona ingenierías distintas.");
            return;
        }

        // 2. Controlar la existencia física del archivo ANTES de levantar la pasarela
        if (!data.foto_bachiller) {
            setLocalError("Es obligatorio adjuntar un respaldo digital (Foto o PDF) de tu libreta o título de bachiller.");
            return;
        }

        // Transición segura al orquestador padre
        onNext();
    };

    return (
        <form onSubmit={handleNextStep} className="space-y-6">
            <div className="border-b border-slate-800 pb-2 mb-4">
                <h3 className="text-lg font-semibold text-blue-400 tracking-wider">Paso 2: Datos Académicos</h3>
                <p className="text-xs text-gray-400">Información de tu educación secundaria, respaldo digital y modalidad del CUP.</p>
            </div>

            {/* Panel de Advertencias Locales */}
            {localError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-medium animate-pulse">
                    ⚠️ {localError}
                </div>
            )}

            {/* SECCIÓN 1: DATOS DEL COLEGIO */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información de Bachillerato</h4>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Código de Bachiller / RUDE</label>
                        <input
                            type="number"
                            value={data.codigo_bachiller}
                            onChange={e => setData('codigo_bachiller', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-white transition"
                            placeholder="Ej: 81234567"
                            required
                        />
                        {errors.codigo_bachiller && <p className="text-red-500 text-xs mt-1">{errors.codigo_bachiller}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Fecha Emisión Libreta/Título</label>
                        <input
                            type="date"
                            value={data.fecha_bachiller}
                            onChange={e => setData('fecha_bachiller', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-white transition style-color-scheme-dark"
                            required
                        />
                        {errors.fecha_bachiller && <p className="text-red-500 text-xs mt-1">{errors.fecha_bachiller}</p>}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nombre del Colegio</label>
                        <input
                            type="text"
                            value={data.nombre_colegio}
                            onChange={e => setData('nombre_colegio', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-white transition"
                            placeholder="Ej: Nacional Florida"
                            required
                        />
                        {errors.nombre_colegio && <p className="text-red-500 text-xs mt-1">{errors.nombre_colegio}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tipo de Colegio</label>
                        <select
                            value={data.tipo_colegio}
                            onChange={e => setData('tipo_colegio', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-white transition"
                            required
                        >
                            <option value="">Seleccione...</option>
                            <option value="Fiscal">Fiscal</option>
                            <option value="Particular">Particular</option>
                            <option value="Convenio">De Convenio</option>
                        </select>
                        {errors.tipo_colegio && <p className="text-red-500 text-xs mt-1">{errors.tipo_colegio}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Turno de Estudio</label>
                        <select
                            value={data.turno}
                            onChange={e => setData('turno', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-white transition"
                            required
                        >
                            <option value="">Seleccione...</option>
                            <option value="Mañana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noche">Noche</option>
                        </select>
                        {errors.turno && <p className="text-red-500 text-xs mt-1">{errors.turno}</p>}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CARGA DIGITAL DE DOCUMENTACIÓN RESPALDO */}
            <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase text-gray-400">Documento de Respaldo Académico</label>
                <div className="p-4 bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-purple-500 transition rounded-xl text-center group cursor-pointer relative overflow-hidden">
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, application/pdf" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        required={!data.foto_bachiller}
                    />
                    <div className="flex items-center justify-center space-x-3 pointer-events-none">
                        <span className="p-2 bg-purple-500/10 rounded-lg text-purple-400 text-lg group-hover:scale-110 transition-transform">
                            📁
                        </span>
                        <span className="text-xs font-semibold text-gray-300">
                            {data.foto_bachiller ? (
                                <span className="text-emerald-400">Respaldado: {data.foto_bachiller.name}</span>
                            ) : (
                                "Cargar Título de Bachiller o Libreta de Secundaria"
                            )}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 pointer-events-none">Formatos admitidos: JPG, PNG o PDF. Máximo 4MB.</p>
                </div>
            </div>

            {/* SECCIÓN 3: SELECCIÓN DE CARRERAS (BIGINT COMPATIBLE) */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selección de Oferta Académica</h4>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                        <label className="block text-xs font-bold uppercase text-blue-400 mb-2">Primera Opción de Carrera</label>
                        <select
                            value={data.id_carrera_1}
                            onChange={e => setData('id_carrera_1', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white transition"
                            required
                        >
                            <option value="">Seleccione carrera principal...</option>
                            <option value="1874">Ingeniería de Sistemas (187-4)</option>
                            <option value="1875">Ingeniería en Redes y Telecomunicaciones (187-5)</option>
                            <option value="1876">Ingeniería Informática (187-6)</option>
                            <option value="3230">Ingeniería en Robótica (323-0)</option>
                        </select>
                        {errors.id_carrera_1 && <p className="text-red-500 text-xs mt-1">{errors.id_carrera_1}</p>}
                    </div>

                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                        <label className="block text-xs font-bold uppercase text-purple-400 mb-2">Segunda Opción de Carrera</label>
                        <select
                            value={data.id_carrera_2}
                            onChange={e => setData('id_carrera_2', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-purple-500 outline-none text-white transition"
                            required
                        >
                            <option value="">Seleccione carrera alternativa...</option>
                            <option value="1874">Ingeniería de Sistemas (187-4)</option>
                            <option value="1875">Ingeniería en Redes y Telecomunicaciones (187-5)</option>
                            <option value="1876">Ingeniería Informática (187-6)</option>
                            <option value="3230">Ingeniería en Robótica (323-0)</option>
                        </select>
                        {errors.id_carrera_2 && <p className="text-red-500 text-xs mt-1">{errors.id_carrera_2}</p>}
                    </div>
                </div>

                {/* SELECTOR ASISTENCIAL DE MODALIDAD */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 mt-2">
                    <label className="block text-xs font-bold uppercase text-emerald-400 mb-2">Modalidad de Asistencia del Curso</label>
                    <select
                        value={data.modalidad}
                        onChange={e => setData('modalidad', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none text-white transition"
                        required
                    >
                        <option value="">Seleccione la modalidad de asistencia...</option>
                        <option value="PRESENCIAL">Presencial (Clases físicas en los módulos de la FICCT)</option>
                        <option value="VIRTUAL">Virtual (Plataforma Educativa Moodle / Zoom)</option>
                    </select>
                    {errors.modalidad && <p className="text-red-500 text-xs mt-1">{errors.modalidad}</p>}
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
                <button
                    type="button"
                    onClick={onBack}
                    className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors border border-slate-700 text-xs uppercase tracking-wider"
                >
                    ← Volver
                </button>
                <button
                    type="submit"
                    className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
                >
                    Avanzar a Pasarela de Pago →
                </button>
            </div>
        </form>
    );
}
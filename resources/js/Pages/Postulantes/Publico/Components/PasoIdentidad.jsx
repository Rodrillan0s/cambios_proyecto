import React, { useState } from 'react';
import axios from 'axios';

export default function PasoIdentidad({ data, setData, errors, clearErrors, onSuccessIA }) {
    const [isScanning, setIsScanning] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [iaSuccessMsg, setIaSuccessMsg] = useState(null);

    const handleFileChange = (e) => {
        setData('foto_cedula', e.target.files[0]);
        clearErrors('foto_cedula');
    };

    const handleValidarIA = async (e) => {
        e.preventDefault();
        setLocalError(null);
        clearErrors();

        if (!data.ci || !data.fecha_nacimiento || !data.foto_cedula) {
            setLocalError("Debes completar tu C.I., Fecha de Nacimiento y adjuntar la foto de tu Cédula para la validación.");
            return;
        }

        setIsScanning(true);

        const formData = new FormData();
        formData.append('ci', data.ci);
        formData.append('fecha_nacimiento', data.fecha_nacimiento);
        formData.append('foto_cedula', data.foto_cedula);
        // Aquí viaja SOLO la Cédula. Perfecto.

        try {
            const response = await axios.post(route('postulantes.validar.ia'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setIaSuccessMsg(response.data.message);
                setTimeout(() => {
                    onSuccessIA();
                }, 1500);
            }
        } catch (error) {
            if (error.response && error.response.status === 422) {
                if (error.response.data.message) {
                    setLocalError(error.response.data.message);
                } else if (error.response.data.errors) {
                    const firstError = Object.values(error.response.data.errors)[0][0];
                    setLocalError(firstError);
                }
            } else {
                setLocalError("Error de conexión con el motor de Inteligencia Artificial.");
            }
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <form onSubmit={handleValidarIA} className="space-y-5">
            <div className="border-b border-slate-800 pb-2 mb-4">
                <h3 className="text-lg font-semibold text-blue-400 tracking-wider">Paso 1: Identidad Digital</h3>
                <p className="text-xs text-gray-400">Tus datos personales y validación biométrica perimetral mediante IA.</p>
            </div>

            {localError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">❌ {localError}</div>}
            {iaSuccessMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium">✅ {iaSuccessMsg} Redirigiendo...</div>}

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Cédula de Identidad (C.I.)</label>
                    <input type="text" value={data.ci} onChange={e => setData('ci', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-white transition" placeholder="Ej: 1234567" required />
                    {errors.ci && <p className="text-red-500 text-xs mt-1">{errors.ci}</p>}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nombres</label>
                        <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Apellidos</label>
                        <input type="text" value={data.apellidos} onChange={e => setData('apellidos', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                        {errors.apellidos && <p className="text-red-500 text-xs mt-1">{errors.apellidos}</p>}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Fecha Nacimiento</label>
                    <input type="date" value={data.fecha_nacimiento} onChange={e => setData('fecha_nacimiento', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white transition style-color-scheme-dark" required />
                    {errors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento}</p>}
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Sexo</label>
                    <select value={data.sexo} onChange={e => setData('sexo', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required>
                        <option value="">Seleccione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Teléfono Móvil</label>
                    <input type="text" value={data.telefono} onChange={e => setData('telefono', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Correo Electrónico</label>
                    <input type="email" value={data.correo} onChange={e => setData('correo', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Ciudad de Residencia</label>
                    <input type="text" value={data.ciudad} onChange={e => setData('ciudad', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" placeholder="Ej: Santa Cruz de la Sierra" required />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Dirección Domiciliaria</label>
                <textarea value={data.direccion} onChange={e => setData('direccion', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white h-20 resize-none" required />
            </div>

            <div className="mt-6 p-4 md:p-6 bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-blue-500 transition rounded-2xl text-center group cursor-pointer relative overflow-hidden">
                <input type="file" accept="image/png, image/jpeg, image/jpg, application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={!data.foto_cedula} />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="p-3 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-300">{data.foto_cedula ? <span className="text-emerald-400">📄 Archivo cargado: {data.foto_cedula.name}</span> : "Sube la foto o PDF de tu Cédula de Identidad"}</span>
                    <span className="text-xs text-gray-500">Formato JPG, PNG o PDF. Máximo 4MB.</span>
                </div>
            </div>

            <div className="pt-4">
                <button type="submit" disabled={isScanning || iaSuccessMsg} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-3 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                    {isScanning ? <span>Verificando documento...</span> : iaSuccessMsg ? "✔ Identidad Verificada" : "Valida tu identidad para continuar al siguiente paso"}
                </button>
            </div>
        </form>
    );
}
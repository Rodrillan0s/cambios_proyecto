import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PasoIdentidad from './Components/PasoIdentidad';
import PasoAcademico from './Components/PasoAcademico';
import PasoPago from './Components/PasoPago';

export default function PreInscripcion({ carreras, paypalClientId, comprobanteId, usuarioGenerado, ciGenerado }) {
    console.log("CLIENT ID RECIBIDO DE LARAVEL:", paypalClientId);
    const [step, setStep] = useState(() => {
        const savedStep = localStorage.getItem('cup_preinscripcion_step');
        return savedStep ? parseInt(savedStep, 10) : 1;
    });

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        ci: '', nombre: '', apellidos: '', fecha_nacimiento: '', sexo: '', 
        direccion: '', telefono: '', correo: '', ciudad: '',
        foto_cedula: null,    // Archivo del Paso 1
        foto_bachiller: null, // Archivo del Paso 2
        codigo_bachiller: '', fecha_bachiller: '', nombre_colegio: '', tipo_colegio: '', turno: '',
        id_carrera_1: '', id_carrera_2: '',
        modalidad: '',  
        paypal_order_id: '',    
        paypal_monto: '70.00'
    });

    // Restaurar SOLO los textos del localStorage para evitar corromper los archivos en memoria RAM
    useEffect(() => {
        const savedData = localStorage.getItem('cup_preinscripcion_data');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            Object.keys(parsedData).forEach(key => {
                if (key !== 'foto_cedula' && key !== 'foto_bachiller') {
                    setData(key, parsedData[key]);
                }
            });
        }
    }, []);

    // Guardar silenciosamente los textos, excluyendo los archivos binarios
    useEffect(() => {
        const { foto_cedula, foto_bachiller, ...datosSerializables } = data;
        localStorage.setItem('cup_preinscripcion_data', JSON.stringify(datosSerializables));
    }, [data]);

    useEffect(() => {
        localStorage.setItem('cup_preinscripcion_step', step.toString());
    }, [step]);

    // Intentar abrir el comprobante en una nueva pestaña si se detecta comprobanteId
    useEffect(() => {
        if (comprobanteId) {
            localStorage.removeItem('cup_preinscripcion_data');
            localStorage.removeItem('cup_preinscripcion_step');
            try {
                window.open(route('postulantes.comprobante', comprobanteId), '_blank');
            } catch (e) {
                console.error("Popup bloqueado por el navegador:", e);
            }
        }
    }, [comprobanteId]);

    // Función de envío definitivo al Backend
    const handleFinalizarRegistro = (orderId) => {
        console.log("ORDER ID PAYPAL:", orderId);
        data.paypal_order_id = orderId;

        console.log("DATA COMPLETA ENVIANDO AL BACKEND:", data);
        post(route('postulantes.store.publico'), {
            forceFormData: true,  // Obliga a Inertia a empaquetar los archivos físicos correctamente
            preserveScroll: true,
            onSuccess: () => {
                localStorage.removeItem('cup_preinscripcion_data');
                localStorage.removeItem('cup_preinscripcion_step');
            },
            onError: (err) => {
                console.error("Errores devueltos por el servidor:", err);
                if (err.ci || err.error) {
                    localStorage.removeItem('cup_preinscripcion_data');
                    localStorage.removeItem('cup_preinscripcion_step');
                    setStep(1);
                }
            }
        });
    };

    const handleCancelarProgreso = () => {
        if (confirm("¿Seguro que deseas cancelar tu registro actual y borrar los datos ingresados?")) {
            localStorage.removeItem('cup_preinscripcion_data');
            localStorage.removeItem('cup_preinscripcion_step');
            window.location.reload();
        }
    };

    // PANTALLA DE ÉXITO FINAL
    if (comprobanteId) {
        return (
            <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col relative">
                <Head title="Inscripción Exitosa - CUP UAGRM" />
                
                <header className="w-full bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
                    <div className="max-w-5xl mx-auto flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-wider text-white font-black">
                                CUP <span className="text-blue-500 font-black">FICCT</span>
                            </span>
                            <span className="text-xs text-gray-300">Universidad Autónoma Gabriel René Moreno</span>
                        </div>
                    </div>
                </header>

                <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10 animate-fade-in-up">
                    <div className="w-full max-w-xl bg-white border border-gray-200 p-8 rounded-2xl shadow-xl text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner font-bold">
                            ✓
                        </div>
                        <h2 className="text-2xl font-black text-blue-900 uppercase tracking-wide">¡Inscripción Exitosa!</h2>
                        <p className="text-gray-600 text-sm">
                            Tu registro se ha completado correctamente en el sistema. El comprobante de inscripción ha sido generado.
                        </p>

                        {/* PANEL DE CREDENCIALES GENERADAS */}
                        {usuarioGenerado && (
                            <div className="p-5 bg-slate-50 border border-gray-200 rounded-2xl text-left space-y-3">
                                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider border-b border-gray-200 pb-1.5">
                                    🔑 Tus Credenciales de Acceso Académico
                                </h3>
                                <div className="space-y-2 text-xs text-slate-700">
                                    <div>
                                        <span className="font-bold text-slate-500 uppercase block">Usuario:</span>
                                        <code className="text-sm font-bold font-mono bg-white border border-gray-300 px-2 py-1 rounded block mt-0.5 select-all text-blue-900">
                                            {usuarioGenerado}
                                        </code>
                                    </div>
                                    <div className="pt-1">
                                        <span className="font-bold text-slate-500 uppercase block">Contraseña Temporal:</span>
                                        <code className="text-sm font-bold font-mono bg-white border border-gray-300 px-2 py-1 rounded block mt-0.5 select-all text-blue-900">
                                            {ciGenerado}
                                        </code>
                                    </div>
                                </div>
                                <p className="text-[10px] text-amber-600 font-bold leading-relaxed pt-1.5">
                                    ⚠️ Nota: Al iniciar sesión por primera vez, el sistema te obligará a cambiar esta contraseña temporal por tu propia seguridad.
                                </p>
                            </div>
                        )}
                        
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                            <span className="font-bold">Nota importante:</span> Si el comprobante no se abrió automáticamente en una nueva pestaña de tu navegador, haz clic en el botón azul para visualizarlo o imprimirlo.
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <a 
                                href={route('postulantes.comprobante', comprobanteId)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition text-sm uppercase tracking-wider flex justify-center items-center gap-2 shadow-md shadow-blue-500/20"
                            >
                                📄 Abrir Comprobante
                            </a>
                            <button 
                                onClick={() => {
                                    window.location.href = '/';
                                }} 
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition text-sm uppercase tracking-wider border border-slate-200"
                            >
                                Salir al Inicio
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="text-center py-6 text-xs text-gray-500 border-t border-gray-200 bg-white z-10 font-bold uppercase">
                    Facultad de Ciencias de la Computación y Telecomunicaciones - UAGRM © 2026
                </footer>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col relative">
            <Head title="Preinscripción Digital CUP - UAGRM" />

            <header className="w-full bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-wider text-white font-black">
                            CUP <span className="text-blue-500 font-black">FICCT</span>
                        </span>
                        <span className="text-xs text-gray-300">Universidad Autónoma Gabriel René Moreno</span>
                    </div>
                    {step > 1 && (
                        <button onClick={handleCancelarProgreso} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition mr-4 font-bold shadow-sm uppercase tracking-wide">
                            Reiniciar Formulario
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10">
                <div className="w-full max-w-4xl bg-white border border-gray-200 p-6 md:p-10 rounded-2xl shadow-xl">
                    
                    {step > 1 && (
                        <div className="mb-4 p-2.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-xs text-center font-bold">
                            💡 Los datos de texto se han mantenido a salvo. Si regresas de paso, recuerda volver a adjuntar tus documentos PDF/Imagen por seguridad.
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4 text-xs md:text-sm">
                        <span className={`font-black uppercase tracking-wide pb-4 transition-colors ${step === 1 ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-400'}`}>1. Identidad & IA</span>
                        <span className={`font-black uppercase tracking-wide pb-4 transition-colors ${step === 2 ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-400'}`}>2. Datos Académicos</span>
                        <span className={`font-black uppercase tracking-wide pb-4 transition-colors ${step === 3 ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-400'}`}>3. Pago y Cierre</span>
                    </div>

                    {errors.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-bold">
                            {errors.error}
                        </div>
                    )}

                    {/* Alertas si Laravel rechaza la subida de los archivos */}
                    {errors.foto_cedula && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-bold">
                            ❌ Error en Documento de Identidad: {errors.foto_cedula}
                        </div>
                    )}
                    {errors.foto_bachiller && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-bold">
                            ❌ Error en Documento de Bachiller: {errors.foto_bachiller}
                        </div>
                    )}

                    <div className={step === 1 ? 'block' : 'hidden'}>
                        <PasoIdentidad data={data} setData={setData} errors={errors} clearErrors={clearErrors} onSuccessIA={() => setStep(2)} />
                    </div>

                    <div className={step === 2 ? 'block' : 'hidden'}>
                        <PasoAcademico data={data} setData={setData} errors={errors} carreras={carreras} onBack={() => setStep(1)} onNext={() => setStep(3)} />
                    </div>

                    <div className={step === 3 ? 'block' : 'hidden'}>
                        <PasoPago data={data} setData={setData} processing={processing} errors={errors} paypalClientId={paypalClientId} onBack={() => setStep(2)} onSuccessPayment={handleFinalizarRegistro} />
                    </div>
                </div>
            </main>

            <footer className="text-center py-6 text-xs text-gray-500 border-t border-gray-200 bg-white z-10 font-bold uppercase">
                Facultad de Ciencias de la Computación y Telecomunicaciones - UAGRM © 2026
            </footer>
        </div>
    );
}
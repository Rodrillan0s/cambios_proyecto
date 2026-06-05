import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PasoIdentidad from './Components/PasoIdentidad';
import PasoAcademico from './Components/PasoAcademico';
import PasoPago from './Components/PasoPago';

export default function PreInscripcion({ carreras, paypalClientId }) {
    // Control de pasos persistente
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

    // Función de envío definitivo al Backend
    const handleFinalizarRegistro = (orderId) => {
         console.log("ORDER ID PAYPAL:", orderId);
        data.paypal_order_id = orderId;

       console.log("DATA COMPLETA:", data);
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

    return (
        <div className="min-h-screen bg-slate-900 text-gray-100 font-sans flex flex-col relative">
            <Head title="Preinscripción Digital CUP - UAGRM" />

            <header className="w-full bg-slate-950/80 border-b border-white/10 p-4 sticky top-0 z-50 backdrop-blur-md">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-wider text-white">
                            CUP <span className="text-red-500 font-black">FICCT</span>
                        </span>
                        <span className="text-xs text-gray-400">Universidad Autónoma Gabriel René Moreno</span>
                    </div>
                    {step > 1 && (
                        <button onClick={handleCancelarProgreso} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg transition mr-4 font-semibold">
                            Reiniciar Formulario
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10">
                <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 p-6 md:p-10 rounded-2xl shadow-2xl">
                    
                    {step > 1 && (
                        <div className="mb-4 p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs text-center font-medium animate-pulse">
                            (i) Los datos de texto se han mantenido a salvo. Si regresas de paso, recuerda volver a adjuntar tus documentos PDF/Imagen por seguridad.
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 text-xs md:text-sm">
                        <span className={`font-bold transition-colors ${step === 1 ? 'text-blue-500 border-b-2 border-blue-500 pb-4' : 'text-gray-500'}`}>1. Identidad & IA</span>
                        <span className={`font-bold transition-colors ${step === 2 ? 'text-blue-500 border-b-2 border-blue-500 pb-4' : 'text-gray-500'}`}>2. Datos Académicos</span>
                        <span className={`font-bold transition-colors ${step === 3 ? 'text-blue-500 border-b-2 border-blue-500 pb-4' : 'text-gray-500'}`}>3. Pago y Cierre</span>
                    </div>

                    {errors.error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold">
                            {errors.error}
                        </div>
                    )}

                    {/* Alertas si Laravel rechaza la subida de los archivos */}
                    {errors.foto_cedula && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold">
                            ❌ Error en Documento de Identidad: {errors.foto_cedula}
                        </div>
                    )}
                    {errors.foto_bachiller && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold">
                            ❌ Error en Documento de Bachiller: {errors.foto_bachiller}
                        </div>
                    )}

                    <div className={step === 1 ? 'block' : 'hidden'}>
                        <PasoIdentidad data={data} setData={setData} errors={errors} clearErrors={clearErrors} onSuccessIA={() => setStep(2)} />
                    </div>

                    <div className={step === 2 ? 'block' : 'hidden'}>
                        {/* Se añaden las carreras para que el selector funcione correctamente */}
                        <PasoAcademico data={data} setData={setData} errors={errors} carreras={carreras} onBack={() => setStep(1)} onNext={() => setStep(3)} />
                    </div>

                    <div className={step === 3 ? 'block' : 'hidden'}>
                        {/* Inyección directa de paypalClientId para cargar el SDK oficial */}
                        <PasoPago data={data}  setData={setData}  processing={processing} errors={errors} paypalClientId={paypalClientId} onBack={() => setStep(2)} onSuccessPayment={handleFinalizarRegistro} />
                    </div>
                </div>
            </main>

            <footer className="text-center py-6 text-xs text-gray-500 border-t border-slate-900 bg-slate-950 z-10">
                Facultad de Ciencias de la Computación y Telecomunicaciones - UAGRM © 2026
            </footer>
        </div>
    );
}
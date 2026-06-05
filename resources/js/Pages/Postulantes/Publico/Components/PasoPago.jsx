import React, { useEffect, useState } from 'react';

export default function PasoPago({ data, processing, errors, paypalClientId, onBack, onSuccessPayment }) {
    const [sdkReady, setSdkReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // 🔥 CANDADO DE SEGURIDAD: Verificamos si los archivos existen en la memoria RAM
    const archivosPerdidos = !data.foto_cedula || !data.foto_bachiller;

    useEffect(() => {
        // Si no hay archivos, ni siquiera intentamos cargar PayPal
        if (archivosPerdidos || !paypalClientId) return;

        if (window.paypal) {
            setSdkReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
        script.type = 'text/javascript';
        script.async = true;
        
        script.onload = () => setSdkReady(true);
        script.onerror = () => setErrorMessage("No se pudo conectar con los servidores seguros de PayPal.");
        
        document.body.appendChild(script);

        return () => {
            if (script && document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [paypalClientId, archivosPerdidos]);

    useEffect(() => {
        // Solo renderizamos los botones si el SDK cargó Y los archivos están intactos en memoria
        if (sdkReady && window.paypal && !archivosPerdidos) {
            const container = document.getElementById('paypal-button-container');
            if (container) container.innerHTML = '';

            window.paypal.Buttons({
                style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
                createOrder: (paypalData, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            description: "Matrícula Curso Preuniversitario (CUP) - FICCT",
                            amount: { currency_code: "USD", value: data.paypal_monto }
                        }]
                    });
                },
               onApprove: async (paypalData, actions) => {
    try {

        console.log("paypalData:", paypalData);

        const order = await actions.order.capture();

        console.log("ORDER:", order);
        console.log("ORDER ID:", order.id);

        onSuccessPayment(order.id);

    } catch (error) {
        console.error(error);
    }
},
                onError: (err) => {
                    console.error("PayPal Error:", err);
                    setErrorMessage("La pasarela de pago interrumpió la transacción de forma inesperada.");
                }
            }).render('#paypal-button-container');
        }
    }, [sdkReady, data.paypal_monto, archivosPerdidos]);

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-800 pb-2 mb-4 text-center">
                <h3 className="text-xl font-bold text-emerald-400 tracking-wider">Paso 3: Consolidación y Pago</h3>
                <p className="text-sm text-gray-400">Verifica tu importe y completa el pago mediante la pasarela segura.</p>
            </div>

            {/* ALERTA CRÍTICA: SI LOS ARCHIVOS SE PERDIERON POR RECARGAR LA PÁGINA */}
            {archivosPerdidos && (
                <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 text-amber-400 rounded-xl text-sm font-bold text-center animate-pulse">
                    ⚠️ Por seguridad, tus archivos se han borrado de la memoria al recargar la página. <br/>
                    <span className="text-xs font-normal text-amber-200 mt-2 block">
                        Debes retroceder al Paso 1 y Paso 2 para volver a adjuntar tu C.I. y tu Libreta de Bachiller antes de poder pagar.
                    </span>
                </div>
            )}

            {(errorMessage || errors.error) && !archivosPerdidos && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium text-center animate-pulse">
                    ⚠️ {errorMessage || errors.error}
                </div>
            )}

            <div className={`bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md mx-auto shadow-lg relative overflow-hidden ${archivosPerdidos ? 'opacity-50' : ''}`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                
                <h4 className="text-xs uppercase text-gray-400 font-bold mb-2">Concepto de Pago</h4>
                <p className="text-lg text-white font-medium mb-4 border-b border-slate-700/50 pb-4">
                    Matrícula - Curso Preuniversitario (CUP)
                </p>

                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-gray-400 font-semibold">Total a Pagar:</span>
                    <span className="text-4xl font-black text-white">{data.paypal_monto} <span className="text-lg text-emerald-400">USD</span></span>
                </div>
                
                <div className="mt-6 min-h-[150px] flex flex-col justify-center items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    {archivosPerdidos ? (
                        <div className="text-xs text-amber-500/50 uppercase font-black tracking-widest">
                            ACCESO BLOQUEADO
                        </div>
                    ) : processing ? (
                        <div className="flex flex-col items-center text-amber-400 space-y-3">
                            <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-semibold animate-pulse text-center">
                                Pago aprobado. <br/> Guardando documentos en el servidor...
                            </span>
                        </div>
                    ) : !sdkReady && !errorMessage ? (
                        <div className="text-xs text-gray-400 animate-pulse text-center">
                            Estableciendo conexión encriptada con PayPal...
                        </div>
                    ) : (
                        <div id="paypal-button-container" className="w-full relative z-20"></div>
                    )}
                </div>
            </div>

            <div className="max-w-md mx-auto pt-2 text-center flex flex-col space-y-3">
                <button type="button" onClick={onBack} disabled={processing} className="w-full bg-slate-800 text-gray-300 hover:text-white py-3 text-xs font-bold transition hover:bg-slate-700 rounded-xl shadow-lg border border-slate-700 disabled:opacity-50 uppercase tracking-widest">
                    ← Retroceder al paso anterior
                </button>
                
                {/* Botón rápido para limpiar datos atascados */}
                <button type="button" onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[10px] text-red-500/50 hover:text-red-400 underline">
                    Limpiar formulario y empezar de cero
                </button>
            </div>
        </div>
    );
}
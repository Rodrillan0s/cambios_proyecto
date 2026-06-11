import React, { useEffect, useState } from 'react';

export default function PasoPago({ data, setData, processing, errors, paypalClientId, onBack, onSuccessPayment }) {
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
                        const order = await actions.order.capture();
                        console.log("ORDER:", order);
                        console.log("ORDER ID:", order.id);

                        // 👇 Guardar el order.id en tu objeto data
                        setData('paypal_order_id', order.id);
                        setData('paypal_monto', order.purchase_units[0].amount.value);
                        onSuccessPayment(order.id); // si quieres disparar tu callback
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
            <div className="border-b border-gray-200 pb-2 mb-4 text-center">
                <h3 className="text-xl font-black text-blue-900 uppercase tracking-wider">Paso 3: Consolidación y Pago</h3>
                <p className="text-sm text-gray-500 font-semibold">Verifica tu importe y completa el pago mediante la pasarela segura.</p>
            </div>

            {/* ALERTA CRÍTICA: SI LOS ARCHIVOS SE PERDIERON POR RECARGAR LA PÁGINA */}
            {archivosPerdidos && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-bold text-center animate-pulse">
                    ⚠️ Por seguridad, tus archivos se han borrado de la memoria al recargar la página. <br />
                    <span className="text-xs font-semibold text-amber-700 mt-2 block">
                        Debes retroceder al Paso 1 y Paso 2 para volver a adjuntar tu C.I. y tu Libreta de Bachiller antes de poder pagar.
                    </span>
                </div>
            )}

            {(errorMessage || errors.error) && !archivosPerdidos && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-bold text-center animate-pulse">
                    ⚠️ {errorMessage || errors.error}
                </div>
            )}

            <div className={`bg-slate-50 border border-gray-200 p-6 rounded-2xl max-w-md mx-auto shadow-md relative overflow-hidden ${archivosPerdidos ? 'opacity-50' : ''}`}>
                <h4 className="text-xs uppercase text-slate-500 font-black mb-2 tracking-wider">Concepto de Pago</h4>
                <p className="text-lg text-slate-900 font-bold mb-4 border-b border-gray-200 pb-4 uppercase">
                    Matrícula - Curso Preuniversitario (CUP)
                </p>

                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-slate-500 font-bold">Total a Pagar:</span>
                    <span className="text-4xl font-black text-blue-900">{data.paypal_monto} <span className="text-lg text-emerald-600 font-bold">USD</span></span>
                </div>

                <div className="mt-6 min-h-[150px] flex flex-col justify-center items-center bg-white p-4 rounded-xl border border-gray-200">
                    {archivosPerdidos ? (
                        <div className="text-xs text-amber-600 uppercase font-black tracking-widest">
                            ACCESO BLOQUEADO
                        </div>
                    ) : processing ? (
                        <div className="flex flex-col items-center text-blue-600 space-y-3">
                            <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-bold animate-pulse text-center text-slate-800">
                                Pago aprobado. <br /> Guardando documentos en el servidor...
                            </span>
                        </div>
                    ) : !sdkReady && !errorMessage ? (
                        <div className="text-xs text-gray-500 animate-pulse text-center font-semibold">
                            Estableciendo conexión encriptada con PayPal...
                        </div>
                    ) : (
                        <div id="paypal-button-container" className="w-full relative z-20"></div>
                    )}
                </div>
            </div>

            <div className="max-w-md mx-auto pt-2 text-center flex flex-col space-y-3">
                <button 
                    type="button" 
                    onClick={onBack} 
                    disabled={processing} 
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 text-xs font-black transition rounded-xl shadow border border-slate-200 disabled:opacity-50 uppercase tracking-widest"
                >
                    ← Retroceder al paso anterior
                </button>

                {/* Botón rápido para limpiar datos atascados */}
                <button 
                    type="button" 
                    onClick={() => { localStorage.clear(); window.location.reload(); }} 
                    className="text-[10px] text-red-600 hover:text-red-800 font-bold underline uppercase tracking-wider"
                >
                    Limpiar formulario y empezar de cero
                </button>
            </div>
        </div>
    );
}
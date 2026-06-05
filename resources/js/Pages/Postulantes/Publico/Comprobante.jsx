import React from 'react';
import { Head } from '@inertiajs/react';

export default function Comprobante({ postulante, meta }) {
    const generoCompleto = postulante.sexo === 'M' ? 'MASCULINO' : (postulante.sexo === 'F' ? 'FEMENINO' : postulante.sexo);

    return (
        <div className="min-h-screen bg-gray-200 py-8 text-black font-sans flex justify-center print:bg-white print:py-0">
            <Head title={`Formulario - ${postulante.ci}`} />

            {/* CONTENEDOR HOJA A4 VERTICAL */}
            <div
                className="
               bg-white
                w-[216mm]
                min-h-[279mm]
                mx-auto
                p-[10mm]
                shadow-2xl
                print:shadow-none
                print:w-[216mm]
                print:min-h-[279mm]">

                {/* --- CABECERA --- */}
                <div className="text-center mb-4">
                    <h1 className="font-bold text-sm uppercase tracking-wide">
                        UAGRM - CUP 2/{new Date().getFullYear()} FAC. CS. DE LA COMPUTACIÓN Y TELECOMUNICACIONES
                    </h1>
                    <h2 className="font-bold text-lg mt-2">
                        FORMULARIO DE INSCRIPCIÓN NÚMERO {String(postulante.id_postulante).padStart(7, '0')}
                    </h2>
                </div>

                <div className="text-right text-[10px] font-mono mb-1 uppercase tracking-widest">
                    Fecha y Hora: {meta.fecha_emision}
                </div>

                {/* --- TABLA 1: DATOS PERSONALES --- */}
                <div className="border-[1.5px] border-black mb-4">
                    <div className="bg-gray-100 border-b-[1.5px] border-black px-2 py-1 font-bold text-[11px] uppercase">
                        Datos Personales
                    </div>
                    <table className="w-full border-collapse table-fixed text-[10px]">
                        <thead>
                            <tr className="border-b border-black font-bold">
                                <th className="p-1.5 border-r border-black w-2/5">Apellido(s) y Nombre(s)</th>
                                <th className="p-1.5 border-r border-black w-1/8">CI</th>
                                <th className="p-0.5 border-r border-black w-1/8" >Género</th>
                                <th className="p-1.5 border-r border-black w-1/8">Teléfono</th>
                                <th className="p-1.5 w-1/4">Correo Electrónico</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="uppercase">
                                <td className="p-1.5 border-r border-black">{postulante.nombre_completo}</td>
                                <td className="p-1.5 border-r border-black w-1/8">{postulante.ci}</td>
                                <td className="p-0.5 border-r border-black w-1/8">{generoCompleto}</td>
                                <td className="p-1.5 border-r border-black w-1/8">{postulante.telefono}</td>
                                <td className="p-1.5 lowercase w-1/4">{postulante.correo}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- TABLA 2: UNIDAD EDUCATIVA --- */}
                <div className="border-[1.5px] border-black mb-4 bg-white">
                    <div className="bg-gray-100 border-b-[1.5px] border-black px-2 py-1 font-bold text-[11px] uppercase">
                        Datos de la Unidad Educativa
                    </div>
                    <table className="w-full border-collapse table-fixed text-[10px]">
                        <thead>
                            <tr className="border-b border-black font-bold">
                                <th className="p-1.5 border-r border-black w-[35%]">Unidad Educativa</th>
                                <th className="p-1.5 border-r border-black w-[15%]">Tipo</th>
                                <th className="p-1.5 border-r border-black w-[15%]">Turno</th>
                                <th className="p-1.5 border-r border-black w-[26%]">Ciudad</th>
                                <th className="p-1.5 border-r border-black w-[15%]">Código Título</th>
                                <th className="p-1.5 w-[14%]">Año de Egreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="uppercase">
                                <td className="p-1.5 border-r border-black">{postulante.nombre_colegio}</td>
                                <td className="p-1.5 border-r border-black">{postulante.tipo_colegio}</td>
                                <td className="p-1.5 border-r border-black">{postulante.turno || 'N/A'}</td>
                                <td className="p-1.5 border-r border-black">{postulante.provincia || 'SANTA CRUZ'}</td>
                                <td className="p-1.5 border-r border-black">{postulante.codigo_bachiller || 'N/A'}</td>
                                <td className="p-1.5">{meta.anio_egreso}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- TABLA 3: TRANSACCIÓN DE PAGO --- */}
                <div className="border-[1.5px] border-black mb-4">
                    <div className="bg-gray-100 border-b-[1.5px] border-black px-2 py-1 font-bold text-[11px] uppercase">
                        Datos de Transacción y Pago
                    </div>
                    <table className="w-full border-collapse table-fixed text-[10px]">
                        <thead>
                            <tr className="border-b border-black font-bold">
                                <th className="p-1.5 border-r border-black">ID de Transacción</th>
                                <th className="p-1.5 border-r border-black">Medio de Pago</th>
                                <th className="p-1.5 border-r border-black">Monto Cancelado</th>
                                <th className="p-1.5">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="uppercase">
                                <td className="p-1.5 border-r border-black font-mono">{postulante.transaccion_id || 'N/A'}</td>
                                <td className="p-1.5 border-r border-black">{postulante.metodo_pago}</td>
                                <td className="p-1.5 border-r border-black font-bold">BS. {Math.floor(postulante.monto)*10}</td>
                                <td className="p-1.5 font-bold">{postulante.estado_pago}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- TABLA 4: CARRERAS --- */}
                <div className="border-[1.5px] border-black mb-4">
                    <div className="bg-gray-100 border-b-[1.5px] border-black px-2 py-1 font-bold text-[11px] uppercase">
                        Carreras a Postular
                    </div>
                    <table className="w-full border-collapse table-fixed text-[10px]">
                        <thead>
                            <tr className="border-b border-black font-bold">
                                <th className="p-1.5 border-r border-black text-left w-[40%]">Carrera</th>
                                <th className="p-1.5 border-r border-black w-[8%]">Código</th>
                                <th className="p-1.5 border-r border-black w-[5%]">Plan</th>
                                <th className="p-1.5 border-r border-black w-[20%]">Modalidad</th>
                                <th className="p-1.5 border-r border-black w-[20%]">Área</th>
                                <th className="p-1.5 w-[7%]">Opción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-black uppercase">
                                <td className="p-1.5 border-r border-black text-left">{postulante.carrera_1_nombre}</td>
                                <td className="p-1.5 border-r border-black">{Math.floor(postulante.carrera_1_codigo/10)}</td>
                                <td className="p-1.5 border-r border-black">{Math.floor(postulante.carrera_1_codigo%10)}</td>
                                <td className="p-1.5 border-r border-black">{postulante.modalidad}</td>
                                <td className="p-1.5 border-r border-black">CIENCIAS DE LA COMPUTACIÓN</td>
                                <td className="p-1.5 font-bold">1</td>
                            </tr>
                            <tr className="uppercase">
                                <td className="p-1.5 border-r border-black text-left">{postulante.carrera_2_nombre}</td>
                                <td className="p-1.5 border-r border-black">{Math.floor(postulante.carrera_2_codigo/10)}</td>
                                <td className="p-1.5 border-r border-black">{Math.floor(postulante.carrera_2_codigo%10)}</td>
                                <td className="p-1.5 border-r border-black">{postulante.modalidad}</td>
                                <td className="p-1.5 border-r border-black">CIENCIAS DE LA COMPUTACIÓN</td>
                                <td className="p-1.5 font-bold">2</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- SECCIÓN 5: DECLARACIÓN JURADA --- */}
                <div className="border-[1.5px] border-black mb-4 relative min-h-[220px]">
                    <div className="bg-gray-100 border-b-[1.5px] border-black px-2 py-1 font-bold text-[11px] uppercase">
                        Declaración Jurada
                    </div>
                    <div className="p-3 text-[10px] leading-relaxed text-justify pr-32">
                        <p className="mb-2">
                            Yo <span className="font-bold">{postulante.nombre_completo}</span> con C.I. <span className="font-bold">{postulante.ci}</span> postulante de la presente asumo que estoy de acuerdo con los datos introducidos, que el ingreso a la U.A.G.R.M. es de planificación de acuerdo a cupos disponibles, que en caso de no presentarme a la prueba cualquiera sea la razón no se reembolsará el costo de matrícula que da derecho a la prueba.
                        </p>
                        <p>
                            Asimismo, al momento de inscribirme a la Evaluación Previa asumo plenamente la responsabilidad de cumplir las NORMAS Y REGLAMENTOS que rigen en la U.A.G.R.M., en la actualidad.
                        </p>

                        <div className="mt-16 w-48 text-center border-t border-black pt-1 mb-2">
                            FIRMA DEL POSTULANTE
                        </div>
                       
                    </div>

                    {/* Simulación del Espacio QR */}
                    <div className="absolute right-4 bottom-4 w-28 h-28 border-[1.5px] border-dashed border-gray-400 flex items-center justify-center bg-gray-50">
                        <span className="text-[10px] text-gray-400 font-bold text-center leading-tight">ESPACIO<br />PARA QR</span>
                    </div>
                </div>

                {/* --- FOOTER NOTAS --- */}
                <div className="text-[10px] text-justify font-bold uppercase leading-relaxed border-t border-black pt-2">
                    <span className="bg-black text-white px-2 py-0.5 mt-1 inline-block">* NOTA: Este comprobante certifica sus datos y el pago realizado.</span>
                </div>

            </div>

            {/* BOTÓN DE IMPRESIÓN (Oculto al imprimir) */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 shadow-2xl transition-all"
                >
                    IMPRIMIR / GUARDAR PDF
                </button>
            </div>

            {/* CSS para forzar estilos de impresión en A4 y colores exactos */}
            <style jsx="true">{`
                @media print {
                    @page { margin: 15mm; size: portrait; }
                    body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
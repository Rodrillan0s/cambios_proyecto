import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ status, rolNombre, detalles }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Mi Perfil
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Gestiona tus datos de acceso, información personal y configuración de seguridad.
                    </p>
                </div>
            }
        >
            <Head title="Mi Perfil" />

            <div className="py-6 space-y-8">
                {/* CARD DE INFORMACIÓN BÁSICA (Premium Glassmorphism) */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    {/* Elementos abstractos de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {/* Avatar genérico premium */}
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-3xl font-black shrink-0 shadow-inner">
                                {rolNombre.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <span className="inline-block bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                                    {rolNombre}
                                </span>
                                <h3 className="text-xl font-black text-white leading-snug">
                                    Información de Cuenta
                                </h3>
                                <p className="text-xs text-slate-300">
                                    Usuario del Sistema: <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{(detalles && detalles.ci) ? detalles.ci : 'Admin'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Detalles específicos de Docente o Postulante */}
                        {detalles && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 bg-white/5 border border-white/10 rounded-2xl p-4 md:max-w-md w-full text-xs font-semibold backdrop-blur-sm shadow-sm">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Cédula de Identidad</span>
                                    <span className="text-slate-100 block mt-0.5">{detalles.ci}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Teléfono de Contacto</span>
                                    <span className="text-slate-100 block mt-0.5">{detalles.telefono || 'No registrado'}</span>
                                </div>
                                {detalles.nombres && (
                                    <div className="col-span-2 border-t border-white/5 pt-2">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Nombre Completo (Registro)</span>
                                        <span className="text-slate-100 block mt-0.5">{detalles.nombres} {detalles.apellidos}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FORMULARIOS DE EDICIÓN Y SEGURIDAD */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Datos del Perfil */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-base font-extrabold text-slate-800">
                                Datos Personales
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Edita tu nombre y dirección de correo electrónico institucional o de contacto.
                            </p>
                        </div>
                        <UpdateProfileInformationForm className="w-full" />
                    </div>

                    {/* Seguridad / Contraseña */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h4 className="text-base font-extrabold text-slate-800">
                                Actualizar Contraseña
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Asegura tu cuenta estableciendo una contraseña segura y robusta.
                            </p>
                        </div>
                        <UpdatePasswordForm className="w-full" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

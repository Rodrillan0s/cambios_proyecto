import { Link } from '@inertiajs/react';
import NavLink from '@/Components/NavLink';

export default function Sidebar({ user, onClose }) {
    const rol = user?.id_rol;
    const isAdmin = rol === 1;
    const isDocente = rol === 2;
    const isPostulante = rol === 3;
    const isAutoridad = rol === 4;
    const isCoordinador = rol === 5;

    const roleNames = {
        1: 'Administrador',
        2: 'Docente',
        3: 'Postulante',
        4: 'Autoridad',
        5: 'Coordinador'
    };

    return (
        <aside className="w-64 min-h-screen bg-slate-800 text-white flex flex-col">

            {/* ================= LOGO ================= */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700">
                <Link
                    href={route('dashboard')}
                    className="font-semibold text-sm tracking-wide text-white"
                >
                    SISTEMA
                </Link>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl"
                        title="Cerrar menú"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* ================= NAV ================= */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">

                {/* GENERAL */}
                <p className="text-xs text-slate-400 uppercase mb-2">
                    General
                </p>

                <NavLink
                    href={route('dashboard')}
                    active={route().current('dashboard')}
                    className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                >
                    Dashboard
                </NavLink>

                {/* ADMISION - visible only for Admin and Coordinador */}
                {(isAdmin || isCoordinador) && (
                    <>
                        <p className="text-xs text-slate-400 uppercase mt-6 mb-2">
                            Admisión
                        </p>

                        <NavLink
                            href={route('admin.postulantes.index')}
                            active={route().current('admin.postulantes.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Postulantes
                        </NavLink>

                        <NavLink
                            href={route('admin.grupos.index')}
                            active={route().current('admin.grupos.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Grupos
                        </NavLink>

                        <NavLink
                            href={route('admin.horarios.index')}
                            active={route().current('admin.horarios.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Horarios
                        </NavLink>

                        <NavLink
                            href={route('admin.docentes.index')}
                            active={route().current('admin.docentes.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Docentes
                        </NavLink>

                        <NavLink
                            href={route('admin.asistencias.index')}
                            active={route().current('admin.asistencias.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Control de Asistencia
                        </NavLink>

                        <NavLink
                            href={route('admin.licencias.index')}
                            active={route().current('admin.licencias.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Licencias Docente
                        </NavLink>

                        <NavLink
                            href={route('admin.notas.index')}
                            active={route().current('admin.notas.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Control de Notas
                        </NavLink>
                    </>
                )}

                {/* SISTEMA / CONFIGURACIÓN - visible to Admin, Coordinador, Autoridad as appropriate */}
                {(isAdmin || isCoordinador || isAutoridad) && (
                    <>
                        <p className="text-xs text-slate-400 uppercase mt-6 mb-2">
                            Sistema
                        </p>

                        {/* Bitácora - Admin only */}
                        {isAdmin && (
                            <NavLink
                                href={route('admin.bitacora.index')}
                                active={route().current('admin.bitacora.*')}
                                className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                            >
                                Bitácora
                            </NavLink>
                        )}

                        <NavLink
                            href={route('admin.desempeno.index')}
                            active={route().current('admin.desempeno.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Desempeño Final
                        </NavLink>

                        <NavLink
                            href={route('admin.reportes.index')}
                            active={route().current('admin.reportes.*')}
                            className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                            Reportes
                        </NavLink>

                        {/* Usuarios - Admin only */}
                        {isAdmin && (
                            <NavLink
                                href={route('usuarios.index')}
                                active={route().current('usuarios.*')}
                                className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                            >
                                Usuarios
                            </NavLink>
                        )}
                    </>
                )}

                {/* CUENTA - visible for all */}
                <p className="text-xs text-slate-400 uppercase mt-6 mb-2">
                    Mi Cuenta
                </p>
                <NavLink
                    href={route('profile.edit')}
                    active={route().current('profile.edit')}
                    className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                >
                    Mi Perfil
                </NavLink>

            </nav>

            {/* ================= USER ================= */}
            <div className="border-t border-slate-700 p-4 text-sm">

                <div className="font-medium text-slate-100 truncate">
                    {user?.name}
                </div>

                <div className="text-slate-400 text-xs truncate">
                    {user?.email}
                </div>

                <div className="text-xs font-bold text-indigo-400 mt-1.5 uppercase tracking-wide">
                    {roleNames[rol] || 'Usuario'}
                </div>

            </div>

        </aside>
    );
}
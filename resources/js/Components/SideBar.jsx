import { Link } from '@inertiajs/react';
import NavLink from '@/Components/NavLink';

export default function Sidebar({ user }) {
    return (
        <aside className="w-64 min-h-screen bg-slate-800 text-white flex flex-col">

            {/* ================= LOGO ================= */}
            <div className="h-16 flex items-center px-6 border-b border-slate-700">
                <Link
                    href={route('dashboard')}
                    className="font-semibold text-sm tracking-wide text-white"
                >
                    SISTEMA
                </Link>
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

                {/* ADMISION */}
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

                {/* SISTEMA */}
                <p className="text-xs text-slate-400 uppercase mt-6 mb-2">
                    Sistema
                </p>

                <NavLink
                    href={route('admin.bitacora.index')}
                    active={route().current('admin.bitacora.*')}
                    className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                >
                    Bitácora
                </NavLink>

                {/* ================= NUEVO ================= */}
                <NavLink
                    href={route('admin.desempeno.index')}
                    active={route().current('admin.desempeno.*')}
                    className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                >
                    Desempeño Final
                </NavLink>

                <NavLink
                    href={route('usuarios.index')}
                    active={route().current('usuarios.*')}
                    className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700 transition"
                >
                    Usuarios
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

            </div>

        </aside>
    );
}
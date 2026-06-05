import { Head, Link } from '@inertiajs/react';
import ficct from '../../assets/ficct.jpg';
import LogoCUP from '../../assets/LogoCUP.png';

export default function Welcome({ auth }) {
    const carreras = [
        { nombre: 'Ing. de Sistemas', icono: '💻' },
        { nombre: 'Ing. Informática', icono: '⌨️' },
        { nombre: 'Ing. en Telecomunicaciones', icono: '📡' },
        { nombre: 'Ing. en Robótica', icono: '🤖' },
    ];

    return (
        <>
            <Head title="Bienvenido al CUP - FICCT" />

            {/* Fondo principal con imagen completa */}
            <div
                className="relative min-h-screen flex flex-col bg-cover bg-center bg-no-repeat bg-fixed"
                style={{ backgroundImage: `url(${ficct})` }}
            >
                {/* Overlay azul translúcido suave */}
                <div className="absolute inset-0 bg-[#00204a]/40 backdrop-blur-[1px]" />

                {/* Header institucional */}
                <header className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src={LogoCUP} alt="Logo CUP" className="h-12 w-auto" />
                        <span className="text-xl font-bold text-white tracking-wider drop-shadow-sm">
                            CUP <span className="text-red-500 font-extrabold">FICCT</span>
                        </span>
                    </div>
                    <nav className="flex gap-4 items-center">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="bg-[#00204a] hover:bg-[#003366] text-white border border-white/20 px-5 py-2 rounded-xl font-bold transition shadow-lg"
                            >
                                Ir al Panel
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="text-white hover:text-gray-200 font-bold px-3 py-2 transition drop-shadow-sm"
                                >
                                    Acceder
                                </Link>
                                {/* AQUÍ ENLAZAMOS AL FLUJO 1 DE PREINSCRIPCIÓN */}
                                <Link
                                    href={route('postulantes.create.publico')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-bold transition shadow-md active:scale-95"
                                >
                                    Preinscribirse al CUP
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero central */}
                <main className="relative z-10 flex flex-col items-center justify-center flex-grow text-center px-6 py-12">
                    <span className="text-red-500 font-extrabold tracking-widest text-xs uppercase bg-red-600/10 px-3 py-1 rounded-full border border-red-500/20 mb-3 inline-block backdrop-blur-sm">
                        Admisión Universitaria 2026
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)] mb-6 leading-tight">
                        CONSTRUYE TU FUTURO <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-300">
                            CON NOSOTROS
                        </span>
                    </h1>
                    <p className="text-gray-100 text-lg max-w-2xl font-medium leading-relaxed mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                        Sé parte de la Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones.
                        Inicia tu proceso de admisión 100% digital, rápido y seguro.
                    </p>
                    
                    {/* Botones de Acción Principal */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                        <Link
                            href={route('postulantes.create.publico')}
                            className="inline-block bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-500 transition shadow-[0_0_20px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5"
                        >
                            Comenzar Preinscripción Digital
                        </Link>
                        <a
                            href="https://ficct.uagrm.edu.bo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-white text-[#00204a] font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-0.5"
                        >
                            Visitar Sitio Oficial
                        </a>
                    </div>
                </main>

                {/* Sección de Carreras en bloque blanco original */}
                <section className="relative z-10 bg-white py-12 border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-2xl font-extrabold text-[#00204a] text-center tracking-wide uppercase mb-10">
                            Carreras Académicas Disponibles
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {carreras.map((carrera, i) => (
                                <div
                                    key={i}
                                    className="p-6 bg-[#f8fafc] rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 ease-in-out transform hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex items-center justify-center text-3xl bg-white p-2 rounded-xl shadow-inner border border-gray-100">
                                            {carrera.icono}
                                        </div>
                                        <h3 className="text-md font-bold text-[#00204a] tracking-tight">{carrera.nombre}</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed pl-1">
                                        Formación profesional de alta competencia tecnológica y excelencia académica en el CUP.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer integrado */}
                <footer className="relative z-10 text-center py-6 text-xs text-gray-400 bg-[#001736] border-t border-white/5">
                    Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones - UAGRM © {new Date().getFullYear()}
                </footer>
            </div>
        </>
    );
}
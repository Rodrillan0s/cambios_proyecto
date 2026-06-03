import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Bienvenido al CUP - FICCT" />
            
            {/* Contenedor principal con estilo institucional */}
            <div className="bg-white text-gray-800 min-h-screen">
                
                {/* Header Institucional */}
                <header className="bg-[#00204a] text-white p-6 flex justify-between items-center shadow-md">
                    <div className="text-2xl font-bold tracking-tight">
                        CUP <span className="text-red-600">FICCT</span>
                    </div>
                    <nav className="flex gap-4">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="text-white hover:text-gray-300">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition">
                                    Acceder
                                </Link>
                                <Link href={route('register')} className="text-white hover:text-gray-300 px-4 py-2">
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero Section */}
                <main>
                    <div className="bg-[#00204a] text-white py-20 px-6 text-center">
                        <h1 className="text-5xl font-extrabold mb-6">¡CONSTRUYE TU FUTURO CON NOSOTROS!</h1>
                        <a href="https://ficct.uagrm.edu.bo" className="inline-block bg-white text-[#00204a] font-bold px-8 py-3 rounded-lg hover:bg-gray-200 transition">
                            VISITA EL SITIO DE FICCT
                        </a>
                    </div>

                    {/* Carreras Demandadas (Reemplazo del grid de Laravel) */}
                    <div className="max-w-7xl mx-auto py-12 px-6">
                        <h2 className="text-3xl font-bold text-[#00204a] mb-8 border-l-4 border-red-600 pl-4">
                            Las carreras más demandadas
                        </h2>
                        
                        <div className="grid md:grid-cols-3 gap-6">
                            {['Ing. Informática', 'Ing. de Sistemas', 'Ing. en Telecomunicaciones y Redes'].map((carrera) => (
                                <div key={carrera} className="p-8 bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition border-b-4 border-red-600">
                                    <h3 className="text-xl font-semibold text-[#00204a]">{carrera}</h3>
                                    <p className="mt-4 text-gray-600">Formación de excelencia académica en la facultad.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                <footer className="py-10 text-center text-sm text-gray-500 border-t">
                    Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones - UAGRM
                </footer>
            </div>
        </>
    );
}
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import ficct from '../../../assets/ficct.jpg';
import LogoCUP from '../../../assets/LogoCUP.png';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-6">
            <Head title="Iniciar sesión" />

            {/* Fondo con imagen y overlay FICCT */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${ficct})` }}
            >
                <div className="absolute inset-0 bg-[#00204a]/85 backdrop-blur-sm" />
            </div>

            {/* Tarjeta de login */}
            <div className="relative z-10 w-full max-w-md bg-white/95 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20">
                
                {/* Encabezado con identidad institucional */}
                <div className="mb-6 text-center">
                    <img src={LogoCUP} alt="LogoCUP" className="mx-auto h-20 w-auto mb-3" />
                    <h2 className="text-2xl font-black text-[#00204a] tracking-wider">ACCESO AL SISTEMA</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mt-1">CUP - FICCT UAGRM</p>
                </div>

                {/* Mensajes de Estado Académico (Éxito al preinscribirse o cambio de contraseña) */}
                {status && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center leading-relaxed shadow-sm">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="login" value="Usuario o Correo Electrónico" className="text-gray-700 text-xs font-bold uppercase tracking-wider" />
                        <TextInput
                            id="login"
                            type="text"
                            name="login"
                            value={data.login}
                            className="mt-1 block w-full border-gray-300 rounded-xl focus:border-[#00204a] focus:ring-[#00204a] text-sm p-3"
                            placeholder="ej: eddy.toledo o correo@uagrm.edu"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('login', e.target.value)}
                        />
                        <InputError message={errors.login} className="mt-1 text-xs" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Contraseña" className="text-gray-700 text-xs font-bold uppercase tracking-wider" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full border-gray-300 rounded-xl focus:border-[#00204a] focus:ring-[#00204a] text-sm p-3"
                            placeholder="••••••••••••"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-1 text-xs" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center cursor-pointer select-none">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded text-[#00204a] focus:ring-[#00204a]"
                            />
                            <span className="ms-2 text-xs font-medium text-gray-600">Recuérdame</span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-red-600 font-semibold hover:text-red-800 transition"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        )}
                    </div>

                    <div className="pt-2">
                        <PrimaryButton 
                            className="w-full justify-center bg-[#00204a] hover:bg-[#001533] text-white py-3 rounded-xl font-bold transition shadow-lg tracking-wide uppercase text-xs" 
                            disabled={processing}
                        >
                            {processing ? "Autenticando..." : "Ingresar al Panel"}
                        </PrimaryButton>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs">
                        <span className="text-gray-500">¿Eres postulante nuevo?</span>
                        {/* 🚀 CORRECCIÓN CLAVE: Redirección al Flujo 1 en lugar de la ruta eliminada 'register' */}
                        <Link
                            href={route('postulantes.create.publico')}
                            className="ms-1.5 font-bold text-red-600 hover:text-red-800 underline transition"
                        >
                            Iniciar Preinscripción Digital
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
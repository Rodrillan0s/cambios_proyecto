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
                <div className="absolute inset-0 bg-[#00204a]/80 backdrop-blur-sm" />
            </div>

            {/* Tarjeta de login */}
            <div className="relative z-10 w-full max-w-md bg-white/95 p-6 rounded-lg shadow-lg">
                
                {/* Encabezado con identidad institucional */}
                <div className="mb-6 text-center">
                    <img src={LogoCUP} alt="LogoCUP" className="mx-auto h-20 w-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[#00204a]">ACCESO</h2>
                    <p className="text-gray-600 text-sm">CUP - FICCT UAGRM</p>
                </div>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600">
                        {status}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="login" value="Usuario o Correo" className="text-gray-700 font-bold" />
                        <TextInput
                            id="login"
                            type="text"
                            name="login"
                            value={data.login}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('login', e.target.value)}
                        />
                        <InputError message={errors.login} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Contraseña" className="text-gray-700 font-bold" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4 block">
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ms-2 text-sm text-gray-600">Recuérdame</span>
                        </label>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 items-center">
                        <PrimaryButton 
                            className="w-full justify-center bg-[#00204a] hover:bg-[#003366] text-white py-2 rounded-md transition" 
                            disabled={processing}
                        >
                            Iniciar sesión
                        </PrimaryButton>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-red-600 underline hover:text-red-800"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        )}
                    </div>

                    <div className="mt-4 text-center">
                        <span className="text-sm text-gray-600">¿No tienes una cuenta?</span>
                        <Link
                            href={route('register')}
                            className="ms-2 text-sm text-red-600 underline hover:text-red-800"
                        >
                            Regístrate
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

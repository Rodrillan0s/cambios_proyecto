import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import ficct from '../../../assets/ficct.jpg';
import LogoCUP from '../../../assets/LogoCUP.png';

export default function ResetPassword({ token, errorToken }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div 
            className="relative min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${ficct})` }}
        >
            {/* Overlay Azul Institucional con desenfoque */}
            <div className="absolute inset-0 bg-[#00204a]/80 backdrop-blur-sm" />

            {/* Contenedor del Formulario (Tarjeta Blanca) */}
            <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
                <Head title="Restablecer Contraseña" />

                {/* Encabezado con Logos e Identidad */}
                <div className="mb-6 text-center">
                    <img src={LogoCUP} alt="LogoCUP" className="mx-auto h-16 w-auto mb-2" />
                    <h2 className="text-2xl font-bold text-[#00204a]">Nueva Contraseña</h2>
                    <p className="text-gray-500 text-sm">CUP - FICCT UAGRM</p>
                </div>

                {/* Si el token es inválido o expiró */}
                {errorToken ? (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Enlace Expirado o Inválido</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            El enlace para restablecer tu contraseña ha expirado o es inválido. Por favor, solicita un nuevo enlace para continuar.
                        </p>
                        <Link 
                            href={route('password.request')} 
                            className="inline-flex w-full justify-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition font-bold shadow-md"
                        >
                            Solicitar nuevo enlace
                        </Link>
                    </div>
                ) : (
                    /* Si el token es correcto se renderiza el formulario activo */
                    <form onSubmit={submit}>
                        <input type="hidden" name="token" value={data.token} />

                        {/* Campo Nueva Contraseña */}
                        <div>
                            <InputLabel htmlFor="password" value="Nueva Contraseña" className="text-gray-700 font-bold" />
                            
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                                autoComplete="new-password"
                                isFocused={true}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Campo Confirmar Contraseña */}
                        <div className="mt-4">
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Confirmar Nueva Contraseña"
                                className="text-gray-700 font-bold"
                            />

                            <TextInput
                                type="password"
                                id="password_confirmation"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                required
                            />

                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        {/* Botón de Envío */}
                        <div className="mt-6">
                            <PrimaryButton 
                                className="w-full justify-center bg-[#00204a] hover:bg-[#003366] text-white py-2 rounded-md transition font-bold tracking-wide" 
                                disabled={processing}
                            >
                                Restablecer contraseña
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
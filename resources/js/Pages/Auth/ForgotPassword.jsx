import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import ficct from '../../../assets/ficct.jpg';
import LogoCUP from '../../../assets/LogoCUP.png';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        correo: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
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
                <Head title="Recuperar Contraseña" />

                {/* Encabezado con Logos e Identidad */}
                <div className="mb-6 text-center">
                    <img src={LogoCUP} alt="LogoCUP" className="mx-auto h-16 w-auto mb-2" />
                    <h2 className="text-2xl font-bold text-[#00204a]">Recuperar Contraseña</h2>
                    <p className="text-gray-500 text-sm">CUP - FICCT UAGRM</p>
                </div>

                {/* Texto de Instrucciones en Español */}
                <div className="mb-4 text-sm text-gray-600 text-center leading-relaxed">
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    Asegúrate de revisar tu bandeja de entrada y la carpeta de spam.
                </div>

                {/* Mensaje de Estado / Enlace de Simulación en Alerta Verde */}
                {status && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-sm font-medium text-green-700 rounded-md break-all shadow-inner">
                        {status}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="correo" value="Correo Electrónico" className="text-gray-700 font-bold" />
                        
                        <TextInput
                            id="correo"
                            type="email"
                            name="correo"
                            value={data.correo}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            isFocused={true}
                            onChange={(e) => setData('correo', e.target.value)}
                            required
                        />

                        <InputError message={errors.correo} className="mt-2" />
                    </div>

                    {/* Botones de Acción */}
                    <div className="mt-6 flex flex-col gap-4 items-center">
                        <PrimaryButton 
                            className="w-full justify-center bg-[#00204a] hover:bg-[#003366] text-white py-2 rounded-md transition font-bold tracking-wide" 
                            disabled={processing}
                        >
                            Obtener enlace para restablecer contraseña
                        </PrimaryButton>

                        <Link 
                            href={route('login')} 
                            className="text-sm text-red-600 underline hover:text-red-800 transition font-medium"
                        >
                            Volver al Inicio de Sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import ficct from '../../../assets/ficct.jpg';
import LogoCUP from '../../../assets/LogoCUP.png';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: '',
        usuario: '',
        correo: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div 
            className="relative min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${ficct})` }}
        >
            {/* Overlay Azul Institucional */}
            <div className="absolute inset-0 bg-[#00204a]/80 backdrop-blur-sm" />

            {/* Contenedor del Formulario (Tarjeta) */}
            <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
                <Head title="Registro" />

                {/* Encabezado */}
                <div className="mb-6 text-center">
                    <img src={LogoCUP} alt="LogoCUP" className="mx-auto h-16 w-auto mb-2" />
                    <h2 className="text-2xl font-bold text-[#00204a]">REGISTRO</h2>
                    <p className="text-gray-500 text-sm">CUP - FICCT UAGRM</p>
                </div>

                <form onSubmit={submit}>
                    {/* Campo Nombre */}
                    <div>
                        <InputLabel htmlFor="nombre" value="Nombre Completo" className="text-gray-700 font-bold" />
                        <TextInput
                            id="nombre"
                            name="nombre"
                            value={data.nombre}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            autoComplete="nombre"
                            isFocused={true}
                            onChange={(e) => setData('nombre', e.target.value)}
                            required
                        />
                        <InputError message={errors.nombre} className="mt-2" />
                    </div>

                    {/* Campo Usuario */}
                    <div className="mt-4">
                        <InputLabel htmlFor="usuario" value="Nombre de Usuario" className="text-gray-700 font-bold" />
                        <TextInput
                            id="usuario"
                            name="usuario"
                            value={data.usuario}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            autoComplete="usuario"
                            onChange={(e) => setData('usuario', e.target.value)}
                            required
                        />
                        <InputError message={errors.usuario} className="mt-2" />
                    </div>

                    {/* Campo Correo */}
                    <div className="mt-4">
                        <InputLabel htmlFor="correo" value="Correo Electrónico" className="text-gray-700 font-bold" />
                        <TextInput
                            id="correo"
                            type="email"
                            name="correo"
                            value={data.correo}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            autoComplete="username"
                            onChange={(e) => setData('correo', e.target.value)}
                            required
                        />
                        <InputError message={errors.correo} className="mt-2" />
                    </div>

                    {/* Campo Password */}
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Contraseña" className="text-gray-700 font-bold" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    {/* Campo Confirm Password */}
                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Confirmar Contraseña" className="text-gray-700 font-bold" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full border-gray-300 focus:border-[#00204a] focus:ring-[#00204a]"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    {/* Botones */}
                    <div className="mt-6 flex flex-col gap-4 items-center">
                        <PrimaryButton 
                            className="w-full justify-center bg-[#00204a] hover:bg-[#003366] text-white py-2 rounded-md transition" 
                            disabled={processing}
                        >
                            Registrarse
                        </PrimaryButton>

                        <Link
                            href={route('login')}
                            className="text-sm text-red-600 underline hover:text-red-800"
                        >
                            ¿Ya tienes una cuenta? Inicia sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
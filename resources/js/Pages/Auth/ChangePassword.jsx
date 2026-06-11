import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, Link } from '@inertiajs/react';
import ficct from '../../../assets/ficct.jpg';
import LogoCUP from '../../../assets/LogoCUP.png';

export default function ChangePassword() {
    const { data, setData, put, errors, processing, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            onSuccess: () => reset(),
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-6">
            <Head title="Cambiar contraseña requerida" />

            {/* Fondo con imagen y overlay FICCT */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${ficct})` }}
            >
                <div className="absolute inset-0 bg-[#00204a]/85 backdrop-blur-sm" />
            </div>

            {/* Tarjeta de cambio de contraseña */}
            <div className="relative z-10 w-full max-w-md bg-white/95 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20">
                
                {/* Encabezado con identidad institucional */}
                <div className="mb-6 text-center">
                    <img src={LogoCUP} alt="LogoCUP" className="mx-auto h-20 w-auto mb-3" />
                    <h2 className="text-xl font-black text-[#00204a] tracking-wider uppercase">Primer Inicio de Sesión</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mt-1">Cambio de Contraseña Obligatorio</p>
                </div>

                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl leading-relaxed shadow-sm">
                    ⚠️ Por seguridad de tu cuenta, debes cambiar la contraseña temporal (que es tu número de C.I.) antes de acceder al panel académico.
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="current_password" value="Contraseña Actual (Tu C.I.)" className="text-gray-700 text-xs font-bold uppercase tracking-wider" />
                        <TextInput
                            id="current_password"
                            type="password"
                            name="current_password"
                            value={data.current_password}
                            className="mt-1 block w-full border-gray-300 rounded-xl focus:border-[#00204a] focus:ring-[#00204a] text-sm p-3"
                            placeholder="Introduce tu C.I."
                            onChange={(e) => setData('current_password', e.target.value)}
                        />
                        <InputError message={errors.current_password} className="mt-1 text-xs" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Nueva Contraseña" className="text-gray-700 text-xs font-bold uppercase tracking-wider" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full border-gray-300 rounded-xl focus:border-[#00204a] focus:ring-[#00204a] text-sm p-3"
                            placeholder="Mínimo 8 caracteres"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-1 text-xs" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Confirmar Nueva Contraseña" className="text-gray-700 text-xs font-bold uppercase tracking-wider" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full border-gray-300 rounded-xl focus:border-[#00204a] focus:ring-[#00204a] text-sm p-3"
                            placeholder="Repite la nueva contraseña"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                        <InputError message={errors.password_confirmation} className="mt-1 text-xs" />
                    </div>

                    <div className="pt-2">
                        <PrimaryButton 
                            className="w-full justify-center bg-[#00204a] hover:bg-[#001533] text-white py-3 rounded-xl font-bold transition shadow-lg tracking-wide uppercase text-xs" 
                            disabled={processing}
                        >
                            {processing ? "Actualizando Contraseña..." : "Cambiar Contraseña e Ingresar"}
                        </PrimaryButton>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-xs text-red-600 font-bold hover:text-red-800 underline transition"
                        >
                            Cerrar Sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

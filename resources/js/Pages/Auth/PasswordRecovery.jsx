import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Header from '../../Components/Home/Header';

export default function PasswordRecovery({ token = null, email = '' }) {
    const { flash } = usePage().props;
    const form = useForm({ email, token: token || '', password: '', password_confirmation: '' });
    const submit = event => {
        event.preventDefault();
        form.post(token ? '/restablecer-contrasena' : '/recuperar-contrasena', { onFinish: () => form.reset('password', 'password_confirmation') });
    };
    return <>
        <Head title={token ? 'Restablecer contraseña' : 'Recuperar contraseña'}><meta name="robots" content="noindex,nofollow" /></Head>
        <Header minimal />
        <main className="store-public-container"><section className="store-status-card">
            <h1>{token ? 'Elige tu nueva contraseña' : 'Recupera tu contraseña'}</h1>
            <p>Usa el correo con el que registraste tu cuenta.</p>
            {flash?.success && <p role="status">{flash.success}</p>}
            <form onSubmit={submit} className="store-recovery-form">
                <label htmlFor="recovery-email">Correo electrónico</label>
                <input id="recovery-email" type="email" autoComplete="email" required value={form.data.email} onChange={e => form.setData('email', e.target.value)} />
                {form.errors.email && <p role="alert">{form.errors.email}</p>}
                {token && <>
                    <label htmlFor="recovery-password">Nueva contraseña</label>
                    <input id="recovery-password" type="password" autoComplete="new-password" minLength={8} required value={form.data.password} onChange={e => form.setData('password', e.target.value)} />
                    <p>Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos.</p>
                    <label htmlFor="recovery-confirmation">Repite la contraseña</label>
                    <input id="recovery-confirmation" type="password" autoComplete="new-password" required value={form.data.password_confirmation} onChange={e => form.setData('password_confirmation', e.target.value)} />
                    {form.errors.password && <p role="alert">{form.errors.password}</p>}
                </>}
                <button className="efe-btn-primary" disabled={form.processing}>{form.processing ? 'Procesando…' : token ? 'Guardar contraseña' : 'Enviar enlace'}</button>
            </form>
            <Link href="/login">Volver al acceso</Link>
        </section></main>
    </>;
}

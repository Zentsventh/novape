import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function MarketingPreferences({ enabled, unsubscribe, completed = false, action }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ promotions: Boolean(enabled) });
    return <main style={{ maxWidth: 620, margin: '60px auto', padding: 24 }}>
        <Head title="Preferencias de comunicaciones"><meta name="robots" content="noindex" /></Head>
        <h1>{unsubscribe ? 'Dejar de recibir promociones' : 'Preferencias de comunicaciones'}</h1>
        <p>Los avisos necesarios para gestionar tus pedidos seguirán llegando.</p>
        {completed ? <p role="status">Tu baja ha sido registrada.</p> : unsubscribe ? <button disabled={processing} onClick={() => post(action)}>Confirmar baja de promociones</button>
            : <form onSubmit={e => { e.preventDefault(); post('/perfil/comunicaciones'); }}>
                <label><input type="checkbox" checked={data.promotions} onChange={e => setData('promotions', e.target.checked)} /> Quiero recibir ofertas y promociones</label>
                <p><button disabled={processing}>Guardar preferencias</button></p>
                {errors.promotions && <p role="alert">{errors.promotions}</p>}
            </form>}
        {flash?.success && <p role="status">{flash.success}</p>}
        <Link href={unsubscribe ? '/' : '/perfil'}>Volver</Link>
    </main>;
}

import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Report({campaign, deliveries}) {
    return <AdminLayout><Head title={`Campaña ${campaign.name}`}/>
        <Link href={route('admin.marketing.campaigns')}>Volver a campañas</Link>
        <h1>{campaign.name}</h1><p>Estado: {campaign.status} · Enviados: {campaign.sent_count} / {campaign.target_count}</p>
        {['draft', 'failed'].includes(campaign.status) && <button onClick={() => router.post(route('admin.marketing.campaigns.send', campaign.id))}>{campaign.status === 'draft' ? 'Enviar campaña' : 'Reanudar destinatarios pendientes'}</button>}
        <p>Los destinatarios enviados se conservan. Los envíos fallidos o sin confirmación requieren revisar el proveedor antes de volver a enviarlos.</p>
        <div style={{overflowX: 'auto'}}><table style={{width: '100%'}}><thead><tr><th>Correo</th><th>Estado</th><th>Intentos</th><th>Enviado</th><th>Detalle</th></tr></thead><tbody>
            {deliveries.data.map(row => <tr key={row.id}><td>{row.email}</td><td>{row.status}</td><td>{row.attempts}</td><td>{row.sent_at || '—'}</td><td>{row.error || '—'}</td></tr>)}
        </tbody></table></div>
        <nav aria-label="Páginas de destinatarios" style={{display: 'flex', gap: 12}}>{deliveries.links.map((link,i) => link.url ? <Link key={i} href={link.url} dangerouslySetInnerHTML={{__html: link.label}}/> : <span key={i} dangerouslySetInnerHTML={{__html: link.label}}/>)}</nav>
    </AdminLayout>;
}

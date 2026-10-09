import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Bot, CalendarDays, CheckCircle2, GitBranch, PlugZap, RefreshCw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import { api, currency, errorText, Field, Notice, useResource } from './api';
import WorkflowPanel from './WorkflowPanel';
import AppointmentPanel from './AppointmentPanel';
import OperationsPanel from './OperationsPanel';

const tabs = [
    ['business', BookOpen, 'Negocio y conocimiento'], ['workflows', GitBranch, 'Flujos de trabajo'],
    ['appointments', CalendarDays, 'Agenda y vendedores'], ['operations', PlugZap, 'Ejecuciones y conexiones'],
];

function BusinessPanel({ config, refresh }) {
    const [settings, setSettings] = useState(config.settings || {}), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
    const change = (key, value) => { setSettings(current => ({ ...current, [key]: value })); setSuccess(''); };
    const save = async event => {
        event.preventDefault(); setBusy(true); setError(''); setSuccess('');
        try { await api('/config', { method: 'PUT', data: { settings } }); setSuccess('Información guardada. Los asistentes utilizarán esta configuración en las próximas consultas.'); refresh(); }
        catch (error) { setError(errorText(error)); } finally { setBusy(false); }
    };
    return <form onSubmit={save} className="ai-stack">
        <div className="ai-card"><div className="ai-section-heading"><div><h2>La información de tu negocio</h2><p>Define qué deben saber los asistentes para orientar a clientes y trabajadores.</p></div><BookOpen size={22} /></div>
            <div className="ai-form-grid">
                <Field label="Nombre del negocio"><input required maxLength={160} value={settings.business_name || ''} onChange={event => change('business_name', event.target.value)} /></Field>
                <Field label="Zona horaria"><input required maxLength={64} value={settings.timezone || 'America/Lima'} onChange={event => change('timezone', event.target.value)} /></Field>
                <Field label="Compra de alto valor (S/)" help="Se usa para identificar oportunidades que necesitan atención comercial."><input type="number" min="1" step="0.01" required value={settings.high_value_threshold ?? 10000} onChange={event => change('high_value_threshold', Number(event.target.value))} /></Field>
                <Field label="Cantidad para venta por volumen" help="Desde esta cantidad se puede ofrecer una cita con un vendedor."><input type="number" min="1" step="1" required value={settings.bulk_quantity_threshold ?? 10} onChange={event => change('bulk_quantity_threshold', Number(event.target.value))} /></Field>
                <Field label="Base de conocimiento" wide help="Añade dirección, horarios de atención, entregas, medios de pago, garantías, devoluciones, ventas a empresas y condiciones para cotizar. Evita contraseñas o datos privados."><textarea rows={9} maxLength={30000} value={settings.knowledge || ''} onChange={event => change('knowledge', event.target.value)} placeholder={'Dirección y horarios:\nEntregas y cobertura:\nPagos y facturación:\nGarantías y devoluciones:\nVentas corporativas y cotizaciones:'} /></Field>
            </div>
        </div>
        <div className="ai-two-columns">
            <div className="ai-card"><div className="ai-section-heading"><div><span className="ai-kicker">ATENCIÓN COMERCIAL</span><h2>Asistente de la tienda</h2></div><Bot size={23} /></div>
                <Field label="Instrucciones para conversar con clientes" help="Define el tono, las preguntas para orientar la compra y cuándo debe intervenir un vendedor."><textarea rows={7} maxLength={10000} value={settings.store_instructions || ''} onChange={event => change('store_instructions', event.target.value)} /></Field>
                <Field label="Mensaje de bienvenida"><textarea rows={3} maxLength={2000} value={settings.welcome_message || ''} onChange={event => change('welcome_message', event.target.value)} /></Field>
                <Field label="Mensaje fuera de horario"><textarea rows={3} maxLength={2000} value={settings.out_of_hours_message || ''} onChange={event => change('out_of_hours_message', event.target.value)} /></Field>
            </div>
            <div className="ai-card"><div className="ai-section-heading"><div><span className="ai-kicker">OPERACIÓN INTERNA</span><h2>Asistente del panel</h2></div><ShieldCheck size={23} /></div>
                <Field label="Instrucciones para ayudar al equipo" help="Explica procesos internos, prioridades y criterios para preparar respuestas. Cada trabajador conserva sus permisos de acceso."><textarea rows={12} maxLength={10000} value={settings.panel_instructions || ''} onChange={event => change('panel_instructions', event.target.value)} /></Field>
                <div className="ai-info"><ShieldCheck size={19} /><p>Las consultas internas utilizan el contexto autorizado del panel. Las respuestas para clientes se revisan desde la bandeja.</p></div>
            </div>
        </div>
        <div className="ai-card"><div className="ai-section-heading"><div><h2>Canales habilitados</h2><p>Activa los espacios donde quieres utilizar la automatización.</p></div></div>
            <div className="ai-channel-grid">{[['store_enabled', 'Chat de la tienda', 'Orientación de compra y derivación comercial'], ['panel_enabled', 'Asistente del panel', 'Consultas y apoyo para el equipo'], ['whatsapp_enabled', 'WhatsApp', 'Requiere credenciales y webhook configurados']].map(([key, title, description]) => <label key={key} className="ai-check-card"><input type="checkbox" checked={Boolean(settings[key])} onChange={event => change(key, event.target.checked)} /><span><strong>{title}</strong><small>{description}</small></span></label>)}</div>
        </div>
        <Notice error={error} success={success} /><div className="ai-footer-actions"><span>La configuración se aplica al guardar.</span><button className="ai-button is-primary" disabled={busy}><Save size={17} />{busy ? 'Guardando…' : 'Guardar configuración'}</button></div>
    </form>;
}

export default function Index() {
    const config = useResource('/config');
    const [tab, setTab] = useState('business');
    const canConfigure = Boolean(config.data?.can_configure);
    const visibleTabs = canConfigure ? tabs : tabs.filter(([key]) => key === 'appointments');
    const currentTab = canConfigure ? tab : 'appointments';
    return <TwentyCrmLayout title="Centro IA"><Head title="Centro IA · Automatización" /><main className="ai-center">
        <div className="ai-page-heading"><div><span className="ai-kicker"><Sparkles size={15} /> CENTRO DE INTELIGENCIA ARTIFICIAL</span><h1>Una operación conectada.</h1><p>Atención al cliente, trabajo del equipo y oportunidades comerciales en un mismo lugar.</p></div><Link className="ai-button" href="/admin/asistente">Abrir asistente <ArrowRight size={16} /></Link></div>
        {config.loading && !config.data ? <div className="ai-card ai-loading" role="status">Cargando el centro de automatización…</div> : config.error && !config.data ? <div className="ai-card"><Notice error={config.error} /><button className="ai-button" onClick={config.refresh}><RefreshCw size={16} />Reintentar</button></div> : config.data && <>
            <div className="ai-overview"><div><span className="ai-overview-icon"><GitBranch size={22} /></span><p><strong>Flujos con reglas claras</strong><span>Disparadores, condiciones y acciones</span></p></div><div><span className="ai-overview-icon"><CalendarDays size={22} /></span><p><strong>Ventas de alto valor</strong><span>Umbral {currency(config.data.settings?.high_value_threshold || 10000)} · Empresas y volumen</span></p></div><div><span className="ai-overview-icon"><CheckCircle2 size={22} /></span><p><strong>Control de cada ejecución</strong><span>Pruebas, historial y atención humana</span></p></div></div>
            <nav className="ai-tabs" aria-label="Secciones del Centro IA">{visibleTabs.map(([key, Icon, title]) => <button key={key} aria-current={currentTab === key ? 'page' : undefined} className={currentTab === key ? 'is-active' : ''} onClick={() => setTab(key)}><Icon size={17} />{title}</button>)}</nav>
            {currentTab === 'business' && <BusinessPanel config={config.data} refresh={config.refresh} />}
            {currentTab === 'workflows' && <WorkflowPanel />}
            {currentTab === 'appointments' && <AppointmentPanel />}
            {currentTab === 'operations' && <OperationsPanel config={config.data} refresh={config.refresh} />}
        </>}
    </main></TwentyCrmLayout>;
}

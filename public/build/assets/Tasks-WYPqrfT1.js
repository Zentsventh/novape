import{c as E,r as c,a as H,j as e,H as G,S as U,L as Q,d as y}from"./app-C3RWgAur.js";import{T as q}from"./TwentyCrmLayout-DDUauhmD.js";import{S as d}from"./sweetalert2.esm.all-DE6NlnlT.js";import{T as J}from"./TwentyRecordDrawer-CRjVLKVf.js";import{P as K}from"./plus-D21a16ME.js";import{C as V}from"./circle-alert-BWmFPp6B.js";import{C as f}from"./calendar-BApPTcw6.js";import{C}from"./clock-YONy9r1q.js";import{C as N}from"./circle-check-big-D2dM53qx.js";import{P as W}from"./pen-BxyznndJ.js";import{T as X}from"./trash-2-DwNyB8xh.js";import{F as Z}from"./file-text-CxO_i9Lf.js";import{M as ee}from"./PageTransition-DmXVn4w5.js";import"./activity-BCTfrQC1.js";import"./target-DHSvFRoo.js";import"./proxy-B--KSZG2.js";import"./x-DU_YHF0l.js";const te=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],re=E("circle",te);const oe=[["path",{d:"M13 2a9 9 0 0 1 9 9",key:"1itnx2"}],["path",{d:"M13 6a5 5 0 0 1 5 5",key:"11nki7"}],["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],ae=E("phone-call",oe);function je({tasks:B=[],deals:T=[]}){const[z,F]=c.useState(null),[n,S]=c.useState(""),[u,_]=c.useState("todas"),{data:o,setData:i,post:A,put:D,reset:w,errors:a,clearErrors:L}=H({id:null,deal_id:"",tipo:"tarea",contenido:"",fecha_vencimiento:""}),[M,k]=c.useState(!1),j=(t=null)=>{L(),t?i({id:t.id,deal_id:t.deal_id||"",tipo:t.tipo||"tarea",contenido:t.contenido||"",fecha_vencimiento:t.fecha_vencimiento?new Date(t.fecha_vencimiento).toISOString().slice(0,16):""}):w(),k(!0)},x=()=>{k(!1),w()},$=t=>{t.preventDefault();const r=!!o.id,s=r?`/admin/crm/tasks/${o.id}`:"/admin/crm/tasks";(r?D:A)(s,{onSuccess:()=>{x(),d.fire({toast:!0,position:"bottom-end",icon:"success",title:r?"Tarea actualizada":"Tarea creada",showConfirmButton:!1,timer:2e3,customClass:{popup:"premium-toast"}})}})},P=t=>{d.fire({title:"¿Eliminar tarea?",text:"Esta acción no se puede deshacer y borrará la tarea permanentemente.",icon:"warning",iconColor:"#EF4444",showCancelButton:!0,confirmButtonText:"Sí, eliminar",cancelButtonText:"Cancelar",customClass:{popup:"premium-swal-popup",title:"premium-swal-title",htmlContainer:"premium-swal-text",confirmButton:"premium-swal-confirm",cancelButton:"premium-swal-cancel",actions:"premium-swal-actions",icon:"premium-swal-icon"},buttonsStyling:!1}).then(r=>{r.isConfirmed&&y.delete(`/admin/crm/tasks/${t}`,{preserveScroll:!0,onSuccess:()=>{d.fire({toast:!0,position:"bottom-end",icon:"success",title:"Tarea eliminada",showConfirmButton:!1,timer:2e3,customClass:{popup:"premium-toast"}})}})})},I=t=>{F(t.id),y.post(`/admin/crm/tasks/${t.id}/complete`,{completado:!t.completada},{preserveScroll:!0,onFinish:()=>F(null),onSuccess:()=>{const r=t.completada?"reabierta":"completada";d.fire({toast:!0,position:"bottom-end",icon:"success",title:`Tarea ${r}`,showConfirmButton:!1,timer:2e3,customClass:{popup:"premium-toast"}})}})},O=t=>{switch(t){case"llamada":return e.jsx(ae,{size:16});case"email":return e.jsx(ee,{size:16});case"reunion":return e.jsx(f,{size:16});default:return e.jsx(Z,{size:16})}},p=t=>{const r=t.completada,s=t.time_status==="overdue",m=t.time_status==="today";return e.jsxs("div",{className:`premium-task-card ${r?"completed":""}`,children:[e.jsx("button",{onClick:()=>I(t),disabled:z===t.id,className:`premium-checkbox-btn ${r?"checked":""}`,children:r?e.jsx(N,{size:22}):e.jsx(re,{size:22})}),e.jsx("div",{className:"premium-icon-box",children:O(t.tipo)}),e.jsx("div",{className:"premium-task-content",children:e.jsx("h4",{className:"premium-task-title",children:t.contenido||"Sin descripción"})}),e.jsxs("div",{className:"premium-task-meta",children:[t.deal&&e.jsx(Q,{href:`/admin/crm/pipeline?search=${encodeURIComponent(t.deal.titulo)}`,className:"premium-task-deal",children:t.deal.titulo}),t.fecha_vencimiento&&e.jsxs("div",{className:`premium-task-date ${s?"overdue":m?"today":""}`,children:[e.jsx(C,{size:13,style:{flexShrink:0}}),new Date(t.fecha_vencimiento).toLocaleString([],{dateStyle:"short",timeStyle:"short"})]})]}),e.jsxs("div",{className:"premium-task-actions",children:[e.jsx("button",{onClick:()=>j(t),className:"premium-action-btn edit",title:"Editar tarea",children:e.jsx(W,{size:16})}),e.jsx("button",{onClick:()=>P(t.id),className:"premium-action-btn delete",title:"Eliminar tarea",children:e.jsx(X,{size:16})})]})]},t.id)},l=B.filter(t=>{const r=t.titulo?t.titulo.toLowerCase().includes(n.toLowerCase()):!1,s=t.descripcion?t.descripcion.toLowerCase().includes(n.toLowerCase()):!1,m=t.contenido?t.contenido.toLowerCase().includes(n.toLowerCase()):!1,R=r||s||m,Y=u==="todas"||t.tipo===u;return R&&Y}),h=l.filter(t=>t.time_status==="overdue"),g=l.filter(t=>t.time_status==="today"),b=l.filter(t=>t.time_status==="upcoming"),v=l.filter(t=>t.time_status==="completed");return e.jsxs(q,{title:"Mis Tareas",children:[e.jsx(G,{title:"Mis Tareas"}),e.jsx("style",{children:`
                .premium-tasks-wrapper {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 40px 32px;
                    font-family: inherit;
                }
                .premium-page-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    color: #1E293B;
                    letter-spacing: -0.02em;
                }
                .premium-page-subtitle {
                    margin: 0;
                    color: #64748B;
                    font-size: 15px;
                }
                .premium-section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    margin: 0 0 16px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .premium-section-title.overdue { color: #EF4444; }
                .premium-section-title.today { color: #00B4FF; }
                .premium-section-title.upcoming { color: #475569; }
                .premium-section-title.completed { color: #94A3B8; }
                
                .premium-task-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 40px;
                }

                .premium-task-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    background-color: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                }
                .premium-task-card:hover {
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.03);
                    border-color: #CBD5E1;
                    transform: translateY(-1px);
                }
                .premium-task-card.completed {
                    opacity: 0.6;
                    background-color: #F8FAFC;
                    box-shadow: none;
                }
                .premium-task-card.completed:hover {
                    transform: none;
                }

                .premium-checkbox-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #94A3B8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    transition: all 0.2s ease;
                }
                .premium-checkbox-btn:hover:not(:disabled) {
                    color: #00B4FF;
                    transform: scale(1.1);
                }
                .premium-checkbox-btn.checked {
                    color: #00B4FF;
                }
                .premium-checkbox-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .premium-icon-box {
                    padding: 10px;
                    background-color: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    color: #64748B;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .premium-task-content {
                    flex: 1;
                    min-width: 0; /* allows text truncation if needed */
                }
                .premium-task-title {
                    margin: 0 0 4px 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1E293B;
                    transition: color 0.2s ease;
                }
                .premium-task-card.completed .premium-task-title {
                    color: #64748B;
                    text-decoration: line-through;
                }
                .premium-task-desc {
                    margin: 0;
                    font-size: 13px;
                    color: #64748B;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .premium-task-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                    text-align: right;
                }
                .premium-task-deal {
                    font-size: 12px;
                    font-weight: 600;
                    color: #00B4FF;
                    background: rgba(0, 180, 255, 0.1);
                    padding: 4px 10px;
                    border-radius: 6px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .premium-task-deal:hover {
                    background: rgba(0, 180, 255, 0.15);
                    transform: scale(1.02);
                }
                
                .premium-task-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #64748B;
                    font-weight: 500;
                }
                .premium-task-date.overdue {
                    color: #EF4444;
                }
                .premium-task-date.today {
                    color: #00B4FF;
                }

                .premium-empty-state {
                    padding: 32px;
                    text-align: center;
                    color: #94A3B8;
                    font-size: 14px;
                    background: #F8FAFC;
                    border-radius: 12px;
                    border: 1px dashed #E2E8F0;
                }
                
                /* Toast Customization */
                .premium-toast {
                    border-radius: 12px !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
                    font-family: inherit !important;
                }

                /* New Toolbar & Actions CSS */
                .premium-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }
                .premium-search-box {
                    position: relative;
                    flex: 1;
                    min-width: 250px;
                }
                .premium-search-box .search-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94A3B8;
                }
                .premium-search-box input {
                    width: 100%;
                    padding: 10px 16px 10px 40px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .premium-search-box input:focus {
                    border-color: #00B4FF;
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.1);
                }
                .premium-filters {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                }
                .premium-filter-btn {
                    padding: 8px 16px;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #64748B;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .premium-filter-btn:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                }
                .premium-filter-btn.active {
                    background: #1E293B;
                    color: #FFFFFF;
                    border-color: #1E293B;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .premium-task-actions {
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    margin-left: 8px;
                    display: flex;
                    align-items: center;
                }
                .premium-task-card:hover .premium-task-actions {
                    opacity: 1;
                }
                .premium-action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    color: #94A3B8;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .premium-action-btn:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                }
                .premium-action-btn.delete:hover {
                    background: #FEF2F2;
                    color: #EF4444;
                }
                
                .premium-swal-popup {
                    border-radius: 16px !important;
                    padding: 32px 24px !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
                    font-family: inherit !important;
                    border: 1px solid #E2E8F0 !important;
                }
                .premium-swal-title {
                    font-size: 20px !important;
                    font-weight: 700 !important;
                    color: #1E293B !important;
                    margin-bottom: 8px !important;
                }
                .premium-swal-text {
                    font-size: 15px !important;
                    color: #64748B !important;
                    margin-bottom: 8px !important;
                }
                .premium-swal-icon {
                    border: none !important;
                    background: #FEF2F2 !important;
                    margin-bottom: 24px !important;
                }
                .premium-swal-actions {
                    gap: 12px !important;
                    margin-top: 24px !important;
                }
                .premium-swal-confirm {
                    background: #EF4444 !important;
                    color: #FFFFFF !important;
                    padding: 12px 24px !important;
                    border-radius: 10px !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    border: none !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2) !important;
                }
                .premium-swal-confirm:hover {
                    background: #DC2626 !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 6px 10px -1px rgba(239, 68, 68, 0.3) !important;
                }
                .premium-swal-cancel {
                    background: #FFFFFF !important;
                    color: #475569 !important;
                    padding: 12px 24px !important;
                    border-radius: 10px !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    border: 1px solid #E2E8F0 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                }
                .premium-swal-cancel:hover {
                    background: #F8FAFC !important;
                    color: #1E293B !important;
                    border-color: #CBD5E1 !important;
                }
                .premium-create-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #00B4FF;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 180, 255, 0.2);
                }
                .premium-create-btn:hover {
                    background: #009be5;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(0, 180, 255, 0.3);
                }
                .premium-action-btn.edit:hover {
                    background: #EFF6FF;
                    color: #00B4FF;
                }
                /* Drawer Form Premium Styles */
                .premium-form-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 8px 4px;
                }
                .premium-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .premium-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    letter-spacing: 0.01em;
                }
                .premium-input {
                    padding: 12px 16px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #FFFFFF;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
                    font-family: inherit;
                    width: 100%;
                    box-sizing: border-box;
                }
                .premium-input::placeholder {
                    color: #94A3B8;
                }
                .premium-input:focus {
                    border-color: #00B4FF;
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.15);
                    background: #FFFFFF;
                }
                textarea.premium-input {
                    resize: vertical;
                    min-height: 80px;
                }
                select.premium-input {
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 40px;
                }
                .premium-drawer-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #F1F5F9;
                }
                .premium-btn-secondary {
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: 1px solid #E2E8F0;
                    background: #FFFFFF;
                    font-weight: 600;
                    font-size: 14px;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    color: #1E293B;
                    border-color: #CBD5E1;
                }
                .premium-btn-primary {
                    padding: 10px 24px;
                    border-radius: 10px;
                    border: none;
                    background: #00B4FF;
                    font-weight: 600;
                    font-size: 14px;
                    color: #FFFFFF;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px -1px rgba(0, 180, 255, 0.2), 0 2px 4px -1px rgba(0, 180, 255, 0.1);
                }
                .premium-btn-primary:hover {
                    background: #009be5;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 10px -1px rgba(0, 180, 255, 0.3), 0 2px 4px -1px rgba(0, 180, 255, 0.1);
                }
            `}),e.jsxs("div",{className:"premium-tasks-wrapper",children:[e.jsxs("div",{style:{marginBottom:"32px"},children:[e.jsx("h1",{className:"premium-page-title",children:"Gestor Global de Tareas"}),e.jsx("p",{className:"premium-page-subtitle",children:"Administra todas las actividades de tus tratos desde un solo lugar."})]}),e.jsxs("div",{className:"premium-toolbar",children:[e.jsxs("div",{className:"premium-search-box",children:[e.jsx(U,{size:16,className:"search-icon"}),e.jsx("input",{type:"text",placeholder:"Buscar tareas por título o descripción...",value:n,onChange:t=>S(t.target.value)})]}),e.jsx("div",{className:"premium-filters",children:["todas","llamada","email","reunion","tarea"].map(t=>e.jsx("button",{className:`premium-filter-btn ${u===t?"active":""}`,onClick:()=>_(t),children:t.charAt(0).toUpperCase()+t.slice(1)},t))}),e.jsxs("button",{className:"premium-create-btn",onClick:()=>j(),children:[e.jsx(K,{size:18})," Nueva Tarea"]})]}),h.length>0&&e.jsxs("div",{className:"premium-task-list",children:[e.jsxs("h3",{className:"premium-section-title overdue",children:[e.jsx(V,{size:16})," Tareas Atrasadas (",h.length,")"]}),h.map(p)]}),e.jsxs("div",{className:"premium-task-list",children:[e.jsxs("h3",{className:"premium-section-title today",children:[e.jsx(f,{size:16})," Para Hoy (",g.length,")"]}),g.length>0?g.map(p):e.jsx("div",{className:"premium-empty-state",children:"No tienes tareas pendientes para hoy. ¡Estás al día!"})]}),b.length>0&&e.jsxs("div",{className:"premium-task-list",children:[e.jsxs("h3",{className:"premium-section-title upcoming",children:[e.jsx(C,{size:16})," Próximas (",b.length,")"]}),b.map(p)]}),v.length>0&&e.jsxs("div",{className:"premium-task-list",style:{marginTop:"24px"},children:[e.jsxs("h3",{className:"premium-section-title completed",children:[e.jsx(N,{size:16})," Completadas Recientemente"]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:v.slice(0,10).map(p)})]})]}),e.jsx(J,{isOpen:M,onClose:x,title:o.id?"Editar Tarea":"Nueva Tarea",icon:e.jsx(f,{size:20,style:{color:"#00B4FF"}}),children:e.jsxs("form",{onSubmit:$,className:"premium-form-container",children:[e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Contenido de la Tarea"}),e.jsx("textarea",{className:"premium-input",value:o.contenido,onChange:t=>i("contenido",t.target.value),rows:3}),a.contenido&&e.jsx("span",{className:"twenty-error",style:{color:"#ef4444",fontSize:"12px",marginTop:"2px"},children:a.contenido})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Trato Asociado"}),e.jsxs("select",{className:"premium-input",value:o.deal_id,onChange:t=>i("deal_id",t.target.value),children:[e.jsx("option",{value:"",disabled:!0,children:"Seleccione un trato..."}),T.map(t=>e.jsx("option",{value:t.id,children:t.titulo},t.id))]}),a.deal_id&&e.jsx("span",{className:"twenty-error",style:{color:"#ef4444",fontSize:"12px",marginTop:"2px"},children:a.deal_id})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"},children:[e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Tipo de Actividad"}),e.jsxs("select",{className:"premium-input",value:o.tipo,onChange:t=>i("tipo",t.target.value),children:[e.jsx("option",{value:"tarea",children:"Tarea"}),e.jsx("option",{value:"llamada",children:"Llamada"}),e.jsx("option",{value:"email",children:"Email"}),e.jsx("option",{value:"reunion",children:"Reunión"})]}),a.tipo&&e.jsx("span",{className:"twenty-error",style:{color:"#ef4444",fontSize:"12px",marginTop:"2px"},children:a.tipo})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Fecha y Hora"}),e.jsx("input",{type:"datetime-local",className:"premium-input",value:o.fecha_vencimiento,onChange:t=>i("fecha_vencimiento",t.target.value)}),a.fecha_vencimiento&&e.jsx("span",{className:"twenty-error",style:{color:"#ef4444",fontSize:"12px",marginTop:"2px"},children:a.fecha_vencimiento})]})]}),e.jsxs("div",{className:"premium-drawer-actions",children:[e.jsx("button",{type:"button",className:"premium-btn-secondary",onClick:x,children:"Cancelar"}),e.jsx("button",{type:"submit",className:"premium-btn-primary",children:o.id?"Guardar Cambios":"Crear Tarea"})]})]})})]})}export{je as default};

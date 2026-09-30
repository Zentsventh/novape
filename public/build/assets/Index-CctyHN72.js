import{r as d,j as e,H as g,d as p}from"./app-C3RWgAur.js";import{T as f,Z as s}from"./TwentyCrmLayout-DDUauhmD.js";import{T as h}from"./TwentyRecordDrawer-CRjVLKVf.js";import{S as b}from"./sweetalert2.esm.all-DE6NlnlT.js";import{P as c}from"./plus-D21a16ME.js";import{T as y}from"./trash-2-DwNyB8xh.js";import{A as j}from"./arrow-right-B5jg9VMo.js";import"./PageTransition-DmXVn4w5.js";import"./proxy-B--KSZG2.js";import"./file-text-CxO_i9Lf.js";import"./activity-BCTfrQC1.js";import"./target-DHSvFRoo.js";import"./calendar-BApPTcw6.js";import"./x-DU_YHF0l.js";function W({automations:l=[]}){const[x,i]=d.useState(!1),[a,t]=d.useState({nombre:"",trigger_type:"deal_created",condiciones:[],acciones:[{type:"webhook",url:""}],activo:!0}),m=r=>{r.preventDefault(),p.post("/admin/crm/automations",a,{onSuccess:()=>{i(!1),t({nombre:"",trigger_type:"deal_created",condiciones:[],acciones:[{type:"webhook",url:""}],activo:!0})}})},u=r=>{b.fire({title:"¿Eliminar automatización?",icon:"warning",showCancelButton:!0,confirmButtonText:"Sí, eliminar",cancelButtonText:"Cancelar"}).then(o=>{o.isConfirmed&&p.delete(`/admin/crm/automations/${r}`)})};return e.jsxs(f,{title:"Automatizaciones",children:[e.jsx(g,{title:"Automatizaciones - CRM"}),e.jsx("style",{children:`
                .auto-card {
                    background: #ffffff;
                    border: 1px solid #E2E8F0;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .auto-card:hover {
                    box-shadow: 0 10px 25px -5px rgba(0, 180, 255, 0.15);
                    transform: translateY(-3px);
                    border-color: rgba(0, 180, 255, 0.3);
                }
                .btn-primary-custom {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #00B4FF;
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.2);
                }
                .btn-primary-custom:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 180, 255, 0.3);
                    background: #009BE0;
                }
                .btn-icon-danger {
                    background: transparent;
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .btn-icon-danger:hover {
                    color: #EF4444;
                    background: #FEE2E2;
                }
                .flow-step {
                    padding: 16px;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }
                .auto-card:hover .flow-step {
                    border-color: rgba(0, 180, 255, 0.3);
                    background: #F0F9FF;
                }
                .flow-step-title {
                    font-weight: 600;
                    color: #1E293B;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 32px;
                    text-align: center;
                    background: #ffffff;
                    border: 1px dashed #CBD5E1;
                    border-radius: 16px;
                    color: #64748B;
                }
                /* Drawer Form Styles */
                .drawer-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 24px 32px;
                }
                .drawer-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .drawer-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748B;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .drawer-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #F8FAFC;
                    transition: all 0.2s ease;
                    outline: none;
                    appearance: none;
                }
                .drawer-input:focus {
                    background: #ffffff;
                    border-color: #00B4FF;
                    box-shadow: 0 0 0 4px rgba(0, 180, 255, 0.1);
                }
                .drawer-input::placeholder {
                    color: #94A3B8;
                }
                .drawer-select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    padding-right: 40px;
                }
                .btn-secondary-custom {
                    padding: 10px 20px;
                    background: #ffffff;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .btn-secondary-custom:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                    border-color: #94A3B8;
                }
                .drawer-footer {
                    margin-top: 16px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding-top: 24px;
                    border-top: 1px solid #E2E8F0;
                }
            `}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%",background:"#F8FAFC"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"32px",borderBottom:"1px solid #E2E8F0",background:"#ffffff"},children:[e.jsx("div",{children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"},children:[e.jsx("div",{style:{background:"#F0F9FF",padding:"8px",borderRadius:"10px",color:"#00B4FF"},children:e.jsx(s,{size:24})}),e.jsx("h1",{style:{margin:0,fontSize:"24px",fontWeight:700,color:"#1E293B",letterSpacing:"-0.02em"},children:"Automatizaciones"})]})}),e.jsxs("button",{className:"btn-primary-custom",onClick:()=>i(!0),children:[e.jsx(c,{size:18}),e.jsx("span",{children:"Nueva Automatización"})]})]}),e.jsx("div",{style:{flex:1,padding:"32px",overflowY:"auto"},children:l.length===0?e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{style:{width:"64px",height:"64px",borderRadius:"16px",background:"rgba(0, 180, 255, 0.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px"},children:e.jsx(s,{size:32,color:"#00B4FF"})}),e.jsx("h3",{style:{margin:"0 0 8px 0",color:"#1E293B",fontSize:"18px",fontWeight:600},children:"No hay automatizaciones"}),e.jsx("p",{style:{margin:"0 0 24px 0",fontSize:"15px"},children:"Crea tu primera automatización para optimizar tus flujos de trabajo."}),e.jsxs("button",{className:"btn-primary-custom",onClick:()=>i(!0),children:[e.jsx(c,{size:16})," Crear Automatización"]})]}):e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(380px, 1fr))",gap:"24px"},children:l.map(r=>e.jsxs("div",{className:"auto-card",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[e.jsx("div",{style:{width:"10px",height:"10px",borderRadius:"50%",background:r.activo?"#10b981":"#94A3B8",boxShadow:r.activo?"0 0 10px rgba(16, 185, 129, 0.4)":"none"}}),e.jsx("h3",{style:{margin:0,fontSize:"17px",fontWeight:700,color:"#1E293B"},children:r.nombre})]}),e.jsx("button",{onClick:()=>u(r.id),className:"btn-icon-danger",title:"Eliminar automatización",children:e.jsx(y,{size:18})})]}),e.jsxs("div",{className:"flow-step",children:[e.jsxs("div",{className:"flow-step-title",children:[e.jsx("div",{style:{background:"#E2E8F0",color:"#475569",padding:"4px 8px",borderRadius:"6px",fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700},children:"Trigger"}),"Cuándo"]}),e.jsxs("div",{style:{color:"#475569",display:"flex",alignItems:"center",gap:"8px",marginTop:"12px",fontWeight:500},children:[e.jsx(s,{size:16,color:"#94A3B8"}),r.trigger_type==="deal_created"&&"Se crea una nueva oportunidad",r.trigger_type==="deal_moved"&&"Una oportunidad cambia de etapa",r.trigger_type==="company_created"&&"Se registra una nueva empresa"]})]}),e.jsx("div",{style:{display:"flex",justifySelf:"center",margin:"-8px 0",alignSelf:"center",position:"relative",zIndex:1},children:e.jsx("div",{style:{background:"#ffffff",border:"1px solid #E2E8F0",borderRadius:"50%",padding:"6px",boxShadow:"0 2px 4px rgba(0,0,0,0.02)"},children:e.jsx(j,{size:14,color:"#94A3B8",style:{transform:"rotate(90deg)"}})})}),e.jsxs("div",{className:"flow-step",children:[e.jsxs("div",{className:"flow-step-title",children:[e.jsx("div",{style:{background:"rgba(0, 180, 255, 0.1)",color:"#00B4FF",padding:"4px 8px",borderRadius:"6px",fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700},children:"Action"}),"Entonces"]}),r.acciones.map((o,n)=>e.jsxs("div",{style:{color:"#475569",display:"flex",alignItems:"center",gap:"10px",marginTop:"12px",fontWeight:500},children:[o.type==="webhook"&&e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{background:"#1E293B",color:"#fff",padding:"2px 6px",borderRadius:"4px",fontSize:"10px",fontWeight:700},children:"POST"}),e.jsx("span",{style:{fontFamily:"monospace",background:"#ffffff",padding:"4px 8px",borderRadius:"6px",border:"1px solid #E2E8F0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontSize:"12px",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.02)",flex:1},children:o.url})]}),o.type==="send_email"&&e.jsxs("span",{children:["Enviar Correo: ",o.message]}),o.type==="send_coupon"&&e.jsxs("span",{children:["Enviar Cupón: ",o.message]}),o.type==="create_task"&&e.jsx("span",{children:"Crear Tarea en CRM"})]},n))]})]},r.id))})})]}),e.jsx(h,{isOpen:x,onClose:()=>i(!1),title:"Nueva Automatización",children:e.jsxs("form",{className:"drawer-form",onSubmit:m,children:[e.jsxs("div",{className:"drawer-form-group",children:[e.jsx("label",{className:"drawer-label",children:"Nombre de la automatización"}),e.jsx("input",{type:"text",required:!0,className:"drawer-input",placeholder:"Ej: Enviar webhook al crear oportunidad",value:a.nombre,onChange:r=>t({...a,nombre:r.target.value})})]}),e.jsxs("div",{className:"drawer-form-group",children:[e.jsx("label",{className:"drawer-label",children:"Evento (Trigger)"}),e.jsxs("select",{className:"drawer-input drawer-select",value:a.trigger_type,onChange:r=>t({...a,trigger_type:r.target.value}),children:[e.jsx("option",{value:"deal_created",children:"Oportunidad creada"}),e.jsx("option",{value:"deal_moved",children:"Oportunidad cambia de etapa"}),e.jsx("option",{value:"company_created",children:"Empresa creada"})]})]}),e.jsxs("div",{className:"drawer-form-group",children:[e.jsx("label",{className:"drawer-label",children:"Tipo de Acción"}),e.jsxs("select",{className:"drawer-input drawer-select",value:a.acciones[0]?.type||"webhook",onChange:r=>{const o=r.target.value,n=[...a.acciones];n[0]={type:o,url:"",email:"",message:""},t({...a,acciones:n})},children:[e.jsx("option",{value:"webhook",children:"Llamar Webhook"}),e.jsx("option",{value:"send_email",children:"Enviar Correo Electrónico"}),e.jsx("option",{value:"send_coupon",children:"Enviar Cupón de Descuento"}),e.jsx("option",{value:"create_task",children:"Asignar Tarea en CRM"})]})]}),a.acciones[0]?.type==="webhook"&&e.jsxs("div",{className:"drawer-form-group",children:[e.jsx("label",{className:"drawer-label",children:"URL del Webhook"}),e.jsx("input",{type:"url",required:!0,className:"drawer-input",placeholder:"https://api.ejemplo.com/webhook",value:a.acciones[0].url||"",onChange:r=>{const o=[...a.acciones];o[0].url=r.target.value,t({...a,acciones:o})}})]}),(a.acciones[0]?.type==="send_email"||a.acciones[0]?.type==="send_coupon")&&e.jsxs("div",{className:"drawer-form-group",children:[e.jsx("label",{className:"drawer-label",children:"Mensaje / Asunto"}),e.jsx("input",{type:"text",required:!0,className:"drawer-input",placeholder:"Ej: ¡Gracias por tu compra!",value:a.acciones[0].message||"",onChange:r=>{const o=[...a.acciones];o[0].message=r.target.value,t({...a,acciones:o})}})]}),e.jsxs("div",{className:"drawer-footer",children:[e.jsx("button",{type:"button",className:"btn-secondary-custom",onClick:()=>i(!1),children:"Cancelar"}),e.jsx("button",{type:"submit",className:"btn-primary-custom",children:"Crear Automatización"})]})]})})]})}export{W as default};

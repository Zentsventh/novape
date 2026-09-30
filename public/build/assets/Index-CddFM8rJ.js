import{r as n,j as e,H as f,S as F,d as o,L as w}from"./app-C3RWgAur.js";import{T as y,B as j}from"./TwentyCrmLayout-DDUauhmD.js";import{T as E}from"./TwentyTable-rLjuY2uv.js";import{T as v}from"./TwentyRecordDrawer-CRjVLKVf.js";import{S as m}from"./sweetalert2.esm.all-DE6NlnlT.js";import{T as N}from"./trash-2-DwNyB8xh.js";import{D as B}from"./download-DVVxRN-Q.js";import{P as C}from"./plus-D21a16ME.js";import"./PageTransition-DmXVn4w5.js";import"./proxy-B--KSZG2.js";import"./file-text-CxO_i9Lf.js";import"./activity-BCTfrQC1.js";import"./target-DHSvFRoo.js";import"./calendar-BApPTcw6.js";import"./chevron-down-YW5SR-7D.js";import"./x-DU_YHF0l.js";function U({companies:l={data:[],links:[]},filters:c={},customFieldsSchema:S=[]}){const[s,d]=n.useState(c?.search||""),x=l?.data||[],[a,p]=n.useState([]),[u,t]=n.useState(!1),b=r=>{r.key==="Enter"&&o.get("/admin/crm/companies",{search:s},{preserveState:!0})},h=[{accessor:"nombre",header:"Nombre",render:r=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},className:"table-row-hover",children:[e.jsx("div",{style:{width:"32px",height:"32px",background:"#F8FAFC",borderRadius:"8px",border:"1px solid #E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",transition:"all 0.2s ease"},className:"company-logo-container",children:r.logo_url?e.jsx("img",{src:r.logo_url,alt:"Logo",style:{width:"100%",height:"100%",objectFit:"cover"}}):e.jsx(j,{size:16,color:"#94A3B8"})}),e.jsx(w,{href:`/admin/crm/companies/${r.id}`,style:{color:"#1E293B",textDecoration:"none",fontWeight:600,transition:"color 0.2s ease"},className:"company-link",children:r.nombre})]})},{accessor:"dominio",header:"Dominio"},{accessor:"industria",header:"Industria"},{accessor:"personas_count",header:"Contactos",render:r=>r.personas_count||0},{accessor:"responsable",header:"Propietario",render:r=>r.responsable?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("img",{src:r.responsable.avatar_url||`https://ui-avatars.com/api/?name=${r.responsable.nombres}+${r.responsable.apellidos}&background=random`,alt:r.responsable.nombres,style:{width:"24px",height:"24px",borderRadius:"50%",border:"1px solid #E2E8F0",boxShadow:"0 1px 2px rgba(0,0,0,0.05)"}}),e.jsxs("span",{style:{color:"#475569",fontWeight:500},children:[r.responsable.nombres," ",r.responsable.apellidos]})]}):e.jsx("span",{style:{color:"#94A3B8",fontStyle:"italic"},children:"Sin asignar"})},{accessor:"created_at",header:"Creado"}],g=()=>{a.length&&m.fire({title:"¿Eliminar empresas?",text:`Eliminarás ${a.length} empresa(s). Esta acción no se puede deshacer.`,icon:"warning",showCancelButton:!0,buttonsStyling:!1,customClass:{popup:"premium-swal-popup",title:"premium-swal-title",htmlContainer:"premium-swal-text",actions:"premium-swal-actions",confirmButton:"premium-swal-confirm",cancelButton:"premium-swal-cancel",icon:"premium-swal-icon"},confirmButtonText:"Sí, eliminar",cancelButtonText:"Cancelar"}).then(r=>{r.isConfirmed&&o.delete(`/admin/crm/companies/${a[0]}`,{preserveScroll:!0,onSuccess:()=>p([])})})};return e.jsxs(y,{title:"Empresas",children:[e.jsx(f,{title:"Empresas - CRM"}),e.jsx("style",{children:`
                .premium-container {
                    padding: 32px 40px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background-color: #FAFAFA;
                    font-family: inherit;
                    --twenty-border: #E2E8F0;
                    --twenty-border-strong: #E2E8F0;
                    --twenty-bg-surface: #FFFFFF;
                    --twenty-bg-app: #F8FAFC;
                    --twenty-text-main: #1E293B;
                    --twenty-text-secondary: #475569;
                    --twenty-text-muted: #94A3B8;
                    --twenty-primary-bg: rgba(0, 180, 255, 0.04);
                    --twenty-bg-hover: #F1F5F9;
                    --twenty-radius-lg: 12px;
                }
                .premium-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .premium-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1E293B;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .premium-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                .premium-search-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .premium-search-icon {
                    position: absolute;
                    left: 14px;
                    color: #94A3B8;
                    pointer-events: none;
                    transition: color 0.2s ease;
                }
                .premium-input {
                    padding: 10px 16px 10px 40px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #FFFFFF;
                    width: 260px;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
                }
                .premium-input:focus {
                    border-color: #00B4FF;
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.02);
                }
                .premium-input:focus ~ .premium-search-icon {
                    color: #00B4FF;
                }
                .premium-input::placeholder {
                    color: #94A3B8;
                }
                .premium-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    text-decoration: none;
                    outline: none;
                }
                .premium-btn:active {
                    transform: translateY(0) scale(0.98);
                }
                .premium-btn:focus-visible {
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.3);
                }
                .premium-btn-secondary {
                    background: #FFFFFF;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    border-color: #CBD5E1;
                    color: #1E293B;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .premium-btn-primary {
                    background: #00B4FF;
                    color: #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.2);
                }
                .premium-btn-primary:hover {
                    background: #00A2E8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0, 180, 255, 0.3);
                }
                .premium-table-wrapper {
                    flex: 1;
                    overflow: hidden;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                }
                .premium-table-wrapper:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
                }
                .company-link:hover {
                    color: #00B4FF !important;
                }
                .table-row-hover:hover .company-logo-container {
                    border-color: #00B4FF !important;
                    box-shadow: 0 0 0 2px rgba(0, 180, 255, 0.1);
                }
                .premium-form {
                    padding: 8px 0;
                }
                .premium-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-bottom: 20px;
                }
                .premium-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1E293B;
                }
                .premium-form-input {
                    padding: 10px 14px;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #FFFFFF;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .premium-form-input:focus {
                    border-color: #00B4FF;
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.15), 0 1px 2px rgba(0,0,0,0.02);
                }
                .premium-form-input::placeholder {
                    color: #94A3B8;
                }
                .premium-hint {
                    font-size: 12px;
                    color: #64748B;
                    margin-top: 2px;
                }
                
                /* Premium SweetAlert Styles */
                .premium-swal-popup {
                    border-radius: 16px !important;
                    padding: 32px 24px !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    border: 1px solid #E2E8F0 !important;
                    font-family: inherit !important;
                }
                .premium-swal-title {
                    font-size: 20px !important;
                    font-weight: 700 !important;
                    color: #1E293B !important;
                    margin-bottom: 8px !important;
                }
                .premium-swal-text {
                    font-size: 14px !important;
                    color: #64748B !important;
                    margin: 0 0 24px 0 !important;
                }
                .premium-swal-icon {
                    border-color: #FCA5A5 !important;
                    color: #EF4444 !important;
                }
                .premium-swal-actions {
                    display: flex !important;
                    gap: 12px !important;
                    width: 100% !important;
                    justify-content: center !important;
                    margin-top: 16px !important;
                }
                .premium-swal-confirm {
                    background: #EF4444 !important;
                    color: #FFFFFF !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    border: none !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2) !important;
                }
                .premium-swal-confirm:hover {
                    background: #DC2626 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3) !important;
                }
                .premium-swal-cancel {
                    background: #FFFFFF !important;
                    color: #475569 !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    border: 1px solid #E2E8F0 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
                }
                .premium-swal-cancel:hover {
                    background: #F8FAFC !important;
                    color: #1E293B !important;
                    border-color: #CBD5E1 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04) !important;
                }
            `}),e.jsxs("div",{className:"premium-container",children:[e.jsxs("div",{className:"premium-header",children:[e.jsx("h1",{className:"premium-title",children:"Empresas"}),e.jsxs("div",{className:"premium-actions",children:[e.jsxs("div",{className:"premium-search-wrapper",children:[e.jsx(F,{size:16,className:"premium-search-icon"}),e.jsx("input",{type:"text",className:"premium-input",placeholder:"Buscar empresas...",value:s,onChange:r=>d(r.target.value),onKeyDown:b})]}),a.length>0&&e.jsxs("div",{style:{fontSize:"13px",color:"#64748B",display:"flex",alignItems:"center",gap:"12px",background:"#FFFFFF",padding:"8px 16px",borderRadius:"10px",border:"1px solid #E2E8F0",boxShadow:"0 2px 4px rgba(0,0,0,0.02)"},children:[e.jsxs("span",{style:{fontWeight:600,color:"#1E293B"},children:[a.length," seleccionados"]}),e.jsxs("button",{onClick:g,className:"premium-btn premium-btn-secondary",style:{padding:"6px 12px",fontSize:"13px",color:"#EF4444",borderColor:"#FEE2E2",background:"#FEF2F2",boxShadow:"none"},children:[e.jsx(N,{size:14})," Eliminar"]})]}),e.jsxs("a",{href:"/admin/crm/export?type=companies",className:"premium-btn premium-btn-secondary",children:[e.jsx(B,{size:16}),e.jsx("span",{children:"Exportar"})]}),e.jsxs("button",{className:"premium-btn premium-btn-primary",onClick:()=>t(!0),children:[e.jsx(C,{size:16}),e.jsx("span",{children:"Crear empresa"})]})]})]}),e.jsx("div",{className:"premium-table-wrapper",children:e.jsx(E,{columns:h,data:x,selectedRows:a,onSelectionChange:p,onRowClick:r=>o.get(`/admin/crm/companies/${r.id}`),onRowDelete:r=>{m.fire({title:"¿Eliminar empresa?",text:`Eliminarás a ${r.nombre}. Esta acción no se puede deshacer.`,icon:"warning",showCancelButton:!0,buttonsStyling:!1,customClass:{popup:"premium-swal-popup",title:"premium-swal-title",htmlContainer:"premium-swal-text",actions:"premium-swal-actions",confirmButton:"premium-swal-confirm",cancelButton:"premium-swal-cancel",icon:"premium-swal-icon"},confirmButtonText:"Sí, eliminar",cancelButtonText:"Cancelar"}).then(i=>{i.isConfirmed&&o.delete(`/admin/crm/companies/${r.id}`,{preserveScroll:!0})})}})})]}),e.jsx(v,{isOpen:u,onClose:()=>t(!1),title:"Nueva Empresa",children:e.jsxs("form",{className:"premium-form",onSubmit:r=>{r.preventDefault();const i=new FormData(r.target);o.post("/admin/crm/companies",Object.fromEntries(i),{onSuccess:()=>t(!1)})},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"},children:[e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Nombre *"}),e.jsx("input",{type:"text",name:"nombre",required:!0,className:"premium-form-input",placeholder:""})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"RUC"}),e.jsx("input",{type:"text",name:"ruc",className:"premium-form-input",placeholder:""})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Dominio web"}),e.jsx("input",{type:"text",name:"dominio",className:"premium-form-input",placeholder:"example.com"}),e.jsx("span",{className:"premium-hint",children:"Usaremos el dominio para que la IA investigue la empresa."})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Industria"}),e.jsx("input",{type:"text",name:"industria",className:"premium-form-input",placeholder:""})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Teléfono"}),e.jsx("input",{type:"text",name:"telefono",className:"premium-form-input",placeholder:""})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Correo Electrónico"}),e.jsx("input",{type:"email",name:"email",className:"premium-form-input",placeholder:"you@example.com"})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Dirección"}),e.jsx("input",{type:"text",name:"direccion",className:"premium-form-input",placeholder:""})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"País"}),e.jsx("input",{type:"text",name:"pais",className:"premium-form-input",placeholder:""})]})]}),e.jsxs("div",{style:{marginTop:"32px",display:"flex",justifyContent:"flex-end",gap:"12px",borderTop:"1px solid #E2E8F0",paddingTop:"20px"},children:[e.jsx("button",{type:"button",className:"premium-btn premium-btn-secondary",onClick:()=>t(!1),children:"Cancelar"}),e.jsx("button",{type:"submit",className:"premium-btn premium-btn-primary",children:"Crear Empresa"})]})]})})]})}export{U as default};

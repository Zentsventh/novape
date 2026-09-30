import{b as T,u as R,r as a,d as h,j as e,H as D,S as W,L as d}from"./app-C3RWgAur.js";import{T as I}from"./TwentyCrmLayout-DDUauhmD.js";import{T as P}from"./TwentyTable-rLjuY2uv.js";import{T as L}from"./TwentyRecordDrawer-CRjVLKVf.js";import{T as $}from"./trash-2-DwNyB8xh.js";import{U as H}from"./upload-RIavpxOV.js";import{D as M}from"./download-DVVxRN-Q.js";import{P as O}from"./plus-D21a16ME.js";import"./PageTransition-DmXVn4w5.js";import"./proxy-B--KSZG2.js";import"./file-text-CxO_i9Lf.js";import"./activity-BCTfrQC1.js";import"./target-DHSvFRoo.js";import"./calendar-BApPTcw6.js";import"./chevron-down-YW5SR-7D.js";import"./x-DU_YHF0l.js";function le(){const w=T(),{clientes:n,filtros:E,flash:U,errors:Y,customFieldsSchema:l,evidenceLedger:p}=R().props,S=n?.data||[],[c,C]=a.useState(E?.buscar||""),g=a.useRef(!0),[i,b]=a.useState([]),[B,f]=a.useState(!1),[s,F]=a.useState(null),[N,y]=a.useState(!1),[x,v]=a.useState(null);a.useEffect(()=>{if(g.current){g.current=!1;return}const r=setTimeout(()=>{h.get("/admin/clientes",{buscar:c},{preserveState:!0,preserveScroll:!0,replace:!0})},400);return()=>clearTimeout(r)},[c]);const k=async()=>{if(!i.length)return;await w(`¿Estás seguro que deseas eliminar ${i.length} cliente(s)? Esta acción moverá los registros a la papelera.`,{title:"¿Eliminar clientes?",confirmText:"Eliminar"})&&h.post("/admin/clientes/bulk-delete",{ids:i},{preserveScroll:!0,onSuccess:()=>b([])})},z=r=>{F(r),f(!0)},m=(r,o)=>{y(!0);const t={...s,custom_fields:{...s.custom_fields||{},[r]:o}};F(t),setTimeout(()=>y(!1),500)},j=(r,o,t,u)=>{v(r),h.post(`/admin/crm/settings/evidence/${r}/resolve`,{action:o,model_type:"user",model_id:s.id,field_name:t,suggested_value:u},{preserveScroll:!0,onFinish:()=>v(null)})},A=[{header:"Nombre",accessor:"nombres",primary:!0,sortable:!0,render:r=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},className:"table-row-hover",children:[e.jsx("div",{className:"avatar-container",style:{width:"32px",height:"32px",borderRadius:"8px",backgroundColor:"#F8FAFC",border:"1px solid #E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:600,color:"#475569",transition:"all 0.2s ease"},children:r.nombres?.charAt(0)}),e.jsxs("div",{children:[e.jsxs("div",{style:{fontWeight:600,color:"#1E293B",transition:"color 0.2s ease"},className:"customer-name",children:[r.nombres," ",r.apellidos]}),e.jsx("div",{style:{fontSize:"12px",color:"#64748B"},children:r.email})]})]})},{header:"Identificación",accessor:"dni",render:r=>e.jsxs("div",{children:[e.jsx("div",{style:{color:"#1E293B",fontWeight:500},children:r.dni||"-"}),e.jsx("div",{style:{fontSize:"12px",color:"#64748B"},children:r.telefono||"-"})]})},{header:"Pedidos",accessor:"pedidos_count",sortable:!0,render:r=>e.jsx("span",{style:{fontWeight:500,color:"#475569"},children:r.pedidos_count})},{header:"Segmento",accessor:"segmento",render:r=>r.segmento?e.jsx("span",{style:{border:`1px solid ${r.segmento.color}40`,color:r.segmento.color,padding:"4px 8px",borderRadius:"6px",fontSize:"11px",fontWeight:600,backgroundColor:`${r.segmento.color}10`,boxShadow:`0 1px 2px ${r.segmento.color}10`},children:r.segmento.nombre}):e.jsx("span",{style:{color:"#94A3B8"},children:"-"})},{header:"Estado",accessor:"estado",render:r=>e.jsxs("span",{style:{color:r.estado==="activo"?"#00B4FF":"#94A3B8",fontSize:"12px",fontWeight:600,display:"flex",alignItems:"center",gap:"6px"},children:[r.estado==="activo"&&e.jsx("div",{style:{width:6,height:6,borderRadius:"50%",backgroundColor:"#00B4FF",boxShadow:"0 0 4px rgba(0,180,255,0.5)"}}),r.estado.charAt(0).toUpperCase()+r.estado.slice(1)]})}],_=e.jsxs("div",{style:{display:"flex",gap:"12px"},children:[e.jsxs(d,{href:"/admin/clientes/importar",className:"premium-btn premium-btn-secondary",children:[e.jsx(H,{size:16}),"Importar CSV"]}),e.jsxs(d,{href:"/admin/exportar/clientes",className:"premium-btn premium-btn-secondary",children:[e.jsx(M,{size:16}),"Exportar"]}),e.jsxs(d,{href:"/admin/clientes/create",className:"premium-btn premium-btn-primary",children:[e.jsx(O,{size:16}),"Nueva Persona"]})]});return e.jsxs(I,{title:"Personas",headerActions:_,children:[e.jsx(D,{title:"Personas (Clientes) - CRM"}),e.jsx("style",{children:`
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
                .premium-search-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 320px;
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
                    width: 100%;
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
                    box-sizing: border-box;
                }
                .premium-btn:active {
                    transform: translateY(0) scale(0.98);
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
                .customer-name:hover {
                    color: #00B4FF !important;
                }
                .table-row-hover:hover .avatar-container {
                    border-color: #00B4FF !important;
                    box-shadow: 0 0 0 2px rgba(0, 180, 255, 0.1);
                    color: #00B4FF !important;
                }
                .premium-drawer-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid #E2E8F0;
                }
                .premium-drawer-avatar {
                    width: 56px;
                    height: 56px;
                    border-radius: 12px;
                    background-color: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 600;
                    color: #00B4FF;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .premium-drawer-field {
                    background: #F8FAFC;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid #E2E8F0;
                    transition: all 0.2s ease;
                }
                .premium-drawer-field:hover {
                    border-color: #CBD5E1;
                    background: #FFFFFF;
                }
                .premium-drawer-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748B;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .premium-drawer-value {
                    font-size: 14px;
                    color: #1E293B;
                    font-weight: 600;
                }
                .premium-pagination a {
                    padding: 6px 12px;
                    font-size: 13px;
                    border: 1px solid #E2E8F0;
                    background-color: #FFFFFF;
                    color: #475569;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .premium-pagination a:hover {
                    background-color: #F8FAFC;
                    border-color: #CBD5E1;
                    color: #1E293B;
                }
                .premium-pagination a.active {
                    background-color: #00B4FF;
                    border-color: #00B4FF;
                    color: #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.2);
                }
            `}),e.jsx("div",{className:"premium-container",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px",flex:1},children:[e.jsxs("div",{style:{display:"flex",gap:"12px",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{className:"premium-search-wrapper",children:[e.jsx(W,{size:16,className:"premium-search-icon"}),e.jsx("input",{type:"text",className:"premium-input",placeholder:"Filtrar personas...",value:c,onChange:r=>C(r.target.value)})]}),i.length>0&&e.jsxs("div",{style:{fontSize:"13px",color:"#64748B",display:"flex",alignItems:"center",gap:"12px",background:"#FFFFFF",padding:"8px 16px",borderRadius:"10px",border:"1px solid #E2E8F0",boxShadow:"0 2px 4px rgba(0,0,0,0.02)"},children:[e.jsxs("span",{style:{fontWeight:600,color:"#1E293B"},children:[i.length," seleccionados"]}),e.jsxs("button",{onClick:k,className:"premium-btn premium-btn-secondary",style:{padding:"6px 12px",fontSize:"13px",color:"#EF4444",borderColor:"#FEE2E2",background:"#FEF2F2",boxShadow:"none"},children:[e.jsx($,{size:14})," Eliminar"]})]})]}),e.jsx("div",{className:"premium-table-wrapper",children:e.jsx(P,{columns:A,data:S,selectedRows:i,onSelectionChange:b,onRowClick:z})}),n?.links&&n.data.length>0&&e.jsx("div",{style:{display:"flex",justifyContent:"flex-end",marginTop:"8px"},children:e.jsx("div",{style:{display:"flex",gap:"6px"},className:"premium-pagination",children:n.links.map((r,o)=>e.jsx(d,{href:r.url||"#",dangerouslySetInnerHTML:{__html:r.label},className:r.active?"active":"",style:{pointerEvents:r.url?"auto":"none",opacity:r.url?1:.5}},o))})})]})}),e.jsx(L,{isOpen:B,onClose:()=>f(!1),title:"Detalles de la Persona",children:s&&e.jsxs("div",{style:{padding:"8px 0"},children:[e.jsxs("div",{className:"premium-drawer-header",children:[e.jsx("div",{className:"premium-drawer-avatar",children:s.nombres?.charAt(0)}),e.jsxs("div",{children:[e.jsxs("h3",{style:{margin:0,fontSize:"20px",color:"#1E293B",fontWeight:700},children:[s.nombres," ",s.apellidos]}),e.jsx("p",{style:{margin:"4px 0 0",fontSize:"14px",color:"#64748B"},children:s.email})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"32px"},children:[e.jsxs("div",{className:"premium-drawer-field",children:[e.jsx("div",{className:"premium-drawer-label",children:"Teléfono"}),e.jsx("div",{className:"premium-drawer-value",children:s.telefono||"No registrado"})]}),e.jsxs("div",{className:"premium-drawer-field",children:[e.jsx("div",{className:"premium-drawer-label",children:"Documento"}),e.jsx("div",{className:"premium-drawer-value",children:s.dni||"No registrado"})]}),e.jsxs("div",{className:"premium-drawer-field",style:{gridColumn:"span 2"},children:[e.jsx("div",{className:"premium-drawer-label",children:"Total Pedidos"}),e.jsx("div",{className:"premium-drawer-value",style:{color:"#00B4FF",fontSize:"16px",fontWeight:700},children:s.pedidos_count})]})]}),l&&l.length>0&&e.jsxs("div",{style:{backgroundColor:"#FFFFFF",padding:"24px",borderRadius:"12px",border:"1px solid #E2E8F0",boxShadow:"0 2px 4px rgba(0,0,0,0.02)"},children:[e.jsx("h4",{style:{margin:"0 0 20px",fontSize:"15px",fontWeight:700,color:"#1E293B"},children:"Campos Personalizados"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:l.map(r=>e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",fontSize:"12px",color:"#475569",fontWeight:600,marginBottom:"8px"},children:r.label}),r.type==="select"?e.jsxs("select",{value:s.custom_fields?.[r.name]||"",onChange:o=>m(r.name,o.target.value),className:"premium-input",style:{width:"100%",padding:"10px 14px"},children:[e.jsx("option",{value:"",children:"Seleccionar..."}),r.options&&JSON.parse(r.options).map((o,t)=>e.jsx("option",{value:o,children:o},t))]}):r.type==="boolean"?e.jsxs("select",{value:s.custom_fields?.[r.name]||"",onChange:o=>m(r.name,o.target.value),className:"premium-input",style:{width:"100%",padding:"10px 14px"},children:[e.jsx("option",{value:"",children:"-"}),e.jsx("option",{value:"1",children:"Sí"}),e.jsx("option",{value:"0",children:"No"})]}):e.jsx("input",{type:r.type==="number"?"number":r.type==="date"?"date":"text",value:s.custom_fields?.[r.name]||"",onChange:o=>m(r.name,o.target.value),className:"premium-input",style:{width:"100%",padding:"10px 14px"},placeholder:`Ingresar ${r.label.toLowerCase()}`})]},r.name))}),N&&e.jsx("div",{style:{marginTop:"12px",fontSize:"12px",color:"#00B4FF",fontWeight:500},children:"Guardando cambios..."})]}),p&&p.filter(r=>r.model_id===s.id).length>0&&e.jsxs("div",{style:{marginTop:"24px",backgroundColor:"#F0F9FF",padding:"20px",borderRadius:"12px",border:"1px solid #BAE6FD",boxShadow:"0 4px 6px -1px rgba(14, 165, 233, 0.05)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"},children:[e.jsx("div",{style:{backgroundColor:"#0EA5E9",color:"white",padding:"6px",borderRadius:"8px",display:"flex",boxShadow:"0 2px 4px rgba(14, 165, 233, 0.2)"},children:e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"})})}),e.jsx("h4",{style:{margin:0,fontSize:"14px",fontWeight:700,color:"#0369A1"},children:"Sugerencias de la IA"})]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:p.filter(r=>r.model_id===s.id).map(r=>{const o=l?.find(u=>u.name===r.field_name),t=o?o.label:r.field_name;return e.jsxs("div",{style:{backgroundColor:"white",border:"1px solid #E0F2FE",borderRadius:"8px",padding:"16px",fontSize:"13px",boxShadow:"0 1px 2px rgba(0,0,0,0.02)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"12px"},children:[e.jsxs("span",{style:{color:"#475569"},children:["Posible valor para ",e.jsx("strong",{children:t}),":"]}),e.jsxs("span",{style:{color:"#0EA5E9",fontSize:"12px",fontWeight:700},children:[r.confidence_score,"% confianza"]})]}),e.jsx("div",{style:{fontWeight:600,color:"#1E293B",marginBottom:"16px",fontSize:"14px"},children:r.suggested_value}),e.jsxs("div",{style:{display:"flex",gap:"8px",justifyContent:"flex-end"},children:[e.jsx("button",{className:"premium-btn",style:{padding:"6px 12px",fontSize:"12px",color:"#EF4444",backgroundColor:"#FEE2E2",border:"none",boxShadow:"none"},onClick:()=>j(r.id,"reject",r.field_name,r.suggested_value),disabled:x===r.id,children:"Ignorar"}),e.jsx("button",{className:"premium-btn",style:{padding:"6px 12px",fontSize:"12px",color:"white",backgroundColor:"#0EA5E9",border:"none"},onClick:()=>j(r.id,"accept",r.field_name,r.suggested_value),disabled:x===r.id,children:x===r.id?"Guardando...":"Aceptar Dato"})]})]},r.id)})})]})]})})]})}export{le as default};

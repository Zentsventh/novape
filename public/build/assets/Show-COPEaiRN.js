import{c as m,r as x,j as e,H as u,L as c,d as h}from"./app-C3RWgAur.js";import{T as g,S as b}from"./TwentyCrmLayout-DDUauhmD.js";import{S as f}from"./sweetalert2.esm.all-DE6NlnlT.js";import{T as j,S as p}from"./TimelineTab-DgLbzNlS.js";import{B as F}from"./building-2-BjCENwF_.js";import{T as v}from"./target-DHSvFRoo.js";import{U as y,M as N}from"./PageTransition-DmXVn4w5.js";import{P as E}from"./phone-BL5P4w7z.js";import{M as k}from"./map-pin-CFA5rTbX.js";import"./file-text-CxO_i9Lf.js";import"./activity-BCTfrQC1.js";import"./plus-D21a16ME.js";import"./proxy-B--KSZG2.js";import"./calendar-BApPTcw6.js";import"./clock-YONy9r1q.js";import"./message-circle-DBkhwSZt.js";import"./circle-alert-BWmFPp6B.js";const w=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],B=m("globe",w);function O({company:r={},evidenceLedger:n=[],customFieldsSchema:l=[]}){const[s,d]=x.useState("resumen"),o=(i,t,a)=>{h.post(`/admin/crm/settings/evidence/${i}/resolve`,{action:t,model_type:a.model_type,model_id:a.model_id,field_name:a.field_name,suggested_value:a.suggested_value},{preserveScroll:!0,onSuccess:()=>{t==="accept"&&f.fire({toast:!0,position:"bottom-end",icon:"success",title:"Sugerencia aceptada y guardada",showConfirmButton:!1,timer:2e3})}})};return e.jsxs(g,{title:r.nombre,children:[e.jsx(u,{title:`${r.nombre} - Empresas`}),e.jsx("style",{children:`
                .premium-wrapper {
                    display: flex;
                    height: 100%;
                    font-family: inherit;
                    background-color: #F8FAFC;
                }
                .premium-main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid #E2E8F0;
                    background: #FAFAFA;
                }
                .premium-header-area {
                    padding: 32px 40px 0;
                    background: #FFFFFF;
                    border-bottom: 1px solid #E2E8F0;
                }
                .premium-company-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1E293B;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.02em;
                }
                .premium-company-domain {
                    color: #64748B;
                    font-size: 14px;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }
                .premium-company-domain:hover {
                    color: #00B4FF;
                }
                .premium-avatar-container {
                    width: 56px;
                    height: 56px;
                    background: #F1F5F9;
                    border-radius: 12px;
                    border: 1px solid #E2E8F0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .premium-tabs {
                    display: flex;
                    gap: 28px;
                    margin-top: 24px;
                }
                .premium-tab-btn {
                    background: none;
                    border: none;
                    padding: 0 0 14px 0;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                .premium-tab-btn.active {
                    color: #00B4FF;
                    font-weight: 600;
                }
                .premium-tab-btn:not(.active) {
                    color: #64748B;
                    font-weight: 500;
                }
                .premium-tab-btn:not(.active):hover {
                    color: #1E293B;
                }
                .premium-tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #00B4FF;
                    border-radius: 2px 2px 0 0;
                }
                .premium-content-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 32px 40px;
                }
                .premium-card {
                    background: #FFFFFF;
                    border-radius: 12px;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02), 0 4px 6px -1px rgba(0,0,0,0.02);
                    padding: 24px;
                    transition: all 0.3s ease;
                }
                .premium-card:hover {
                    box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 10px 15px -3px rgba(0,0,0,0.03);
                }
                .premium-card-title {
                    margin: 0 0 20px 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1E293B;
                }
                .premium-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                }
                .premium-field-label {
                    color: #64748B;
                    font-size: 12px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 500;
                }
                .premium-field-value {
                    color: #1E293B;
                    font-size: 14px;
                    font-weight: 500;
                }
                .premium-sidebar {
                    width: 360px;
                    background: #FFFFFF;
                    display: flex;
                    flex-direction: column;
                }
                .premium-sidebar-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #E2E8F0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #F8FAFC;
                }
                .premium-sidebar-content {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                }
                .ai-suggestion-card {
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                }
                .ai-suggestion-card:hover {
                    border-color: #CBD5E1;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
                    transform: translateY(-2px);
                }
                .premium-btn {
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }
                .premium-btn-primary {
                    background: #00B4FF;
                    color: #FFFFFF;
                }
                .premium-btn-primary:hover {
                    background: #00A2E8;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.2);
                }
                .premium-btn-secondary {
                    background: #FFFFFF;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    color: #1E293B;
                    border-color: #CBD5E1;
                }
                .premium-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .premium-table th {
                    text-align: left;
                    padding: 12px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748B;
                    border-bottom: 1px solid #E2E8F0;
                    background: #F8FAFC;
                }
                .premium-table td {
                    padding: 16px;
                    font-size: 14px;
                    color: #1E293B;
                    border-bottom: 1px solid #F1F5F9;
                }
                .premium-table tr:hover td {
                    background: #F8FAFC;
                }
            `}),e.jsxs("div",{className:"premium-wrapper",children:[e.jsxs("div",{className:"premium-main-content",children:[e.jsxs("div",{className:"premium-header-area",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"20px"},children:[e.jsx("div",{className:"premium-avatar-container",children:r.logo_url?e.jsx("img",{src:r.logo_url,alt:"Logo",style:{width:"100%",height:"100%",objectFit:"cover"}}):e.jsx(F,{size:24,color:"#94A3B8"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"premium-company-title",children:r.nombre}),r.dominio&&e.jsxs("a",{href:`https://${r.dominio}`,target:"_blank",rel:"noreferrer",className:"premium-company-domain",children:[e.jsx(B,{size:12,style:{display:"inline",marginRight:"4px",verticalAlign:"middle"}}),r.dominio]})]})]}),e.jsxs("div",{className:"premium-tabs",children:[e.jsx("button",{onClick:()=>d("resumen"),className:`premium-tab-btn ${s==="resumen"?"active":""}`,children:"Resumen"}),e.jsxs("button",{onClick:()=>d("personas"),className:`premium-tab-btn ${s==="personas"?"active":""}`,children:["Contactos (",r.personas?.length||0,")"]}),e.jsxs("button",{onClick:()=>d("deals"),className:`premium-tab-btn ${s==="deals"?"active":""}`,children:["Oportunidades (",r.deals?.length||0,")"]}),e.jsx("button",{onClick:()=>d("actividad"),className:`premium-tab-btn ${s==="actividad"?"active":""}`,children:"Actividad"})]})]}),e.jsxs("div",{className:"premium-content-area",children:[s==="resumen"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("div",{className:"premium-card",children:[e.jsx("h3",{className:"premium-card-title",children:"Información General"}),e.jsxs("div",{className:"premium-grid",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"premium-field-label",children:[e.jsx(v,{size:14})," Industria"]}),e.jsx("div",{className:"premium-field-value",children:r.industria||"-"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"premium-field-label",children:[e.jsx(b,{size:14})," RUC"]}),e.jsx("div",{className:"premium-field-value",children:r.ruc||"-"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"premium-field-label",children:[e.jsx(y,{size:14})," Tamaño"]}),e.jsx("div",{className:"premium-field-value",style:{textTransform:"capitalize"},children:r.tamaño||"-"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"premium-field-label",children:[e.jsx(E,{size:14})," Teléfono"]}),e.jsx("div",{className:"premium-field-value",children:r.telefono||"-"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"premium-field-label",children:[e.jsx(N,{size:14})," Email"]}),e.jsx("div",{className:"premium-field-value",children:r.email||"-"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"premium-field-label",children:[e.jsx(k,{size:14})," Dirección"]}),e.jsxs("div",{className:"premium-field-value",children:[r.direccion||"-"," ",r.ciudad?`, ${r.ciudad}`:""," ",r.pais?`(${r.pais})`:""]})]})]})]}),l.length>0&&e.jsxs("div",{className:"premium-card",children:[e.jsx("h3",{className:"premium-card-title",children:"Campos Personalizados"}),e.jsx("div",{className:"premium-grid",children:l.map(i=>e.jsxs("div",{children:[e.jsx("div",{className:"premium-field-label",children:i.label}),e.jsx("div",{className:"premium-field-value",children:r.custom_fields&&r.custom_fields[i.name]?r.custom_fields[i.name]:"-"})]},i.id))})]})]}),s==="personas"&&e.jsx("div",{className:"premium-card",style:{padding:0,overflow:"hidden"},children:e.jsxs("table",{className:"premium-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Nombre"}),e.jsx("th",{children:"Email"}),e.jsx("th",{children:"Teléfono"})]})}),e.jsx("tbody",{children:r.personas?.length>0?r.personas.map(i=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs(c,{href:`/admin/clientes/${i.id}`,style:{color:"#1E293B",textDecoration:"none",fontWeight:500},children:[i.nombres," ",i.apellidos]})}),e.jsx("td",{children:i.email}),e.jsx("td",{children:i.telefono||"-"})]},i.id)):e.jsx("tr",{children:e.jsx("td",{colSpan:"3",style:{textAlign:"center",padding:"40px",color:"#94A3B8"},children:"No hay contactos asociados a esta empresa."})})})]})}),s==="deals"&&e.jsx("div",{className:"premium-card",style:{padding:0,overflow:"hidden"},children:e.jsxs("table",{className:"premium-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Oportunidad"}),e.jsx("th",{children:"Etapa"}),e.jsx("th",{children:"Valor"}),e.jsx("th",{children:"Estado"})]})}),e.jsx("tbody",{children:r.deals?.length>0?r.deals.map(i=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx(c,{href:`/admin/crm/pipeline?search=${encodeURIComponent(i.titulo)}`,style:{color:"#1E293B",textDecoration:"none",fontWeight:500},children:i.titulo})}),e.jsx("td",{children:e.jsx("span",{style:{background:"#F1F5F9",color:"#475569",padding:"4px 10px",borderRadius:"6px",fontSize:"12px",fontWeight:500},children:i.stage?.nombre||"-"})}),e.jsxs("td",{style:{fontWeight:500},children:["S/ ",Number(i.valor).toFixed(2)]}),e.jsxs("td",{children:[i.estado==="open"&&e.jsx("span",{style:{color:"#D97706",background:"#FEF3C7",padding:"4px 8px",borderRadius:"4px",fontSize:"12px",fontWeight:600},children:"Abierto"}),i.estado==="won"&&e.jsx("span",{style:{color:"#059669",background:"#D1FAE5",padding:"4px 8px",borderRadius:"4px",fontSize:"12px",fontWeight:600},children:"Ganado"}),i.estado==="lost"&&e.jsx("span",{style:{color:"#E11D48",background:"#FFE4E6",padding:"4px 8px",borderRadius:"4px",fontSize:"12px",fontWeight:600},children:"Perdido"})]})]},i.id)):e.jsx("tr",{children:e.jsx("td",{colSpan:"4",style:{textAlign:"center",padding:"40px",color:"#94A3B8"},children:"No hay oportunidades abiertas para esta empresa."})})})]})}),s==="actividad"&&e.jsx("div",{className:"premium-card",style:{maxWidth:"800px",margin:"0 auto",padding:"32px"},children:e.jsx(j,{events:r.timeline_events||[]})})]})]}),e.jsxs("div",{className:"premium-sidebar",children:[e.jsxs("div",{className:"premium-sidebar-header",children:[e.jsx("div",{style:{background:"rgba(0, 180, 255, 0.1)",padding:"6px",borderRadius:"8px",display:"flex"},children:e.jsx(p,{size:16,color:"#00B4FF"})}),e.jsx("span",{style:{fontWeight:600,color:"#1E293B",fontSize:"15px"},children:"CompAI Agent"})]}),e.jsx("div",{className:"premium-sidebar-content",children:n.length>0?e.jsxs("div",{style:{display:"flex",flexDirection:"column"},children:[e.jsx("p",{style:{fontSize:"13px",color:"#64748B",margin:"0 0 16px",lineHeight:"1.5"},children:"El agente ha investigado esta empresa y tiene sugerencias:"}),n.map(i=>{const t=l.find(a=>a.name===i.field_name);return e.jsxs("div",{className:"ai-suggestion-card",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},children:[e.jsx("span",{style:{fontSize:"13px",fontWeight:600,color:"#1E293B"},children:t?t.label:i.field_name}),e.jsxs("span",{style:{fontSize:"11px",background:"#F1F5F9",color:"#475569",padding:"4px 8px",borderRadius:"12px",fontWeight:600},children:[i.confidence_score,"% Confianza"]})]}),e.jsx("div",{style:{fontSize:"14px",color:"#334155",marginBottom:"16px",wordBreak:"break-word",lineHeight:"1.5",padding:"10px",background:"#F8FAFC",borderRadius:"6px",border:"1px solid #F1F5F9"},children:i.suggested_value}),e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("button",{onClick:()=>o(i.id,"accept",i),className:"premium-btn premium-btn-primary",style:{flex:1},children:"Aceptar"}),e.jsx("button",{onClick:()=>o(i.id,"reject",i),className:"premium-btn premium-btn-secondary",style:{flex:1},children:"Descartar"})]})]},i.id)})]}):e.jsxs("div",{style:{textAlign:"center",padding:"48px 24px",color:"#94A3B8"},children:[e.jsx("div",{style:{width:"48px",height:"48px",background:"#F8FAFC",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"},children:e.jsx(p,{size:24,style:{opacity:.5},color:"#64748B"})}),e.jsx("p",{style:{margin:0,fontSize:"14px",lineHeight:"1.5"},children:"El agente de IA no tiene sugerencias pendientes para esta empresa."})]})})]})]})]})}export{O as default};

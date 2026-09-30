import{a as p,j as e,H as d,L as n}from"./app-C3RWgAur.js";import{T as c}from"./TwentyCrmLayout-DDUauhmD.js";import{U as x}from"./user-plus-CvbzmAd8.js";import{A as u}from"./arrow-left-B8O8Dm6C.js";import{S as h}from"./save-CgfXDeO6.js";import"./PageTransition-DmXVn4w5.js";import"./proxy-B--KSZG2.js";import"./file-text-CxO_i9Lf.js";import"./activity-BCTfrQC1.js";import"./plus-D21a16ME.js";import"./target-DHSvFRoo.js";import"./calendar-BApPTcw6.js";function E(){const{data:s,setData:o,post:t,processing:l,errors:i}=p({nombres:"",apellidos:"",email:"",password:"",tipo_documento:"DNI",dni:"",telefono:"+51 ",telefono_secundario:""}),m=r=>{r.preventDefault(),t("/admin/clientes")};return e.jsxs(c,{title:"Nueva Persona",children:[e.jsx(d,{title:"Nueva Persona - CRM"}),e.jsx("style",{children:`
                .premium-container {
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: inherit;
                }
                .premium-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }
                .premium-title-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .premium-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #F0F9FF;
                    color: #00B4FF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #E0F2FE;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.05);
                }
                .premium-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1E293B;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .premium-back-link {
                    color: #64748B;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: color 0.2s ease;
                    padding: 8px 12px;
                    border-radius: 8px;
                }
                .premium-back-link:hover {
                    color: #1E293B;
                    background: #F1F5F9;
                }
                .premium-card {
                    background: #FFFFFF;
                    border-radius: 16px;
                    border: 1px solid #E2E8F0;
                    padding: 40px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
                }
                .premium-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                .premium-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .premium-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1E293B;
                }
                .premium-input {
                    padding: 12px 16px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #F8FAFC;
                    outline: none;
                    transition: all 0.2s ease;
                    width: 100%;
                    box-sizing: border-box;
                }
                .premium-input:focus {
                    border-color: #00B4FF;
                    background: #FFFFFF;
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.15);
                }
                .premium-input::placeholder {
                    color: #94A3B8;
                }
                .premium-error {
                    color: #EF4444;
                    font-size: 12px;
                    margin-top: 4px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .premium-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 40px;
                    padding-top: 24px;
                    border-top: 1px solid #E2E8F0;
                }
                .premium-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 24px;
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
                .premium-btn-secondary {
                    background: #FFFFFF;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    border-color: #CBD5E1;
                    color: #1E293B;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
                }
                .premium-btn-primary {
                    background: #00B4FF;
                    color: #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.2);
                }
                .premium-btn-primary:hover:not(:disabled) {
                    background: #00A2E8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0, 180, 255, 0.3);
                }
                .premium-btn-primary:disabled {
                    background: #94A3B8;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
            `}),e.jsxs("div",{className:"premium-container",children:[e.jsxs("div",{className:"premium-header",children:[e.jsxs("div",{className:"premium-title-wrapper",children:[e.jsx("div",{className:"premium-icon-box",children:e.jsx(x,{size:24})}),e.jsx("h1",{className:"premium-title",children:"Añadir Persona"})]}),e.jsxs(n,{href:"/admin/clientes",className:"premium-back-link",children:[e.jsx(u,{size:16}),"Volver a Personas"]})]}),e.jsx("div",{className:"premium-card",children:e.jsxs("form",{onSubmit:m,autoComplete:"off",children:[e.jsxs("div",{className:"premium-form-grid",style:{marginBottom:"24px"},children:[e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Nombres *"}),e.jsx("input",{type:"text",value:s.nombres,onChange:r=>o("nombres",r.target.value),className:"premium-input",placeholder:"",required:!0,autoComplete:"off"}),i.nombres&&e.jsxs("div",{className:"premium-error",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),i.nombres]})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Apellidos *"}),e.jsx("input",{type:"text",value:s.apellidos,onChange:r=>o("apellidos",r.target.value),className:"premium-input",placeholder:"",required:!0,autoComplete:"off"}),i.apellidos&&e.jsxs("div",{className:"premium-error",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),i.apellidos]})]})]}),e.jsxs("div",{className:"premium-form-grid",style:{marginBottom:"24px"},children:[e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Email *"}),e.jsx("input",{type:"email",value:s.email,onChange:r=>o("email",r.target.value),className:"premium-input",placeholder:"you@example.com",required:!0,autoComplete:"new-password"}),i.email&&e.jsxs("div",{className:"premium-error",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),i.email]})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Contraseña *"}),e.jsx("input",{type:"password",value:s.password,onChange:r=>o("password",r.target.value),className:"premium-input",placeholder:"",required:!0,autoComplete:"new-password"}),i.password&&e.jsxs("div",{className:"premium-error",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),i.password]})]})]}),e.jsxs("div",{className:"premium-form-grid",style:{marginBottom:"24px"},children:[e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Documento de Identidad"}),e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsxs("select",{value:s.tipo_documento,onChange:r=>o("tipo_documento",r.target.value),className:"premium-input",style:{width:"130px",cursor:"pointer"},children:[e.jsx("option",{value:"DNI",children:"DNI"}),e.jsx("option",{value:"RUC",children:"RUC"}),e.jsx("option",{value:"CE",children:"C.E."}),e.jsx("option",{value:"PAS",children:"PAS"}),e.jsx("option",{value:"OTRO",children:"OTRO"})]}),e.jsx("input",{type:"text",value:s.dni,onChange:r=>{const a=r.target.value;s.tipo_documento==="DNI"?/^\d{0,8}$/.test(a)&&o("dni",a):o("dni",a)},minLength:s.tipo_documento==="DNI"?8:void 0,maxLength:s.tipo_documento==="DNI"?8:void 0,className:"premium-input",placeholder:"",required:s.tipo_documento==="DNI"})]}),i.dni&&e.jsxs("div",{className:"premium-error",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),i.dni]})]}),e.jsxs("div",{className:"premium-form-group",children:[e.jsx("label",{className:"premium-label",children:"Teléfono Principal"}),e.jsx("input",{type:"text",value:s.telefono,onChange:r=>o("telefono",r.target.value),className:"premium-input",placeholder:""}),i.telefono&&e.jsxs("div",{className:"premium-error",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),i.telefono]})]})]}),e.jsxs("div",{className:"premium-form-grid",children:[e.jsxs("div",{className:"premium-form-group",children:[e.jsxs("label",{className:"premium-label",children:["Teléfono Secundario ",e.jsx("span",{style:{color:"#94A3B8",fontWeight:500},children:"(Opcional)"})]}),e.jsx("input",{type:"text",value:s.telefono_secundario,onChange:r=>o("telefono_secundario",r.target.value),className:"premium-input",placeholder:""}),i.telefono_secundario&&e.jsxs("div",{className:"premium-error",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),i.telefono_secundario]})]}),e.jsx("div",{className:"premium-form-group"})]}),e.jsxs("div",{className:"premium-footer",children:[e.jsx(n,{href:"/admin/clientes",className:"premium-btn premium-btn-secondary",children:"Cancelar"}),e.jsxs("button",{type:"submit",disabled:l,className:"premium-btn premium-btn-primary",children:[e.jsx(h,{size:18}),l?"Guardando...":"Crear Persona"]})]})]})})]})]})}export{E as default};

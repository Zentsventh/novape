import{r as b,u as m,i as j,j as e,d as p}from"./app-C3RWgAur.js";function k({isOpen:a,onClose:o,categorias:l=[]}){const[s,n]=b.useState(null),{auth:x}=m().props,{isMobile:i}=j(),d=x?.user,t=l.find(r=>r.id===s),f=r=>{i||n(r)},g=r=>{i?n(r.id):c(r.nombre)},u=r=>{p.get("/catalogo",{categoria:t.nombre,subcategoria:r},{preserveScroll:!0,onFinish:o})},c=r=>{p.get("/catalogo",{categoria:r},{preserveScroll:!0,onFinish:o})},h=()=>{n(null)};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
                .premium-cat-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    color: #1E293B;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 6px;
                    text-align: left;
                }
                .premium-cat-item:hover {
                    background: #f8fafc;
                    color: #00B4FF;
                    transform: translateX(4px);
                }
                .premium-cat-item.is-active {
                    background: rgba(0, 180, 255, 0.08);
                    color: #00B4FF;
                    font-weight: 700;
                }
                .premium-sub-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    text-align: left;
                    padding: 14px 16px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1E293B;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }
                .premium-sub-item:hover {
                    border-color: #00B4FF;
                    box-shadow: 0 8px 16px rgba(0, 180, 255, 0.12);
                    transform: translateY(-3px);
                    color: #00B4FF;
                }
                .premium-sub-item:hover svg {
                    stroke: #00B4FF;
                    transform: translateX(3px);
                }
                .premium-sub-item svg {
                    transition: all 0.2s ease;
                }
                .premium-btn-outline {
                    font-size: 12px;
                    font-weight: 600;
                    color: #00B4FF;
                    background: rgba(0, 180, 255, 0.05);
                    padding: 6px 16px;
                    border-radius: 20px;
                    border: 1px solid rgba(0, 180, 255, 0.2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .premium-btn-outline:hover {
                    background: #00B4FF;
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(0, 180, 255, 0.3);
                    border-color: #00B4FF;
                    transform: translateY(-1px);
                }
            `}),e.jsx("div",{className:`efe-cat-drawer-overlay ${a?"is-open":""}`,onClick:o,style:{backdropFilter:"blur(4px)",transition:"all 0.3s ease"}}),e.jsxs("div",{className:`efe-cat-drawer ${a?"is-open":""} ${i&&s?"show-right":""}`,style:{boxShadow:"20px 0 25px -5px rgba(0, 0, 0, 0.1), 8px 0 10px -6px rgba(0, 0, 0, 0.1)"},children:[e.jsxs("div",{className:"efe-cat-drawer-left",style:{borderRight:"1px solid #f1f5f9",background:"#ffffff"},children:[e.jsxs("div",{className:"efe-cat-drawer-header",style:{background:"#ffffff",borderBottom:"1px solid #f1f5f9",paddingBottom:"20px",paddingTop:"20px",marginBottom:"16px",paddingLeft:"20px",paddingRight:"20px"},children:[e.jsx("h3",{style:{fontSize:"18px",fontWeight:"800",color:"#0f172a",margin:0},children:d?.nombres?`¡Hola, ${d.nombres.split(" ")[0]}!`:"¡Hola!"}),e.jsx("button",{className:"efe-cat-drawer-close",onClick:o,style:{background:"transparent",border:"none",padding:"4px",cursor:"pointer",transition:"all 0.2s",color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center"},onMouseOver:r=>{r.currentTarget.style.color="#0f172a",r.currentTarget.style.transform="rotate(90deg)"},onMouseOut:r=>{r.currentTarget.style.color="#94a3b8",r.currentTarget.style.transform="rotate(0deg)"},children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsx("div",{className:"efe-cat-drawer-list",children:l.map(r=>e.jsxs("button",{className:`premium-cat-item ${s===r.id?"is-active":""}`,onMouseEnter:()=>f(r.id),onClick:()=>g(r),children:[e.jsx("span",{children:r.nombre}),e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"9 18 15 12 9 6"})})]},r.id))})]}),e.jsx("div",{className:"efe-cat-drawer-right",style:{background:"#f8fafc",padding:"32px"},children:t?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"efe-cat-drawer-sub-header",style:{display:"flex",flexDirection:"column",gap:"15px",marginBottom:"24px",borderBottom:"1px solid #e2e8f0",paddingBottom:"20px"},children:[i&&e.jsxs("button",{onClick:h,style:{alignSelf:"flex-start",background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:"8px",color:"#64748b",fontSize:"13px",display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",padding:"8px 12px",fontWeight:"600",boxShadow:"0 1px 2px rgba(0,0,0,0.05)",transition:"all 0.2s"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"19",y1:"12",x2:"5",y2:"12"}),e.jsx("polyline",{points:"12 19 5 12 12 5"})]}),"Volver"]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"},children:[e.jsxs("h4",{style:{fontSize:"22px",fontWeight:"800",color:"#0f172a",position:"relative",margin:0,letterSpacing:"-0.5px"},children:[t.nombre,e.jsx("span",{style:{position:"absolute",bottom:"-22px",left:0,width:"48px",height:"4px",background:"#00B4FF",borderRadius:"4px"}})]}),e.jsx("button",{onClick:()=>c(t.nombre),className:"premium-btn-outline",children:"Explorar todo"})]})]}),e.jsx("div",{className:"efe-cat-drawer-sub-list",style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))",gap:"16px",marginTop:"24px",overflowY:"auto",paddingBottom:"20px"},children:t.subcategorias&&t.subcategorias.length>0?t.subcategorias.map(r=>e.jsxs("button",{className:"premium-sub-item",type:"button",onClick:()=>u(r.nombre),children:[e.jsx("span",{children:r.nombre}),e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"#94a3b8",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0},children:e.jsx("polyline",{points:"9 18 15 12 9 6"})})]},r.id)):e.jsx("div",{style:{gridColumn:"1 / -1",background:"#ffffff",borderRadius:"12px",padding:"40px 30px",border:"1px dashed #cbd5e1",textAlign:"center"},children:e.jsx("div",{style:{color:"#64748b",fontWeight:"500",fontSize:"14px"},children:"No hay subcategorías disponibles."})})})]}):e.jsxs("div",{className:"efe-cat-drawer-empty",style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"#94a3b8",gap:"16px",fontSize:"15px",textAlign:"center",padding:"40px",fontWeight:"500"},children:[e.jsx("div",{style:{background:"#ffffff",padding:"20px",borderRadius:"50%",boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"},children:e.jsxs("svg",{width:"40",height:"40",viewBox:"0 0 24 24",fill:"none",stroke:"#cbd5e1",strokeWidth:"2",children:[e.jsx("path",{d:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"}),e.jsx("polyline",{points:"22,6 12,13 2,6"})]})}),e.jsxs("span",{children:["Desliza el cursor sobre una categoría",e.jsx("br",{}),"para explorar sus opciones"]})]})})]})]})}export{k as C};

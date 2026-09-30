import{u as h,r as g,j as e,d as o}from"./app-C3RWgAur.js";import{D as b,L as y}from"./Header-D1W8Q-RG.js";const s=i=>new Intl.NumberFormat("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(i);function v({cart:i,isOpen:c,onClose:t}){const{auth:d,flash:l}=h().props,[m,a]=g.useState(!1);i?.total;const p=(r,f,u)=>{const n=f+u;n<1||n>5||o.post("/cart/update",{producto_id:r,cantidad:n},{preserveScroll:!0})},x=r=>{o.post("/cart/remove",{producto_id:r},{preserveScroll:!0})};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
                .premium-cart-drawer {
                    background: #ffffff;
                    box-shadow: -20px 0 30px -10px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                }
                .premium-cart-header {
                    background: #ffffff;
                    border-bottom: 1px solid #f1f5f9;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .premium-cart-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .premium-cart-close {
                    background: transparent;
                    border: none;
                    padding: 6px;
                    cursor: pointer;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    border-radius: 50%;
                }
                .premium-cart-close:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                    transform: rotate(90deg);
                }
                .premium-cart-clear {
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: underline;
                    text-decoration-color: transparent;
                }
                .premium-cart-clear:hover {
                    color: #dc2626;
                    text-decoration-color: #dc2626;
                }
                .premium-cart-body {
                    background: #f8fafc;
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    flex: 1;
                }
                .premium-cart-item {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    gap: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .premium-cart-item:hover {
                    border-color: #00B4FF;
                    box-shadow: 0 8px 20px rgba(0, 180, 255, 0.08);
                    transform: translateY(-2px);
                }
                .premium-cart-img-container {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .premium-cart-img-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    padding: 4px;
                }
                .premium-cart-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding-right: 24px;
                }
                .premium-cart-brand {
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                .premium-cart-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1E293B;
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .premium-cart-price {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .premium-qty-ctrl {
                    display: flex;
                    align-items: center;
                    background: #f1f5f9;
                    border-radius: 20px;
                    padding: 4px 8px;
                    gap: 12px;
                    width: fit-content;
                    margin-top: 12px;
                }
                .premium-qty-btn {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0 4px;
                    transition: color 0.2s;
                }
                .premium-qty-btn:hover {
                    color: #00B4FF;
                }
                .premium-qty-val {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    min-width: 12px;
                    text-align: center;
                }
                .premium-remove-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: transparent;
                    border: none;
                    color: #cbd5e1;
                    cursor: pointer;
                    padding: 6px;
                    transition: all 0.2s;
                    border-radius: 8px;
                }
                .premium-remove-btn:hover {
                    background: #fef2f2;
                    color: #ef4444;
                }
                .premium-cart-footer {
                    background: #ffffff;
                    border-top: 1px solid #e2e8f0;
                    padding: 24px;
                    box-shadow: 0 -4px 10px rgba(0,0,0,0.02);
                }
                .premium-summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .premium-summary-label {
                    font-size: 15px;
                    font-weight: 600;
                    color: #64748b;
                }
                .premium-summary-val {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .premium-btn-primary {
                    background: #00B4FF;
                    color: #ffffff;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(0, 180, 255, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                }
                .premium-btn-primary:hover {
                    background: #009ce0;
                    box-shadow: 0 6px 16px rgba(0, 180, 255, 0.35);
                    transform: translateY(-2px);
                }
                .premium-btn-secondary {
                    background: #ffffff;
                    color: #334155;
                    border: 1px solid #cbd5e1;
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                }
                .premium-btn-secondary:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                    color: #0f172a;
                    transform: translateY(-1px);
                }
            `}),e.jsx("div",{className:`efe-cart-overlay ${c?"is-open":""}`,onClick:t,style:{backdropFilter:"blur(4px)",transition:"all 0.3s ease"}}),e.jsxs("div",{className:`efe-cart-drawer premium-cart-drawer ${c?"is-open":""}`,children:[e.jsxs("div",{className:"premium-cart-header",children:[e.jsxs("h2",{className:"premium-cart-title",children:[e.jsx("button",{className:"premium-cart-close",onClick:t,children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})}),"Tu Carrito"]}),i?.items?.length>0&&e.jsx("button",{className:"premium-cart-clear",onClick:()=>o.post("/cart/clear"),children:"Vaciar carrito"})]}),l?.error&&e.jsxs("div",{style:{margin:"16px 24px 0",padding:"12px 16px",backgroundColor:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:"8px",fontSize:"13px",fontWeight:"500",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),l.error]}),e.jsx("div",{className:"premium-cart-body",children:i?.items?.length?i.items.map(r=>e.jsxs("div",{className:"premium-cart-item",children:[e.jsx("div",{className:"premium-cart-img-container",children:e.jsx("img",{src:r.imagen||b,alt:r.nombre})}),e.jsxs("div",{className:"premium-cart-info",children:[e.jsx("span",{className:"premium-cart-brand",children:r.marca||"GENÉRICO"}),e.jsx("h4",{className:"premium-cart-name",children:r.nombre}),e.jsxs("span",{className:"premium-cart-price",children:["S/ ",s(r.precio)]}),e.jsxs("div",{className:"premium-qty-ctrl",children:[e.jsx("button",{className:"premium-qty-btn",onClick:()=>p(r.id,r.cantidad,-1),children:"-"}),e.jsx("span",{className:"premium-qty-val",children:r.cantidad}),e.jsx("button",{className:"premium-qty-btn",onClick:()=>p(r.id,r.cantidad,1),children:"+"})]})]}),e.jsx("button",{className:"premium-remove-btn",onClick:()=>x(r.id),title:"Eliminar producto",children:e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("polyline",{points:"3 6 5 6 21 6"}),e.jsx("path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"})]})})]},r.id)):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"#94a3b8",textAlign:"center",gap:"16px"},children:[e.jsx("div",{style:{background:"#ffffff",padding:"24px",borderRadius:"50%",boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"},children:e.jsxs("svg",{width:"48",height:"48",viewBox:"0 0 24 24",fill:"none",stroke:"#cbd5e1",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"9",cy:"21",r:"1"}),e.jsx("circle",{cx:"20",cy:"21",r:"1"}),e.jsx("path",{d:"M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"})]})}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 8px",color:"#0f172a",fontSize:"18px",fontWeight:"700"},children:"Tu carrito está vacío"}),e.jsx("p",{style:{margin:0,fontSize:"14px",color:"#64748b"},children:"¡Agrega productos increíbles y aprovecha nuestras ofertas!"})]})]})}),i?.items?.length>0&&e.jsxs("div",{className:"premium-cart-footer",children:[e.jsxs("div",{className:"premium-summary-row",style:{marginBottom:"4px"},children:[e.jsx("span",{className:"premium-summary-label",style:{fontSize:"13px",fontWeight:"500"},children:"Subtotal"}),e.jsxs("span",{style:{fontSize:"14px",fontWeight:"600",color:"#334155"},children:["S/ ",s(i.total)]})]}),e.jsxs("div",{className:"premium-summary-row",style:{marginBottom:"16px",borderBottom:"1px dashed #e2e8f0",paddingBottom:"16px"},children:[e.jsx("span",{className:"premium-summary-label",style:{fontSize:"13px",fontWeight:"500",color:"#10b981"},children:"Descuentos"}),e.jsx("span",{style:{fontSize:"14px",fontWeight:"600",color:"#10b981"},children:"- S/ 0.00"})]}),e.jsxs("div",{className:"premium-summary-row",children:[e.jsx("span",{className:"premium-summary-label",children:"Total a pagar"}),e.jsxs("span",{className:"premium-summary-val",children:["S/ ",s(i.total)]})]}),e.jsxs("div",{style:{display:"flex",gap:"12px",marginTop:"24px"},children:[e.jsx("button",{className:"premium-btn-secondary",onClick:t,children:"Seguir comprando"}),e.jsxs("button",{className:"premium-btn-primary",onClick:()=>{d.user?(t(),o.get("/checkout")):a(!0)},children:["Ir a Pagar",e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})]})]})]})]}),e.jsx(y,{isOpen:m,onClose:()=>a(!1),onSuccessCallback:()=>{a(!1),t(),o.get("/checkout")}})]})}export{v as C};

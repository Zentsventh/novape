import{r as n,j as e,d as h,u as Q,i as U,H as X,L as I}from"./app-C3RWgAur.js";import{D as u,H as K,L as ee}from"./Header-D1W8Q-RG.js";import{C as te}from"./CategoryNavBar-Cvidz6Ee.js";import{C as ie}from"./category-drawer-BWeKtsZq.js";import{F as re}from"./Footer-R5sRne3h.js";/* empty css             *//* empty css               *//* empty css               */import{C as oe}from"./CartDrawer-CPD-_eKH.js";import"./sweetalert2.esm.all-DE6NlnlT.js";function ne({isOpen:t,onClose:p,producto:k}){const[F,s]=n.useState([]),[L,C]=n.useState(!0),[b,z]=n.useState(!1),[g,f]=n.useState(""),[W,y]=n.useState([]),[S,N]=n.useState(!1);if(n.useEffect(()=>{t&&(C(!0),fetch("/wishlist/lists").then(r=>r.json()).then(r=>{s(r);const a=[];r.forEach(l=>{l.items.some(d=>d.producto_id===k.id)&&a.push(l.id)}),y(a),C(!1)}))},[t,k]),!t)return null;const T=r=>{r.preventDefault(),g.trim()&&(z(!0),h.post("/perfil/listas",{nombre:g,es_publica:!1},{preserveScroll:!0,preserveState:!0,onSuccess:a=>{z(!1),f(""),fetch("/wishlist/lists").then(l=>l.json()).then(l=>{s(l);const d=l.find(j=>j.nombre===g);d&&y(j=>[...j,d.id])})}}))},E=r=>{y(a=>a.includes(r)?a.filter(l=>l!==r):[...a,r])},M=()=>{N(!0),h.post("/wishlist/sync",{producto_id:k.id,lista_ids:W},{preserveScroll:!0,preserveState:!0,onSuccess:()=>{N(!1),p()},onError:()=>{N(!1)}})};return e.jsxs(e.Fragment,{children:[e.jsx("div",{onClick:p,style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(2px)"}}),e.jsxs("div",{style:{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%)",width:"100%",maxWidth:"420px",background:"white",zIndex:1e4,borderRadius:"8px",padding:"25px",boxShadow:"0 10px 25px rgba(0,0,0,0.1)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"15px"},children:[e.jsxs("div",{children:[e.jsx("h3",{style:{margin:0,fontSize:"20px",color:"#0f172a",fontWeight:"bold"},children:"Agregar a una lista"}),e.jsx("p",{style:{margin:"8px 0 0",fontSize:"14px",color:"#475569"},children:"Selecciona la lista a la cual deseas agregar este producto."})]}),e.jsx("button",{onClick:p,style:{background:"none",border:"none",cursor:"pointer",fontSize:"24px",color:"#94a3b8",padding:"0",lineHeight:"1"},children:"?"})]}),e.jsx("hr",{style:{border:"none",borderTop:"1px solid #e2e8f0",margin:"15px 0"}}),e.jsx("div",{style:{fontSize:"15px",fontWeight:"bold",color:"#334155",marginBottom:"15px"},children:"Mis listas"}),L?e.jsx("div",{style:{padding:"20px",textAlign:"center",color:"#64748b"},children:"Cargando tus listas..."}):e.jsxs("div",{style:{maxHeight:"200px",overflowY:"auto",marginBottom:"15px"},children:[F.map(r=>{const a=W.includes(r.id);return e.jsxs("label",{style:{display:"flex",alignItems:"center",width:"100%",padding:"12px 15px",border:"1px solid #cbd5e1",borderRadius:"6px",marginBottom:"10px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",userSelect:"none"},children:[e.jsx("div",{style:{width:"20px",height:"20px",borderRadius:"4px",border:a?"none":"1px solid #94a3b8",background:a?"#00B4FF":"white",marginRight:"15px",display:"flex",alignItems:"center",justifyContent:"center"},children:a&&e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"3",children:e.jsx("polyline",{points:"20 6 9 17 4 12"})})}),e.jsx("input",{type:"checkbox",checked:a,onChange:()=>E(r.id),style:{display:"none"}}),e.jsx("div",{style:{flex:1,fontWeight:"400",fontSize:"15px",color:"#334155"},children:r.nombre})]},r.id)}),F.length===0&&e.jsx("div",{style:{textAlign:"center",padding:"15px",color:"#64748b",fontSize:"14px"},children:"A�n no tienes listas. Crea una abajo."})]}),e.jsxs("form",{onSubmit:T,style:{display:"flex",gap:"10px",marginBottom:"25px"},children:[e.jsx("div",{style:{display:"flex",alignItems:"center",color:"#00B4FF",fontSize:"18px",fontWeight:"bold"},children:"+"}),e.jsx("input",{type:"text",placeholder:"Crear una nueva lista",value:g,onChange:r=>f(r.target.value),style:{flex:1,padding:"0",border:"none",background:"transparent",outline:"none",fontSize:"14px",color:"#00B4FF",borderBottom:"1px solid transparent"},disabled:b}),g.trim().length>0&&e.jsx("button",{type:"submit",disabled:b,style:{padding:"6px 12px",background:"#00B4FF",color:"white",border:"none",borderRadius:"4px",fontSize:"12px",cursor:"pointer"},children:b?"...":"Crear"})]}),e.jsx("div",{style:{display:"flex",justifyContent:"center"},children:e.jsx("button",{onClick:M,disabled:S,style:{background:"#2c3e50",color:"white",border:"none",borderRadius:"24px",padding:"12px 60px",fontSize:"16px",fontWeight:"600",cursor:"pointer",opacity:S?.7:1},children:S?"Guardando...":"Guardar"})})]})]})}const w=t=>new Intl.NumberFormat("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(t);function ge(){const{producto:t,detalles:p,auth:k,logoUrl:F,recomendados:s,flash:L,cart:C,categorias:b}=Q().props,{isMobile:z}=U(),[g,f]=n.useState(!1),[W,y]=n.useState(!1),[S,N]=n.useState(!1),[T,E]=n.useState(!1),[M,r]=n.useState({x:50,y:50}),[a,l]=n.useState(!1);n.useEffect(()=>{const i=()=>y(!0),o=()=>f(!0);if(window.addEventListener("open-cart",i),window.addEventListener("open-categories",o),t?.id)try{let x=JSON.parse(localStorage.getItem("recently_viewed")||"[]");x=x.filter(R=>R.id!==t.id),x.unshift({id:t.id,nombre:t.nombre,imagen:t.imagen||p?.todas_imagenes?.[0]||u,slug:t.slug||t.id}),x.length>10&&(x=x.slice(0,10)),localStorage.setItem("recently_viewed",JSON.stringify(x))}catch(x){console.error("Error saving recently viewed",x)}return()=>{window.removeEventListener("open-cart",i),window.removeEventListener("open-categories",o)}},[t]);const[d,j]=n.useState(1),P=p?.todas_imagenes?.length>0?p.todas_imagenes:[t?.imagen||u],[_,H]=n.useState(P[0]||u),$=i=>{const{left:o,top:x,width:R,height:G}=i.currentTarget.getBoundingClientRect(),Z=(i.clientX-o)/R*100,J=(i.clientY-x)/G*100;r({x:Z,y:J})},O=Math.min(5,t?.stock||0),[c,m]=n.useState(!1),[B,q]=n.useState(!1),[v,A]=n.useState("desc"),D=i=>{m(!0),h.post("/cart/add",{producto_id:t.id,cantidad:d,precio:t.precio_actual},{preserveScroll:!0,onSuccess:()=>{m(!1),q(!0),setTimeout(()=>{q(!1),window.dispatchEvent(new CustomEvent("open-cart"))},800)},onError:()=>{m(!1)}})},Y=i=>{m(!0),h.post("/cart/add",{producto_id:t.id,cantidad:d,precio:t.precio_actual},{preserveScroll:!0,onSuccess:()=>{h.get("/checkout")},onError:()=>{m(!1)}})},V=(i,o)=>{m(!0),h.post("/cart/add",{producto_id:t.id,cantidad:1,precio:t.precio_actual},{preserveScroll:!0,onSuccess:()=>{h.post("/cart/add",{producto_id:i,cantidad:1,precio:o},{preserveScroll:!0,onSuccess:()=>{m(!1),window.dispatchEvent(new CustomEvent("open-cart"))},onError:()=>m(!1)})},onError:()=>m(!1)})};return e.jsxs("div",{className:"efe-producto-page",children:[e.jsxs(X,{children:[e.jsx("title",{children:t?.nombre?`${t.nombre} - NOVAPE`:"Producto no encontrado"}),e.jsx("meta",{name:"description",content:t?.descripcion?.substring(0,150)||"Descubre nuestros productos en NOVAPE."}),e.jsx("meta",{property:"og:title",content:t?.nombre?`${t.nombre} - NOVAPE`:"Producto no encontrado"}),e.jsx("meta",{property:"og:description",content:t?.descripcion?.substring(0,150)||"Descubre nuestros productos en NOVAPE."}),e.jsx("meta",{property:"og:type",content:"product"}),p?.imagenes?.[0]&&e.jsx("meta",{property:"og:image",content:p.imagenes[0].url}),e.jsx("meta",{property:"product:price:amount",content:t?.precio_actual}),e.jsx("meta",{property:"product:price:currency",content:"PEN"})]}),e.jsx(K,{cartCount:C?.count||0,onOpenCart:()=>window.dispatchEvent(new CustomEvent("open-cart")),onOpenCategories:()=>f(!0),logoUrl:F}),e.jsx(te,{categorias:b||[],onOpenCategories:()=>f(!0)}),e.jsxs("div",{className:"efe-producto-container",children:[e.jsx("style",{children:`
                    .premium-product-main {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 48px;
                        background: #ffffff;
                        border-radius: 24px;
                        padding: 32px;
                        box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
                        margin-bottom: 40px;
                        border: 1px solid #f1f5f9;
                    }
                    @media (min-width: 992px) {
                        .premium-product-main {
                            grid-template-columns: 50% 50%;
                            padding: 40px;
                        }
                    }
                    .premium-gallery-container {
                        display: flex;
                        gap: 24px;
                        height: 540px;
                    }
                    .premium-thumbs {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        width: 88px;
                        overflow-y: auto;
                        padding-right: 4px;
                    }
                    .premium-thumb {
                        width: 100%;
                        height: 88px;
                        border-radius: 14px;
                        border: 2px solid transparent;
                        cursor: pointer;
                        transition: all 0.25s ease;
                        object-fit: contain;
                        padding: 8px;
                        background: #f8fafc;
                        opacity: 0.6;
                    }
                    .premium-thumb:hover {
                        opacity: 1;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    }
                    .premium-thumb.is-active {
                        border-color: #00B4FF;
                        opacity: 1;
                        background: #ffffff;
                        box-shadow: 0 4px 12px rgba(0, 180, 255, 0.15);
                    }
                    .premium-main-img {
                        flex: 1;
                        border-radius: 20px;
                        background: #f8fafc;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        position: relative;
                        border: 1px solid #e2e8f0;
                    }
                    .premium-product-info {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .premium-brand {
                        font-size: 13px;
                        font-weight: 700;
                        color: #00B4FF;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 12px;
                    }
                    .premium-title {
                        font-size: 32px;
                        font-weight: 800;
                        color: #0f172a;
                        line-height: 1.2;
                        margin: 0 0 16px 0;
                        letter-spacing: -0.5px;
                    }
                    .premium-price {
                        font-size: 36px;
                        font-weight: 800;
                        color: #0f172a;
                        margin-bottom: 32px;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .premium-price span {
                        font-size: 18px;
                        font-weight: 600;
                        color: #94a3b8;
                        text-decoration: line-through;
                    }
                    .premium-qty-wrapper {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin-bottom: 32px;
                    }
                    .premium-qty-label {
                        font-size: 14px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .premium-qty-box {
                        display: flex;
                        align-items: center;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        width: fit-content;
                        padding: 4px;
                        transition: all 0.2s;
                    }
                    .premium-qty-box:focus-within {
                        border-color: #00B4FF;
                        box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.15);
                    }
                    .premium-qty-btn {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        border: none;
                        background: transparent;
                        color: #64748b;
                        font-size: 20px;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .premium-qty-btn:hover:not(:disabled) {
                        background: #ffffff;
                        color: #0f172a;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                    }
                    .premium-qty-btn:disabled {
                        opacity: 0.4;
                        cursor: not-allowed;
                    }
                    .premium-qty-val {
                        width: 48px;
                        text-align: center;
                        font-weight: 700;
                        font-size: 16px;
                        color: #0f172a;
                    }
                    .premium-actions {
                        display: flex;
                        gap: 16px;
                        margin-bottom: 32px;
                    }
                    .premium-btn-cart {
                        flex: 1;
                        background: #f8fafc;
                        color: #0f172a;
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 16px;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    }
                    .premium-btn-cart:hover:not(:disabled) {
                        border-color: #cbd5e1;
                        background: #f1f5f9;
                        transform: translateY(-2px);
                    }
                    .premium-btn-buy {
                        flex: 1;
                        background: #00B4FF;
                        color: #ffffff;
                        border: none;
                        border-radius: 14px;
                        padding: 16px;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 14px rgba(0, 180, 255, 0.3);
                    }
                    .premium-btn-buy:hover:not(:disabled) {
                        background: #009ce0;
                        box-shadow: 0 6px 20px rgba(0, 180, 255, 0.4);
                        transform: translateY(-2px);
                    }
                    .premium-delivery-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 24px;
                    }
                    .premium-delivery-title {
                        font-size: 15px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-bottom: 20px;
                    }
                    .premium-delivery-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 16px;
                        margin-bottom: 20px;
                    }
                    .premium-delivery-item:last-child {
                        margin-bottom: 0;
                    }
                    .premium-delivery-icon {
                        background: #f8fafc;
                        width: 44px;
                        height: 44px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #64748b;
                        flex-shrink: 0;
                        border: 1px solid #f1f5f9;
                    }
                    .premium-delivery-content {
                        flex: 1;
                    }
                    .premium-delivery-name {
                        font-size: 15px;
                        font-weight: 600;
                        color: #0f172a;
                        margin-bottom: 6px;
                    }
                    .premium-delivery-status {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 13px;
                        font-weight: 600;
                        padding: 4px 10px;
                        border-radius: 20px;
                    }
                    .status-ok { background: #dcfce7; color: #166534; }
                    .status-no { background: #fee2e2; color: #991b1b; }
                    
                    .premium-tabs-container {
                        margin-top: 48px;
                        border-radius: 20px;
                        background: #ffffff;
                        box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                    }
                    .premium-tabs-header {
                        display: flex;
                        border-bottom: 1px solid #e2e8f0;
                        background: #f8fafc;
                        padding: 0 24px;
                    }
                    .premium-tab-btn {
                        padding: 24px 32px;
                        background: transparent;
                        border: none;
                        font-size: 14px;
                        font-weight: 700;
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s;
                        border-bottom: 3px solid transparent;
                        margin-bottom: -1px;
                        letter-spacing: 0.5px;
                    }
                    .premium-tab-btn:hover {
                        color: #0f172a;
                    }
                    .premium-tab-btn.is-active {
                        color: #00B4FF;
                        border-bottom-color: #00B4FF;
                        background: #ffffff;
                    }
                `}),e.jsxs("div",{className:"efe-breadcrumb",children:[e.jsx(I,{href:"/",children:"Inicio"}),e.jsx("span",{children:">"}),t?.marca?e.jsxs(e.Fragment,{children:[e.jsx("span",{children:t.marca}),e.jsx("span",{children:">"})]}):null,e.jsx("span",{children:t?.nombre})]}),e.jsxs("div",{className:"premium-product-main",children:[e.jsxs("div",{className:"premium-gallery-container",children:[e.jsx("div",{className:"premium-thumbs",children:P.map((i,o)=>e.jsx("img",{src:i,alt:`Thumb ${o}`,className:`premium-thumb ${_===i?"is-active":""}`,onClick:()=>H(i)},o))}),e.jsx("div",{className:"premium-main-img",children:e.jsx("div",{className:"efe-zoom-container",onMouseMove:$,onMouseEnter:()=>l(!0),onMouseLeave:()=>l(!1),style:{width:"100%",height:"100%",position:"relative",backgroundImage:`url(${_||u})`,backgroundPosition:a?`${M.x}% ${M.y}%`:"center",backgroundSize:a?"150%":"contain",backgroundRepeat:"no-repeat",cursor:"zoom-in",transition:"background-size 0.3s ease-out"},children:e.jsx("img",{src:_||u,alt:t.nombre,style:{width:"100%",height:"100%",objectFit:"contain",padding:"24px",opacity:a?0:1,transition:"opacity 0.2s ease"}})})})]}),e.jsxs("div",{className:"premium-product-info",children:[e.jsx("div",{className:"premium-brand",children:t?.marca||"Generico"}),e.jsx("h1",{className:"premium-title",children:t?.nombre}),e.jsxs("div",{className:"premium-price",children:["S/ ",w(t?.precio_actual||0),t?.precio_anterior&&e.jsxs("span",{children:["S/ ",w(t.precio_anterior)]})]}),L?.error&&e.jsxs("div",{style:{color:"#991b1b",backgroundColor:"#fef2f2",border:"1px solid #fecaca",padding:"12px 16px",borderRadius:"12px",marginBottom:"24px",fontSize:"14px",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),L.error]}),t?.stock>0&&t?.stock<=5&&e.jsxs("div",{style:{backgroundColor:"#fff7ed",border:"1px solid #fdba74",color:"#ea580c",padding:"12px 16px",borderRadius:"12px",marginBottom:"24px",display:"flex",alignItems:"center",gap:"12px",fontWeight:"600",fontSize:"14px",animation:"pulse-urgency 2s infinite"},children:[e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),e.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),e.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]}),e.jsxs("span",{children:["¡Date prisa! Solo quedan ",t.stock," unidades disponibles."]})]}),e.jsxs("div",{className:"premium-qty-wrapper",children:[e.jsxs("label",{className:"premium-qty-label",children:["Cantidad (Máx. ",O,")"]}),e.jsxs("div",{className:"premium-qty-box",children:[e.jsx("button",{className:"premium-qty-btn",onClick:()=>j(Math.max(1,d-1)),disabled:d<=1||c||B,children:"-"}),e.jsx("span",{className:"premium-qty-val",children:d}),e.jsx("button",{className:"premium-qty-btn",onClick:()=>j(Math.min(O,d+1)),disabled:d>=O||c||B,children:"+"})]})]}),t.stock>0?e.jsxs("div",{className:"premium-actions",children:[e.jsx("button",{className:"premium-btn-cart",onClick:i=>D(),disabled:c||B,children:c?e.jsx("div",{style:{width:"20px",height:"20px",border:"3px solid rgba(0,0,0,0.1)",borderTop:"3px solid #111827",borderRadius:"50%",animation:"spin 1s linear infinite"}}):B?e.jsxs(e.Fragment,{children:[e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"#10b981",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"20 6 9 17 4 12"})}),e.jsx("span",{style:{color:"#10b981"},children:"¡Añadido!"})]}):e.jsxs(e.Fragment,{children:["Al carrito",e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",children:[e.jsx("circle",{cx:"9",cy:"21",r:"1"}),e.jsx("circle",{cx:"20",cy:"21",r:"1"}),e.jsx("path",{d:"M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"})]})]})}),e.jsx("button",{className:"premium-btn-buy",onClick:Y,disabled:c||B,children:"Comprar Ahora"})]}):e.jsx("div",{className:"premium-actions",children:e.jsx("button",{className:"premium-btn-cart",disabled:!0,style:{opacity:.5,cursor:"not-allowed",width:"100%"},children:"Sin stock"})}),e.jsx("div",{style:{marginBottom:"24px"},children:e.jsxs("button",{onClick:()=>{k?.user?E(!0):h.get("/login")},style:{display:"inline-flex",alignItems:"center",gap:"8px",background:"transparent",border:"none",color:"#64748b",fontSize:"14px",fontWeight:"600",cursor:"pointer",padding:"8px 12px",borderRadius:"8px",transition:"all 0.2s"},onMouseOver:i=>{i.currentTarget.style.background="#f8fafc",i.currentTarget.style.color="#00B4FF"},onMouseOut:i=>{i.currentTarget.style.background="transparent",i.currentTarget.style.color="#64748b"},children:[e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"})}),"Agregar a Mis listas"]})}),e.jsxs("div",{className:"premium-delivery-card",children:[e.jsx("h4",{className:"premium-delivery-title",children:"Opciones de entrega"}),e.jsxs("div",{className:"premium-delivery-item",children:[e.jsx("div",{className:"premium-delivery-icon",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",children:[e.jsx("rect",{x:"1",y:"3",width:"15",height:"13",rx:"2"}),e.jsx("path",{d:"M16 8h4l3 3v5h-7V8z"}),e.jsx("circle",{cx:"5.5",cy:"18.5",r:"2.5"}),e.jsx("circle",{cx:"18.5",cy:"18.5",r:"2.5"})]})}),e.jsxs("div",{className:"premium-delivery-content",children:[e.jsx("div",{className:"premium-delivery-name",children:"Envío a domicilio"}),t?.envio_domicilio?e.jsxs("div",{className:"premium-delivery-status status-ok",children:[e.jsx("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:e.jsx("polyline",{points:"20 6 9 17 4 12"})}),"Disponible"]}):e.jsxs("div",{className:"premium-delivery-status status-no",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]}),"No disponible"]})]})]}),e.jsxs("div",{className:"premium-delivery-item",children:[e.jsx("div",{className:"premium-delivery-icon",children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",children:[e.jsx("path",{d:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}),e.jsx("polyline",{points:"9 22 9 12 15 12 15 22"})]})}),e.jsxs("div",{className:"premium-delivery-content",children:[e.jsx("div",{className:"premium-delivery-name",children:"Retiro en tienda"}),t?.retiro_tienda?e.jsxs("div",{className:"premium-delivery-status status-ok",children:[e.jsx("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:e.jsx("polyline",{points:"20 6 9 17 4 12"})}),"Disponible"]}):e.jsxs("div",{className:"premium-delivery-status status-no",children:[e.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]}),"No disponible"]})]})]})]})]})]}),e.jsxs("div",{className:"premium-tabs-container",children:[e.jsxs("div",{className:"premium-tabs-header",children:[e.jsx("button",{onClick:()=>A("desc"),className:`premium-tab-btn ${v==="desc"?"is-active":""}`,children:"DESCRIPCIÓN DEL PRODUCTO"}),e.jsx("button",{onClick:()=>A("specs"),className:`premium-tab-btn ${v==="specs"?"is-active":""}`,children:"ESPECIFICACIONES"}),e.jsx("button",{onClick:()=>A("warranty"),className:`premium-tab-btn ${v==="warranty"?"is-active":""}`,children:"CAMBIOS Y DEVOLUCIONES"})]}),e.jsxs("div",{style:{padding:"30px",backgroundColor:"white"},children:[v==="desc"&&e.jsx("div",{style:{lineHeight:"1.6",color:"#333"},dangerouslySetInnerHTML:{__html:t?.descripcion||"No hay descripción disponible para este producto."}}),v==="specs"&&e.jsx("div",{children:e.jsx("table",{className:"efe-specs-table",style:{width:"100%",borderCollapse:"collapse"},children:e.jsxs("tbody",{children:[p?.especificaciones?.length>0?p.especificaciones.map((i,o)=>e.jsxs("tr",{style:{borderBottom:"1px solid #f1f5f9"},children:[e.jsx("td",{style:{padding:"12px 16px",fontWeight:"bold",width:"40%",color:"#475569"},children:i.nombre||"Especificación"}),e.jsx("td",{style:{padding:"12px 16px",color:"#333"},children:i.valor})]},o)):null,e.jsxs("tr",{style:{borderBottom:"1px solid #f1f5f9"},children:[e.jsx("td",{style:{padding:"12px 16px",fontWeight:"bold",width:"40%",color:"#475569"},children:"Stock Disponible"}),e.jsx("td",{style:{padding:"12px 16px",color:"#333"},children:t?.stock>0?`${t.stock} unidades`:"Agotado"})]})]})})}),v==="warranty"&&e.jsx("div",{style:{lineHeight:"1.6",color:"#333",whiteSpace:"pre-line"},children:t?.garantias||"No hay información de cambios y devoluciones disponible para este producto."})]})]})]}),s&&s.length>0&&e.jsxs("div",{style:{maxWidth:"1200px",margin:"50px auto 30px",padding:"0 20px"},children:[e.jsx("h2",{style:{fontSize:"24px",fontWeight:"bold",marginBottom:"24px",color:"#1e293b"},children:"Comprados frecuentemente juntos"}),e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"30px",backgroundColor:"#ffffff",padding:"30px",borderRadius:"16px",boxShadow:"0 4px 20px rgba(0, 180, 255, 0.08)",border:"1px solid rgba(0, 180, 255, 0.15)"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",width:"160px",position:"relative"},children:[e.jsx("div",{style:{width:"100%",aspectRatio:"1",display:"flex",justifyContent:"center",alignItems:"center",padding:"15px",backgroundColor:"#f8fafc",borderRadius:"12px",border:"1px solid #e2e8f0",marginBottom:"12px"},children:e.jsx("img",{src:t.imagen||u,alt:t.nombre,style:{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}})}),e.jsx("span",{style:{fontSize:"13px",textAlign:"center",fontWeight:"600",color:"#334155",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},children:t.nombre})]}),e.jsx("div",{style:{fontSize:"28px",fontWeight:"300",color:"#00B4FF"},children:"+"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",width:"160px",position:"relative"},children:[e.jsx(I,{href:`/producto/${s[0].id}`,style:{width:"100%",aspectRatio:"1",display:"flex",justifyContent:"center",alignItems:"center",padding:"15px",backgroundColor:"#f8fafc",borderRadius:"12px",border:"1px solid #e2e8f0",marginBottom:"12px",transition:"all 0.3s ease",textDecoration:"none"},onMouseEnter:i=>{i.currentTarget.style.borderColor="#00B4FF",i.currentTarget.style.boxShadow="0 4px 12px rgba(0, 180, 255, 0.15)"},onMouseLeave:i=>{i.currentTarget.style.borderColor="#e2e8f0",i.currentTarget.style.boxShadow="none"},children:e.jsx("img",{src:s[0].imagen||u,alt:s[0].nombre,style:{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}})}),e.jsx(I,{href:`/producto/${s[0].id}`,style:{fontSize:"13px",textAlign:"center",fontWeight:"600",color:"#334155",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",textDecoration:"none",transition:"color 0.2s"},onMouseEnter:i=>i.currentTarget.style.color="#00B4FF",onMouseLeave:i=>i.currentTarget.style.color="#334155",children:s[0].nombre})]}),e.jsx("div",{style:{fontSize:"28px",fontWeight:"300",color:"#00B4FF"},children:"="}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"15px",marginLeft:"auto",minWidth:"240px",padding:"20px",backgroundColor:"#f0f9ff",borderRadius:"12px",border:"1px dashed rgba(0, 180, 255, 0.4)"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"4px"},children:[e.jsx("span",{style:{fontSize:"13px",color:"#64748b",fontWeight:"500",textTransform:"uppercase",letterSpacing:"0.5px"},children:"Precio total del paquete"}),e.jsxs("span",{style:{fontSize:"28px",fontWeight:"800",color:"#00B4FF"},children:["S/"," ",w((t.precio_actual||0)+(s[0].precio_actual||0))]})]}),e.jsx("button",{onClick:()=>V(s[0].id,s[0].precio_actual),disabled:c,style:{width:"100%",padding:"14px 20px",backgroundColor:"#00B4FF",color:"white",border:"none",borderRadius:"8px",fontSize:"15px",fontWeight:"600",cursor:c?"not-allowed":"pointer",transition:"all 0.2s",boxShadow:"0 4px 12px rgba(0, 180, 255, 0.3)",display:"flex",justifyContent:"center",alignItems:"center",gap:"8px"},onMouseEnter:i=>{c||(i.currentTarget.style.backgroundColor="#0096d6")},onMouseLeave:i=>{c||(i.currentTarget.style.backgroundColor="#00B4FF")},children:c?e.jsxs(e.Fragment,{children:[e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",style:{animation:"spin 1s linear infinite"},children:e.jsx("path",{d:"M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"})}),"Agregando..."]}):e.jsxs(e.Fragment,{children:[e.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"}),e.jsx("line",{x1:"3",y1:"6",x2:"21",y2:"6"}),e.jsx("path",{d:"M16 10a4 4 0 0 1-8 0"})]}),"Agregar ambos al carrito"]})})]})]})]}),s&&s.length>1&&e.jsxs("div",{style:{maxWidth:"1200px",margin:"40px auto 60px",padding:"0 20px"},children:[e.jsx("h2",{style:{fontSize:"24px",fontWeight:"bold",marginBottom:"24px",color:"#1e293b"},children:"Clientes también compraron"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:"24px"},children:s.map(i=>e.jsx(I,{href:`/producto/${i.id}`,style:{textDecoration:"none",color:"inherit",display:"block",height:"100%"},children:e.jsxs("div",{style:{border:"1px solid #e2e8f0",borderRadius:"12px",padding:"20px",background:"white",transition:"all 0.3s ease",height:"100%",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"},onMouseEnter:o=>{o.currentTarget.style.borderColor="#00B4FF",o.currentTarget.style.boxShadow="0 10px 25px rgba(0, 180, 255, 0.1)",o.currentTarget.style.transform="translateY(-4px)"},onMouseLeave:o=>{o.currentTarget.style.borderColor="#e2e8f0",o.currentTarget.style.boxShadow="none",o.currentTarget.style.transform="translateY(0)"},children:[e.jsx("div",{style:{width:"100%",height:"180px",display:"flex",justifyContent:"center",alignItems:"center",marginBottom:"16px"},children:e.jsx("img",{src:i.imagen||u,alt:i.nombre,style:{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",transition:"transform 0.3s ease"}})}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",flexGrow:1},children:[e.jsx("span",{style:{fontSize:"11px",fontWeight:"600",color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"4px"},children:i.marca||"S/M"}),e.jsx("span",{style:{fontSize:"14px",fontWeight:"600",color:"#334155",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginBottom:"12px",lineHeight:"1.4"},children:i.nombre}),e.jsxs("div",{style:{marginTop:"auto",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("span",{style:{fontSize:"18px",fontWeight:"800",color:"#00B4FF"},children:["S/ ",w(i.precio_actual)]}),e.jsx("div",{style:{width:"32px",height:"32px",borderRadius:"50%",backgroundColor:"#f0f9ff",display:"flex",justifyContent:"center",alignItems:"center",color:"#00B4FF"},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]})]})]})},i.id))})]}),z&&e.jsxs("div",{className:"sticky-bottom-cta",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"},children:[e.jsxs("div",{style:{fontSize:"16px",fontWeight:"bold"},children:["S/ ",w(t?.precio_actual)]}),t?.precio_anterior>0&&e.jsxs("div",{style:{fontSize:"12px",textDecoration:"line-through",color:"#9ca3af"},children:["S/ ",w(t?.precio_anterior)]})]}),e.jsx("button",{onClick:i=>D(),className:`efe-producto-btn efe-producto-btn-buy efe-btn-anim ${c?"is-adding":""}`,disabled:!t?.stock||t.stock<=0,style:{width:"100%",minHeight:"44px"},children:c?"Agregando...":"Comprar ahora"})]}),e.jsx(re,{}),e.jsx(ie,{isOpen:g,onClose:()=>f(!1),categorias:b||[]}),e.jsx(oe,{cart:C,isOpen:W,onClose:()=>y(!1)}),e.jsx(ee,{isOpen:S,onClose:()=>N(!1),onSuccessCallback:()=>D()}),e.jsx(ne,{isOpen:T,onClose:()=>E(!1),producto:t})]})}export{ge as default};

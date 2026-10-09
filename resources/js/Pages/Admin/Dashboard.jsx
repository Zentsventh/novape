import { useEffect, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownToLine,
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Clock3,
  Filter,
  Package,
  Plus,
  Search,
  ShoppingBag,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";
import { canAccess } from "../../Components/Admin/navigation";
import "../../../css/admin/dashboard.css";

const money = (value) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
const integer = (value) =>
  new Intl.NumberFormat("es-PE").format(Number(value) || 0);
const array = (value) =>
  Array.isArray(value) ? value : Object.values(value || {});
const statuses = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  procesando: "En proceso",
  enviado: "Enviado",
  completado: "Completado",
  cancelado: "Cancelado",
};

export default function Dashboard({
  ventasTotal = 0,
  costosTotal = 0,
  gananciaNeta = 0,
  financialQuality,
  totalPedidos = 0,
  pedidosPendientes = 0,
  pedidosEnviados = 0,
  pedidosCompletados = 0,
  stockBajo = [],
  pedidosRecientes = [],
  ventasSemana = [],
  topProductosVendidos = [],
  filters = {},
}) {
  const { props } = usePage();
  const user = props.auth?.user;
  const [form, setForm] = useState({
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
    status: filters.status || "",
  });
  const [search, setSearch] = useState(filters.q || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setForm({
      start_date: filters.start_date || "",
      end_date: filters.end_date || "",
      status: filters.status || "",
    });
    setSearch(filters.q || "");
  }, [filters.start_date, filters.end_date, filters.status, filters.q]);
  const params = Object.fromEntries(
    Object.entries({
      ...form,
      q: search,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    }).filter(([, value]) => value),
  );
  const reportParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters).filter(
        ([key, value]) =>
          ["start_date", "end_date", "status", "q"].includes(key) && value,
      ),
    ),
  ).toString();
  const apply = (event) => {
    event?.preventDefault();
    setError("");
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      setError(
        "La fecha de inicio debe ser anterior o igual a la fecha final.",
      );
      return;
    }
    setBusy(true);
    router.get("/admin", params, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setBusy(false),
    });
  };
  const reset = () => {
    setError("");
    setForm({ start_date: "", end_date: "", status: "" });
    setSearch("");
    router.get("/admin", {}, { preserveState: true, preserveScroll: true });
  };
  const chart = array(ventasSemana).map((value, i) =>
    typeof value === "object"
      ? { ...value, total: Number(value.total) || 0 }
      : {
          dia: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i],
          total: Number(value) || 0,
        },
  );
  const orders = array(pedidosRecientes),
    lowStock = array(stockBajo),
    top = array(topProductosVendidos);
  const metrics = [
    {
      label: "Ingresos",
      value: money(ventasTotal),
      note: "Ventas de la tienda y punto de venta",
      icon: TrendingUp,
      tone: "indigo",
    },
    {
      label: "Costos registrados",
      value: money(costosTotal),
      note: "Compras recibidas y gastos del período",
      icon: Wallet,
      tone: "slate",
    },
    {
      label: "Balance comercial",
      value: money(gananciaNeta),
      note: "Ingresos menos compras y gastos",
      icon: ChartNoAxesCombined,
      tone: "green",
    },
    ...(financialQuality ? [{ label: "Margen comercial estimado", value: financialQuality.margenComercial === null ? "Sin coste completo" : money(financialQuality.margenComercial), note: financialQuality.partidasSinCosto ? `${financialQuality.partidasSinCosto} partidas sin coste histórico` : "Ventas netas menos coste histórico; incluye importes registrados", icon: ChartNoAxesCombined, tone: "slate" }] : []),
    {
      label: "Pedidos",
      value: integer(totalPedidos),
      note: "Pedidos del período seleccionado",
      icon: ShoppingBag,
      tone: "amber",
    },
  ];
  const quickActions = [
    {
      href: "/admin/pos",
      label: "Registrar venta",
      icon: Plus,
      permission: "pos.vender",
    },
    {
      href: "/admin/products/create",
      label: "Añadir producto",
      icon: Package,
      permission: "crear_producto",
    },
    {
      href: "/admin/clientes/create",
      label: "Crear cliente",
      icon: Plus,
      permission: "usuarios.gestionar",
    },
  ].filter((action) => canAccess(user, action.permission));
  return (
    <AdminLayout>
      <Head title="Vista general" />
      <div className="overview">
        <header className="overview-heading">
          <div>
            <span className="overview-eyebrow">TU NEGOCIO, EN UN VISTAZO</span>
            <h1>Vista general</h1>
            <p>Las cifras y prioridades para continuar tu operación.</p>
          </div>
          <div className="overview-heading-actions">
            <a
              className="workspace-button"
              href={`/admin/pedidos/exportar-excel?${reportParams}`}
            >
              <ArrowDownToLine size={15} />
              Excel
            </a>
            <a
              className="workspace-button"
              href={`/admin/pedidos/exportar-pdf?${reportParams}`}
            >
              <ArrowDownToLine size={15} />
              PDF
            </a>
            {canAccess(user, "ver_pedidos") && (
              <Link
                className="workspace-button is-primary"
                href="/admin/pedidos"
              >
                Gestionar pedidos <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </header>
        <form className="overview-filters" onSubmit={apply}>
          <div className="overview-period">
            <label>
              Desde
              <input
                type="date"
                aria-label="Fecha inicial"
                value={form.start_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
              />
            </label>
            <span>—</span>
            <label>
              Hasta
              <input
                type="date"
                aria-label="Fecha final"
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
              />
            </label>
          </div>
          <label className="overview-status-filter">
            Estado del pedido
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">Todos los estados</option>
              {Object.entries(statuses).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="overview-filter-actions">
            <button type="submit" className="workspace-button" disabled={busy}>
              <Filter size={14} />
              {busy ? "Aplicando…" : "Aplicar filtros"}
            </button>
            {Object.keys(params).length > 0 && (
              <button
                type="button"
                className="workspace-button is-quiet"
                onClick={reset}
              >
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>
        </form>
        {error && (
          <div className="panel-flash is-error" role="alert">
            {error}
          </div>
        )}
        <section
          className="overview-metrics"
          aria-label="Indicadores del negocio"
        >
          {metrics.map((metric) => (
            <article className="overview-metric" key={metric.label}>
              <div>
                <span className="overview-metric-label">{metric.label}</span>
                <span className={`overview-metric-icon ${metric.tone}`}>
                  <metric.icon size={18} />
                </span>
              </div>
              <strong>{metric.value}</strong>
              <p>{metric.note}</p>
            </article>
          ))}
        </section>
        <div className="overview-primary-grid">
          <section className="overview-card overview-sales">
            <header>
              <div>
                <h2>Evolución de las ventas</h2>
                <p>Ventas de los últimos siete días</p>
              </div>
              <span className="overview-legend">
                <i />
                Ingresos
              </span>
            </header>
            <div className="overview-chart">
              {chart.some((day) => day.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chart}
                    margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="overviewRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#004797"
                          stopOpacity={0.14}
                        />
                        <stop
                          offset="95%"
                          stopColor="#004797"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#e1e7f0"
                      vertical={false}
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="dia"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#8b94a7", fontSize: 11 }}
                      dy={9}
                    />
                    <YAxis
                      width={65}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#8b94a7", fontSize: 10 }}
                      tickFormatter={(value) => `S/ ${integer(value)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 9,
                        border: "1px solid #e4e7ef",
                        fontSize: 12,
                      }}
                      formatter={(value) => [money(value), "Ingresos"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#004797"
                      strokeWidth={2.5}
                      fill="url(#overviewRevenue)"
                      activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="panel-empty">
                  <ChartNoAxesCombined size={30} />
                  <strong>Sin ventas en estos siete días</strong>
                  <span>
                    Las ventas registradas se mostrarán en este gráfico.
                  </span>
                </div>
              )}
            </div>
          </section>
          <section className="overview-card overview-priorities">
            <header>
              <div>
                <h2>Estado de la operación</h2>
                <p>Seguimiento de tus pedidos</p>
              </div>
            </header>
            <div className="overview-priority-list">
              {[
                [Clock3, "Pendientes de atención", pedidosPendientes, "amber"],
                [Package, "Pedidos enviados", pedidosEnviados, "indigo"],
                [Check, "Pedidos completados", pedidosCompletados, "green"],
              ].map(([Icon, label, value, tone]) => (
                <div className="overview-priority" key={label}>
                  <span className={`overview-metric-icon ${tone}`}>
                    <Icon size={16} />
                  </span>
                  <span>{label}</span>
                  <strong>{integer(value)}</strong>
                </div>
              ))}
            </div>
            {canAccess(user, "ver_pedidos") && (
              <Link href="/admin/pedidos" className="overview-card-link">
                Revisar pedidos <ArrowRight size={14} />
              </Link>
            )}
            {quickActions.length > 0 && (
              <div className="overview-quick-actions">
                <h3>Accesos rápidos</h3>
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <action.icon size={14} />
                    {action.label}
                    <ArrowRight size={13} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="overview-secondary-grid">
          <section className="overview-card overview-orders">
            <header>
              <div>
                <h2>Últimos pedidos</h2>
                <p>Consulta el detalle y continúa la atención</p>
              </div>
              {canAccess(user, "ver_pedidos") && (
                <Link href="/admin/pedidos" className="overview-text-link">
                  Ver todos <ArrowRight size={13} />
                </Link>
              )}
            </header>
            <form className="overview-order-search" onSubmit={apply}>
              <Search size={15} />
              <input
                aria-label="Buscar pedidos"
                placeholder="Buscar por código o cliente"
                maxLength={200}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" disabled={busy}>
                Buscar
              </button>
            </form>
            <div className="overview-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>
                      <span className="overview-sr">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        {canAccess(user, "ver_pedidos") ? (
                          <Link
                            href={`/admin/pedidos/${order.id}`}
                            className="overview-order-code"
                          >
                            {order.codigo}
                          </Link>
                        ) : (
                          order.codigo
                        )}
                      </td>
                      <td>{order.usuario_nombre || "Cliente"}</td>
                      <td className="overview-number">{money(order.total)}</td>
                      <td className="overview-muted">{order.fecha}</td>
                      <td>
                        <span className={`overview-status ${order.estado}`}>
                          {statuses[order.estado] || order.estado}
                        </span>
                      </td>
                      <td>
                        {canAccess(user, "ver_pedidos") && (
                          <Link
                            href={`/admin/pedidos/${order.id}`}
                            aria-label={`Ver pedido ${order.codigo}`}
                            className="panel-icon-button"
                          >
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!orders.length && (
                <div className="panel-empty">
                  <ShoppingBag size={25} />
                  <strong>No hay pedidos para estos filtros</strong>
                  <span>Cambia el período o limpia la búsqueda.</span>
                </div>
              )}
            </div>
          </section>
          <section className="overview-card overview-stock">
            <header>
              <div>
                <h2>Stock por reponer</h2>
                <p>{integer(lowStock.length)} referencias requieren revisión</p>
              </div>
              <span className="overview-stock-count">
                {integer(lowStock.length)}
              </span>
            </header>
            <div className="overview-stock-list">
              {lowStock.slice(0, 5).map((product) => (
                <div className="overview-stock-row" key={product.id}>
                  <span className="overview-product-symbol">
                    <Package size={16} />
                  </span>
                  <div>
                    {canAccess(user, "ver_productos") ? (
                      <Link href={`/admin/products/${product.id}`}>
                        {product.nombre}
                      </Link>
                    ) : (
                      <strong>{product.nombre}</strong>
                    )}
                    <small>{product.marca || "Producto de catálogo"}</small>
                  </div>
                  <span className="overview-stock-badge">
                    {integer(product.stock)} u.
                  </span>
                </div>
              ))}
              {!lowStock.length && (
                <div className="panel-empty">
                  <Check size={24} />
                  <strong>Inventario al día</strong>
                  <span>No hay alertas de stock bajo.</span>
                </div>
              )}
            </div>
            {canAccess(user, "inventario.gestionar") && (
              <Link className="overview-card-link" href="/admin/inventario">
                Abrir inventario <ArrowRight size={14} />
              </Link>
            )}
          </section>
        </div>
        {top.length > 0 && (
          <section className="overview-card overview-top-products">
            <header>
              <div>
                <h2>Productos con más ventas</h2>
                <p>
                  Resultados del período seleccionado · Tienda y punto de venta
                </p>
              </div>
            </header>
            <div>
              {top.slice(0, 5).map((product, i) => (
                <article key={product.id}>
                  <span className="overview-product-rank">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{product.nombre}</strong>
                    <span>{integer(product.cantidad)} unidades vendidas</span>
                  </div>
                  <span>{money(product.ingresos)}</span>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}

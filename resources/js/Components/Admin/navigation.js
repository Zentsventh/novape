import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Monitor,
  ShieldCheck,
  Users,
  Target,
  Building2,
  CalendarDays,
  ListTodo,
  Inbox,
  Workflow,
  Package,
  Tags,
  Warehouse,
  Boxes,
  MapPin,
  ShoppingCart,
  Truck,
  Wallet,
  Ticket,
  Image,
  Mail,
  MessagesSquare,
  Sparkles,
  BookOpen,
  UserCog,
  Shield,
  Settings2,
  CreditCard,
  History,
} from "lucide-react";

export const navigation = [
  {
    label: "Resumen",
    items: [
      {
        href: "/admin",
        label: "Vista general",
        icon: LayoutDashboard,
        permission: "ver_dashboard",
        exact: true,
      },
      {
        href: "/admin/analiticas",
        label: "Reportes y analíticas",
        icon: BarChart3,
        permission: "ver_analiticas",
      },
    ],
  },
  {
    label: "Ventas",
    items: [
      {
        href: "/admin/pedidos",
        label: "Pedidos",
        icon: ShoppingBag,
        permission: "ver_pedidos",
      },
      {
        href: "/admin/pos",
        label: "Punto de venta",
        icon: Monitor,
        permission: "pos.vender",
      },
      {
        href: "/admin/rma",
        label: "Garantías y cambios",
        icon: ShieldCheck,
        permission: "editar_pedido",
      },
    ],
  },
  {
    label: "Clientes y CRM",
    items: [
      {
        href: "/admin/crm/dashboard",
        label: "Resumen comercial",
        icon: BarChart3,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/clientes",
        label: "Clientes",
        icon: Users,
        permission: "ver_usuarios",
      },
      {
        href: "/admin/crm/companies",
        label: "Empresas",
        icon: Building2,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/crm/pipeline",
        label: "Oportunidades",
        icon: Target,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/crm/tasks",
        label: "Tareas",
        icon: ListTodo,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/crm/calendar",
        label: "Calendario",
        icon: CalendarDays,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/crm/cases",
        label: "Casos de atención",
        icon: ShieldCheck,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/inbox",
        label: "Bandeja de entrada",
        icon: Inbox,
        permission: "gestionar_omnichannel",
      },
      {
        href: "/admin/crm/automations",
        label: "Automatizaciones",
        icon: Workflow,
        permission: "crm.gestionar",
      },
    ],
  },
  {
    label: "Catálogo e inventario",
    items: [
      {
        href: "/admin/products",
        label: "Productos",
        icon: Package,
        permission: "ver_productos",
      },
      {
        href: "/admin/categorias",
        label: "Categorías",
        icon: Tags,
        permission: "gestionar_categorias",
      },
      {
        href: "/admin/marcas",
        label: "Marcas",
        icon: Tags,
        permission: "gestionar_marcas",
      },
      {
        href: "/admin/inventario",
        label: "Inventario",
        icon: Boxes,
        permission: "inventario.gestionar",
      },
      {
        href: "/admin/almacenes",
        label: "Almacenes",
        icon: Warehouse,
        permission: "inventario.gestionar",
      },
      {
        href: "/admin/zonas",
        label: "Zonas de envío",
        icon: MapPin,
        permission: "gestionar_ajustes",
      },
    ],
  },
  {
    label: "Compras y finanzas",
    items: [
      {
        href: "/admin/compras",
        label: "Compras",
        icon: ShoppingCart,
        permission: "inventario.gestionar",
      },
      {
        href: "/admin/proveedores",
        label: "Proveedores",
        icon: Truck,
        permission: "inventario.gestionar",
      },
      {
        href: "/admin/gastos",
        label: "Gastos",
        icon: Wallet,
        permission: "finanzas.gestionar",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        href: "/admin/cupones",
        label: "Cupones",
        icon: Ticket,
        permission: "gestionar_cupones",
      },
      {
        href: "/admin/banners",
        label: "Banners de la tienda",
        icon: Image,
        permission: "gestionar_ajustes",
      },
      {
        href: "/admin/marketing/campaigns",
        label: "Campañas",
        icon: Mail,
        permission: "marketing.gestionar",
      },
    ],
  },
  {
    label: "Equipo e inteligencia artificial",
    items: [
      {
        href: "/admin/equipo",
        label: "Conversaciones del equipo",
        icon: MessagesSquare,
      },
      {
        href: "/admin/asistente",
        label: "Asistente del panel",
        icon: Sparkles,
      },
      {
        href: "/admin/chatbot/conocimiento",
        label: "Conocimiento del chatbot",
        icon: BookOpen,
        permission: "gestionar_ajustes",
      },
    ],
  },
  {
    label: "Configuración",
    items: [
      {
        href: "/admin/trabajadores",
        label: "Trabajadores",
        icon: UserCog,
        permission: "ver_usuarios",
      },
      {
        href: "/admin/roles",
        label: "Roles y permisos",
        icon: Shield,
        permission: "usuarios.gestionar",
      },
      {
        href: "/admin/ajustes",
        label: "Ajustes de la tienda",
        icon: Settings2,
        permission: "gestionar_ajustes",
      },
      {
        href: "/admin/metodos-pago",
        label: "Métodos de pago",
        icon: CreditCard,
        permission: "gestionar_ajustes",
      },
      {
        href: "/admin/crm/settings/objects",
        label: "Ajustes del CRM",
        icon: Settings2,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/crm/custom-fields",
        label: "Campos del CRM",
        icon: ListTodo,
        permission: "crm.gestionar",
      },
      {
        href: "/admin/audit-logs",
        label: "Registro de auditoría",
        icon: History,
        permission: "gestionar_ajustes",
      },
    ],
  },
];

export const canAccess = (user, permission) =>
  !permission ||
  user?.roles?.some((role) => role.nombre === "admin") ||
  user?.permisos?.includes(permission);
export const visibleNavigation = (user) =>
  navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(user, item.permission)),
    }))
    .filter((group) => group.items.length);
export const activeItem = (item, url) =>
  item.exact
    ? url.split("?")[0] === item.href
    : url.split("?")[0] === item.href ||
      url.split("?")[0].startsWith(`${item.href}/`);

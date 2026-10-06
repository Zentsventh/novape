import { useCallback, useEffect, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import {
  activeItem,
  canAccess,
  visibleNavigation,
} from "../Components/Admin/navigation";
import PanelCommandPalette from "../Components/Admin/PanelCommandPalette";
import useDialog from "../Components/Admin/useDialog";
import "../../css/admin/admin.css";
import "../../css/admin/workspace.css";

const readPreference = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writePreference = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export default function AdminLayout({
  children,
  title,
  headerActions,
  section,
}) {
  const { url, props } = usePage();
  const user = props.auth?.user;
  const groups = visibleNavigation(user);
  const current = groups
    .flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.label })),
    )
    .filter((item) => activeItem(item, url))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const [collapsed, setCollapsed] = useState(() =>
    readPreference("novape.panel.collapsed", false),
  );
  const [closedGroups, setClosedGroups] = useState(() =>
    readPreference("novape.panel.groups", []),
  );
  const [mobile, setMobile] = useState(false),
    [palette, setPalette] = useState(false),
    [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]),
    [notificationError, setNotificationError] = useState(""),
    [reading, setReading] = useState(false);
  const [navigating, setNavigating] = useState(false),
    [dismissed, setDismissed] = useState(null);
  const mobileDialog = useRef(null),
    notificationPanel = useRef(null);
  const closeMobile = useCallback(() => setMobile(false), []);
  const closePalette = useCallback(() => setPalette(false), []);
  useDialog(mobile, mobileDialog, closeMobile);
  const unread = notifications.filter((n) => !n.read).length;
  const refreshNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get("/admin/notificaciones");
      setNotifications(Array.isArray(data) ? data : []);
      setNotificationError("");
    } catch {
      setNotificationError("No se pudieron cargar las notificaciones.");
    }
  }, []);
  useEffect(() => {
    refreshNotifications();
    const timer = setInterval(() => {
      if (!document.hidden) refreshNotifications();
    }, 60000);
    return () => clearInterval(timer);
  }, [refreshNotifications]);
  useEffect(() => {
    setMobile(false);
    setShowNotifications(false);
    setDismissed(null);
  }, [url, props.flash?.success, props.flash?.error]);
  useEffect(() => {
    writePreference("novape.panel.collapsed", collapsed);
  }, [collapsed]);
  useEffect(() => {
    writePreference("novape.panel.groups", closedGroups);
  }, [closedGroups]);
  useEffect(() => {
    const start = router.on("start", () => setNavigating(true));
    const finish = router.on("finish", () => setNavigating(false));
    return () => {
      start();
      finish();
    };
  }, []);
  useEffect(() => {
    const keyboard = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((p) => !p);
      }
      if (event.key === "Escape") setShowNotifications(false);
    };
    const outside = (event) => {
      if (
        notificationPanel.current &&
        !notificationPanel.current.contains(event.target)
      )
        setShowNotifications(false);
    };
    document.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  const read = async (notification = null) => {
    setReading(true);
    setNotificationError("");
    try {
      await axios.post(
        notification
          ? `/admin/notificaciones/${notification.id}/read`
          : "/admin/notificaciones/read-all",
      );
      setNotifications((items) =>
        items.map((item) =>
          !notification || item.id === notification.id
            ? { ...item, read: true }
            : item,
        ),
      );
      if (notification?.link?.startsWith("/admin")) {
        setShowNotifications(false);
        router.visit(notification.link);
      }
    } catch {
      setNotificationError("No se pudo marcar como leída. Intenta de nuevo.");
    } finally {
      setReading(false);
    }
  };
  const toggleGroup = (label) =>
    setClosedGroups((items) =>
      items.includes(label)
        ? items.filter((item) => item !== label)
        : [...items, label],
    );
  const initials =
    `${user?.nombres?.charAt(0) || "N"}${user?.apellidos?.charAt(0) || ""}`.toUpperCase();
  const flash = props.flash?.error || props.flash?.success;
  return (
    <div
      className={`admin-layout panel-shell ${collapsed ? "is-collapsed" : ""} ${mobile ? "mobile-open" : ""} ${section === "crm" ? "panel-crm" : ""}`}
    >
      <a href="#panel-content" className="panel-skip">
        Ir al contenido
      </a>
      {mobile && (
        <button
          className="panel-sidebar-backdrop"
          aria-label="Cerrar navegación"
          onClick={closeMobile}
        />
      )}
      <aside
        className="admin-sidebar panel-sidebar"
        ref={mobileDialog}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile || undefined}
        aria-label="Navegación principal"
      >
        <div className="panel-brand">
          <Link
            href={
              canAccess(user, "ver_dashboard")
                ? "/admin"
                : groups[0]?.items[0]?.href || "/admin/equipo"
            }
            aria-label="Inicio de Novape"
            className="panel-brand-link"
          >
            <img src="/images/logo.png" alt="Novape" className="panel-brand-logo" />
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="panel-mobile-close panel-icon-button"
            aria-label="Cerrar navegación"
          >
            <X size={19} />
          </button>
        </div>
        <button
          type="button"
          className="panel-sidebar-search"
          onClick={() => {
            setMobile(false);
            setPalette(true);
          }}
          title="Buscar en el panel (Ctrl+K)"
        >
          <Search size={17} />
          <span>Buscar en el panel</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav className="panel-navigation" aria-label="Módulos del panel">
          {groups.map((group) => {
            const active = group.items.some((item) => activeItem(item, url));
            const closed =
              !collapsed && closedGroups.includes(group.label) && !active;
            return (
              <section className="panel-nav-group" key={group.label}>
                <button
                  type="button"
                  className="panel-nav-group-title"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!closed}
                  aria-controls={`nav-${group.label.replace(/\W/g, "-")}`}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={12}
                    className={closed ? "is-closed" : ""}
                  />
                </button>
                <div
                  id={`nav-${group.label.replace(/\W/g, "-")}`}
                  hidden={closed}
                >
                  {group.items.map((item) => (
                    <Link
                      href={item.href}
                      key={item.href}
                      title={item.label}
                      aria-current={activeItem(item, url) ? "page" : undefined}
                      className={`panel-nav-link ${activeItem(item, url) ? "active" : ""}`}
                    >
                      <item.icon size={18} strokeWidth={1.7} />
                      <span>{item.label}</span>
                      {activeItem(item, url) && (
                        <span className="panel-active-dot" />
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </nav>
        <footer className="panel-sidebar-footer">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="panel-nav-link"
            title="Abrir tienda"
          >
            <ExternalLink size={17} />
            <span>Abrir tienda</span>
            <ArrowUpRight size={14} />
          </a>
          <div className="panel-profile">
            <span className="panel-avatar">{initials}</span>
            <span className="panel-profile-text">
              <strong>{user?.nombres || "Mi cuenta"}</strong>
              <small>
                {user?.roles?.map((role) => role.nombre).join(" · ") ||
                  "Equipo Novape"}
              </small>
            </span>
            <Link
              href="/admin/logout"
              method="post"
              as="button"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="panel-icon-button"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </footer>
      </aside>
      <main className="admin-main panel-main">
        <header className="admin-topbar panel-topbar">
          <div className="panel-topbar-left">
            <button
              type="button"
              className="panel-icon-button panel-desktop-menu"
              aria-label={
                collapsed ? "Expandir navegación" : "Contraer navegación"
              }
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
            <button
              type="button"
              className="panel-icon-button panel-mobile-menu"
              aria-label="Abrir navegación"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <nav className="panel-breadcrumb" aria-label="Ubicación">
              <span>{current?.group || "Espacio de trabajo"}</span>
              <ChevronRight size={13} />
              <strong>{title || current?.label || "Panel de control"}</strong>
            </nav>
          </div>
          <div className="panel-topbar-actions">
            <button
              type="button"
              className="panel-search-trigger"
              onClick={() => setPalette(true)}
              aria-label="Buscar en el panel"
            >
              <Search size={16} />
              <span>Buscar</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="panel-notification-anchor" ref={notificationPanel}>
              <button
                type="button"
                className="panel-icon-button"
                onClick={() => {
                  setShowNotifications((show) => !show);
                  refreshNotifications();
                }}
                aria-label={`Notificaciones${unread ? `: ${unread} sin leer` : ""}`}
                aria-expanded={showNotifications}
              >
                <Bell size={19} />
                {unread > 0 && <span className="panel-notification-dot" />}
              </button>
              {showNotifications && (
                <section
                  className="panel-notifications"
                  aria-label="Notificaciones"
                >
                  <header>
                    <div>
                      <strong>Notificaciones</strong>
                      <small>
                        {unread ? `${unread} sin leer` : "Estás al día"}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="panel-icon-button"
                      title="Marcar todas como leídas"
                      aria-label="Marcar todas como leídas"
                      disabled={!unread || reading}
                      onClick={() => read()}
                    >
                      <CheckCheck size={18} />
                    </button>
                    <button
                      type="button"
                      className="panel-icon-button"
                      aria-label="Cerrar notificaciones"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X size={17} />
                    </button>
                  </header>
                  {notificationError && (
                    <div className="panel-inline-error" role="alert">
                      {notificationError}
                      <button type="button" onClick={refreshNotifications}>
                        Reintentar
                      </button>
                    </div>
                  )}
                  <div className="panel-notification-list">
                    {!notifications.length && !notificationError ? (
                      <div className="panel-empty">
                        <Bell size={25} />
                        <strong>Sin notificaciones</strong>
                        <span>
                          Las novedades de tu operación aparecerán aquí.
                        </span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          type="button"
                          key={n.id}
                          disabled={reading}
                          className={`panel-notification ${n.read ? "" : "is-unread"}`}
                          onClick={() => read(n)}
                        >
                          <span className="panel-notification-symbol">
                            <Bell size={16} />
                          </span>
                          <span>
                            <strong>{n.title}</strong>
                            {n.body && <span>{n.body}</span>}
                            <small>{n.time}</small>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>
            <span
              className="panel-avatar panel-topbar-avatar"
              title={user?.nombres}
            >
              {initials}
            </span>
          </div>
        </header>
        {navigating && (
          <div
            className="panel-route-progress"
            role="progressbar"
            aria-label="Cargando página"
          />
        )}
        <div
          className="admin-content panel-content"
          id="panel-content"
          tabIndex={-1}
        >
          {flash && dismissed !== flash && (
            <div
              className={`panel-flash ${props.flash?.error ? "is-error" : "is-success"}`}
              role={props.flash?.error ? "alert" : "status"}
            >
              <span>{flash}</span>
              <button
                type="button"
                className="panel-icon-button"
                aria-label="Cerrar aviso"
                onClick={() => setDismissed(flash)}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {headerActions && (
            <div className="panel-page-actions">{headerActions}</div>
          )}
          {children}
        </div>
      </main>
      <PanelCommandPalette open={palette} close={closePalette} user={user} />
    </div>
  );
}

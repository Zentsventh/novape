import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import {
  Search,
  ArrowUpRight,
  X,
  Loader2,
  Package,
  UserRound,
  ShoppingBag,
} from "lucide-react";
import { canAccess, visibleNavigation } from "./navigation";
import useDialog from "./useDialog";

const normalize = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export default function PanelCommandPalette({ open, close, user }) {
  const dialog = useRef(null);
  const [query, setQuery] = useState(""),
    [results, setResults] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  useDialog(open, dialog, close);
  const modules = visibleNavigation(user)
    .flatMap((group) =>
      group.items.map((item) => ({ ...item, category: group.label })),
    )
    .filter((item) =>
      normalize(`${item.label} ${item.category}`).includes(normalize(query)),
    );
  const items = [...modules, ...results];
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setError("");
      setIndex(0);
    }
  }, [open]);
  useEffect(() => {
    setIndex(0);
    setResults([]);
    setError("");
    if (!open || query.trim().length < 3 || !canAccess(user, "ver_dashboard")) {
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get("/admin/buscar", {
          params: { q: query.trim() },
          signal: controller.signal,
        });
        const mapped = [];
        for (const [key, category, icon, base, permission] of [
          [
            "productos",
            "Productos",
            Package,
            "/admin/products",
            "ver_productos",
          ],
          [
            "usuarios",
            "Clientes",
            UserRound,
            "/admin/clientes",
            "usuarios.gestionar",
          ],
          ["pedidos", "Pedidos", ShoppingBag, "/admin/pedidos", "ver_pedidos"],
        ]) {
          if (!canAccess(user, permission)) continue;
          for (const row of data[key] || [])
            mapped.push({
              href: `${base}/${row.id}`,
              label:
                row.nombre ||
                (row.nombres
                  ? `${row.nombres} ${row.apellidos || ""}`.trim()
                  : null) ||
                row.codigo ||
                row.codigo_pedido ||
                `Pedido #${row.id}`,
              category,
              icon,
            });
        }
        if (!controller.signal.aborted) setResults(mapped);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            "No se pudieron buscar registros. Puedes abrir los módulos o intentar de nuevo.",
          );
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, user]);
  const visit = (item) => {
    close();
    router.visit(item.href);
  };
  if (!open) return null;
  return (
    <div
      className="panel-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="panel-command"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en el panel"
        tabIndex={-1}
      >
        <div className="panel-command-input">
          <Search size={20} />
          <input
            aria-label="Buscar módulos, productos, clientes o pedidos"
            placeholder="¿A dónde quieres ir?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, items.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && items[index]) {
                e.preventDefault();
                visit(items[index]);
              }
            }}
          />
          {busy && <Loader2 size={18} className="panel-spin" />}
          <button
            type="button"
            className="panel-icon-button"
            aria-label="Cerrar búsqueda"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <div className="panel-command-results">
          {error && (
            <p className="panel-inline-error" role="alert">
              {error}
            </p>
          )}
          {!items.length && !busy && (
            <div className="panel-empty">
              <Search size={24} />
              <strong>Sin resultados</strong>
              <span>Prueba otro nombre o una palabra más corta.</span>
            </div>
          )}
          {items.map((item, i) => (
            <button
              type="button"
              className={`panel-command-result ${i === index ? "is-selected" : ""}`}
              key={`${item.category}-${item.href}`}
              onClick={() => visit(item)}
              onFocus={() => setIndex(i)}
            >
              <item.icon size={18} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.category}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
        <footer>
          <span>↑ ↓ para recorrer · Enter para abrir</span>
          <span>Esc para cerrar</span>
        </footer>
      </section>
    </div>
  );
}

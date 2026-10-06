import { useEffect } from "react";

export default function useDialog(open, ref, onClose) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const dialog = ref.current;
    const focusable = () =>
      [
        ...(dialog?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) || []),
      ].filter((el) => el.getClientRects().length);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (focusable()[0] || dialog)?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", keydown);
      previous?.focus?.();
    };
  }, [open, ref, onClose]);
}

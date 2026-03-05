import { useCallback, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    const toast = { id, title: t.title, message: t.message, type: t.type || "info" };
    setToasts((x) => [toast, ...x].slice(0, 4));
    setTimeout(() => {
      setToasts((x) => x.filter((y) => y.id !== id));
    }, 3200);
  }, []);

  return { toasts, push };
}
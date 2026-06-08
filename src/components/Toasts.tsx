import { useToastsStore } from "@/stores/toasts";
import { css } from "@emotion/react";
import { useEffect } from "react";
import { Button, Toast, ToastContainer } from "react-bootstrap";

export default function Toasts() {
  const toasts = useToastsStore((store) => store.toasts);
  const removeToast = useToastsStore((store) => store.removeToast);
  const removeExpiredToasts = useToastsStore(
    (store) => store.removeExpiredToasts,
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      removeExpiredToasts();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [removeExpiredToasts]);

  return (
    <ToastContainer
      className="p-3"
      position="bottom-end"
      css={css`z-index: 1;`}
    >
      {toasts.map((toast) => (
        <Toast key={toast.key} bg={toast.variant}>
          <Toast.Header closeButton={false}>
            <strong className="me-auto">{toast.title}</strong>
            <Button
              className="btn-close"
              onClick={() => removeToast(toast.key)}
            />
          </Toast.Header>
          <Toast.Body>{toast.text}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}

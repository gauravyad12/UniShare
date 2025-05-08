import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastProgress,
} from "../../components/ui/toast";
import { useToast } from "../../components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration = 5000, ...props }) {
        return (
          <Toast key={id} {...props} className="relative overflow-hidden pb-3">
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <ToastProgress duration={duration} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

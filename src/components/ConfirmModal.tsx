import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, Trash2, XCircle, AlertTriangle } from "lucide-react";

export function ConfirmModal({
  children,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
            }}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {confirmText.toLowerCase().includes("log out") ? (
              <LogOut className="mr-2 h-4 w-4" />
            ) : null}
            {confirmText.toLowerCase().includes("delete") ? (
              <Trash2 className="mr-2 h-4 w-4" />
            ) : null}
            {confirmText.toLowerCase().includes("cancel") ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : null}
            {!confirmText.toLowerCase().includes("log out") &&
            !confirmText.toLowerCase().includes("delete") &&
            !confirmText.toLowerCase().includes("cancel") &&
            variant === "destructive" ? (
              <AlertTriangle className="mr-2 h-4 w-4" />
            ) : null}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

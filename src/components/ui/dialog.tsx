"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && onOpenChange) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      {/* 对话框内容 */}
      <div className="relative z-50 w-full mx-4">
        {children}
      </div>
    </div>
  );
};

const DialogContent: React.FC<DialogContentProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 relative",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogHeader: React.FC<DialogHeaderProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn("mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogTitle: React.FC<DialogTitleProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <h2
      className={cn(
        "text-lg font-semibold text-gray-900 dark:text-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle }; 
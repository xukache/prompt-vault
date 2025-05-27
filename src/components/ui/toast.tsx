import { useState, useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // 等待动画完成
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform";
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white`;
      case 'info':
        return `${baseStyles} bg-blue-500 text-white`;
      default:
        return `${baseStyles} bg-gray-500 text-white`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="bi bi-check-circle mr-2"></i>;
      case 'error':
        return <i className="bi bi-x-circle mr-2"></i>;
      case 'warning':
        return <i className="bi bi-exclamation-triangle mr-2"></i>;
      case 'info':
        return <i className="bi bi-info-circle mr-2"></i>;
      default:
        return null;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center">
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="ml-3 text-white hover:text-gray-200 transition-colors"
        >
          <i className="bi bi-x text-lg"></i>
        </button>
      </div>
    </div>
  );
};

// Toast管理器
interface ToastItem extends ToastProps {
  id: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (props: Omit<ToastProps, 'onClose'>) => {
    const id = Date.now().toString();
    const toast: ToastItem = {
      ...props,
      id,
      onClose: () => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }
    };
    
    setToasts(prev => [...prev, toast]);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );

  return {
    showToast,
    ToastContainer
  };
}; 
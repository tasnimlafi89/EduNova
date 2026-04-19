import React, { useState, useCallback, createContext, useContext } from 'react';

const NotificationContext = createContext(null);

let notifyIdCounter = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = ++notifyIdCounter;
    const item = {
      id,
      type: notification.type || 'info',  // success, error, warning, info, achievement
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 4000,
      icon: notification.icon,
    };

    setNotifications(prev => [...prev, item]);

    if (item.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, item.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = {
    success: (title, message) => addNotification({ type: 'success', title, message, icon: 'check_circle' }),
    error: (title, message) => addNotification({ type: 'error', title, message, icon: 'error' }),
    warning: (title, message) => addNotification({ type: 'warning', title, message, icon: 'warning' }),
    info: (title, message) => addNotification({ type: 'info', title, message, icon: 'info' }),
    achievement: (title, message) => addNotification({ type: 'achievement', title, message, icon: 'emoji_events', duration: 6000 }),
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <div className="notification-container">
        {notifications.map((n) => (
          <NotificationToast 
            key={n.id} 
            notification={n} 
            onClose={() => removeNotification(n.id)} 
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

const typeStyles = {
  success: { bg: 'bg-secondary/10', border: 'border-secondary/30', text: 'text-secondary', glow: 'shadow-[0_0_20px_rgba(165,231,255,0.15)]' },
  error: { bg: 'bg-error/10', border: 'border-error/30', text: 'text-error', glow: 'shadow-[0_0_20px_rgba(255,180,171,0.15)]' },
  warning: { bg: 'bg-tertiary/10', border: 'border-tertiary/30', text: 'text-tertiary', glow: 'shadow-[0_0_20px_rgba(255,184,115,0.15)]' },
  info: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', glow: 'shadow-[0_0_20px_rgba(220,184,255,0.15)]' },
  achievement: { bg: 'bg-gradient-to-r from-primary/20 to-secondary/20', border: 'border-primary/40', text: 'text-white', glow: 'shadow-[0_0_30px_rgba(138,43,226,0.25)]' },
};

const NotificationToast = ({ notification, onClose }) => {
  const style = typeStyles[notification.type] || typeStyles.info;

  return (
    <div className={`animate-notification-in flex items-start gap-3 min-w-[320px] max-w-[420px] p-4 rounded-2xl border backdrop-blur-xl ${style.bg} ${style.border} ${style.glow}`}>
      <span className={`material-symbols-outlined text-xl mt-0.5 ${style.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {notification.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm">{notification.title}</p>
        {notification.message && (
          <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">{notification.message}</p>
        )}
      </div>
      <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors flex-shrink-0">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};

"use client";

import React, { useEffect } from 'react';
import styles from './Toast.module.scss';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number; // ms, 0 = no auto-dismiss
  onDismiss?: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onDismiss }: ToastProps) {
  useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[`toast-${type}`]}`}>
      <span>{message}</span>
      {onDismiss && (
        <button
          className={styles.closeBtn}
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}

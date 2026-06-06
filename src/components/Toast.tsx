/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

interface ToastProps {
  message: {
    title: string;
    desc: string;
    type: 'success' | 'info' | 'error';
  } | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      border: 'border-l-4 border-emerald-500',
      icon: 'check_circle',
      iconColor: 'text-emerald-500',
    },
    info: {
      border: 'border-l-4 border-tertiary',
      icon: 'info',
      iconColor: 'text-tertiary',
    },
    error: {
      border: 'border-l-4 border-primary',
      icon: 'error',
      iconColor: 'text-primary',
    },
  };

  const config = typeConfig[message.type] || typeConfig.info;

  return (
    <div className={`fixed bottom-12 right-12 bg-white ${config.border} shadow-xl rounded-md p-4 max-w-sm z-[200] flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 border border-slate-100`}>
      <span className={`material-symbols-outlined ${config.iconColor} text-[22px] select-none`}>
        {config.icon}
      </span>
      <div className="flex-1">
        <h4 className="font-sans font-bold text-sm text-on-surface leading-tight">
          {message.title}
        </h4>
        <p className="font-sans text-xs text-on-surface-variant mt-1 leading-normal">
          {message.desc}
        </p>
      </div>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] select-none">close</span>
      </button>
    </div>
  );
}

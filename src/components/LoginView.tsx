/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Por favor introduce tu nombre de usuario o negocio.');
      return;
    }
    if (!password) {
      setErrorMsg('La contraseña es necesaria.');
      return;
    }
    
    // Accept any credentials for interactive demo, but resolve username
    onLoginSuccess(username.trim());
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-surface-bright font-sans p-6 select-none">
      <div className="w-full max-w-md">
        
        {/* Core Card Container */}
        <div className="bg-white rounded-xl border border-surface-variant p-10 shadow-sm flex flex-col gap-6">
          
          {/* Logo Header */}
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-primary tracking-tight font-sans">Digicell</h1>
            <p className="text-sm font-sans text-on-surface-variant mt-2 font-medium">Repair POS System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 border border-red-200 text-xs p-3 rounded-md font-sans">
                {errorMsg}
              </div>
            )}

            {/* Input: Username */}
            <div className="flex flex-col gap-1.5">
              <label 
                className="text-xs font-semibold text-on-surface font-sans" 
                htmlFor="username"
              >
                Company Name / User
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none text-[20px]">
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Enter username"
                  className="h-11 w-full pl-10 pr-3 rounded-md border border-outline-variant bg-white text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors text-sm font-sans outline-none"
                  required
                />
              </div>
            </div>

            {/* Input: Password */}
            <div className="flex flex-col gap-1.5">
              <label 
                className="text-xs font-semibold text-on-surface font-sans" 
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••••••"
                  className="h-11 w-full pl-10 pr-3 rounded-md border border-outline-variant bg-white text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors text-sm font-sans outline-none"
                  required
                />
              </div>
            </div>

            {/* Controls: Remember & Forgot Links */}
            <div className="flex justify-between items-center mt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-outline-variant text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <span className="text-xs font-semibold text-on-surface-variant font-sans">
                  Remember me
                </span>
              </label>
              <a 
                href="#forgot" 
                onClick={(e) => {
                  e.preventDefault();
                  alert('Para restaurar contraseña o soporte técnico, contacte con el Administrador Sgto. de Digicell.');
                }}
                className="text-xs font-semibold text-tertiary hover:text-tertiary-container transition-colors font-sans decoration-transparent hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit CTA button */}
            <button
              id="submit-btn"
              type="submit"
              className="h-12 w-full bg-primary hover:bg-primary-container text-white py-2 px-4 rounded-md font-sans text-sm font-semibold transition-colors duration-200 shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-2 outline-none cursor-pointer"
            >
              Ingresar
              <span className="material-symbols-outlined text-[18px]">login</span>
            </button>
          </form>

        </div>

        {/* Footnote Warning */}
        <div className="text-center mt-6 select-none">
          <p className="text-xs font-semibold text-on-surface-variant font-sans leading-relaxed">
            Secure access for authorized technicians only.
          </p>
        </div>

      </div>
    </div>
  );
}

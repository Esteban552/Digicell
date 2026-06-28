import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("El correo electrónico es obligatorio.");
      return;
    }
    if (!password) {
      setErrorMsg("La contraseña es obligatoria.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? "Credenciales inválidas. Verificá tu correo y contraseña."
            : error.message,
        );
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-surface-bright font-sans p-6 select-none">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-surface-variant p-10 shadow-sm flex flex-col gap-6">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-primary tracking-tight font-sans">
              Digicell
            </h1>
            <p className="text-sm font-sans text-on-surface-variant mt-2 font-medium">
              Sistema POS de Reparación
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 border border-red-200 text-xs p-3 rounded-md font-sans">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-on-surface font-sans"
                htmlFor="email"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none text-[20px]">
                  person
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="correo@ejemplo.com"
                  className="h-11 w-full pl-10 pr-3 rounded-md border border-outline-variant bg-white text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors text-sm font-sans outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-on-surface font-sans"
                htmlFor="password"
              >
                Contraseña
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
                    setErrorMsg("");
                  }}
                  placeholder="••••••••"
                  className="h-11 w-full pl-10 pr-3 rounded-md border border-outline-variant bg-white text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors text-sm font-sans outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-white py-2 px-4 rounded-md font-sans text-sm font-semibold transition-colors duration-200 shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-2 outline-none cursor-pointer"
            >
              {submitting ? (
                <span className="animate-spin material-symbols-outlined text-[18px]">
                  progress_activity
                </span>
              ) : (
                <>
                  Ingresar
                  <span className="material-symbols-outlined text-[18px]">
                    login
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 select-none">
          <p className="text-xs font-semibold text-on-surface-variant font-sans leading-relaxed">
            Acceso seguro solo para técnicos autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}

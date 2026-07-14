import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logging-client";

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
        log.loginFailed(email);
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/login-bg.png)` }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-10 shadow-2xl shadow-black/20 flex flex-col gap-6">
          {/* Brand */}
          <div className="text-center mb-2 select-none">
            <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg shadow-black/10">
              <span className="material-symbols-outlined text-white text-[30px] icon-fill">build</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg font-sans">
              Digicell
            </h1>
            <p className="text-sm text-white/80 mt-2 font-medium drop-shadow-md">
              Sistema POS de Reparación
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-400/40 text-red-200 text-xs p-3 rounded-xl font-sans font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-white/80 font-sans drop-shadow-sm"
                htmlFor="email"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none select-none text-[20px]">
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
                  className="h-11 w-full pl-10 pr-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white placeholder:text-white/40 focus:border-white/50 focus:bg-white/15 focus:ring-0 outline-none transition-all text-sm font-sans"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-white/80 font-sans drop-shadow-sm"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none select-none text-[20px]">
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
                  className="h-11 w-full pl-10 pr-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white placeholder:text-white/40 focus:border-white/50 focus:bg-white/15 focus:ring-0 outline-none transition-all text-sm font-sans"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md disabled:opacity-40 text-white border border-white/30 rounded-xl font-sans text-sm font-semibold transition-all duration-200 shadow-lg shadow-black/10 flex items-center justify-center gap-2 mt-2 outline-none cursor-pointer active:scale-[0.98]"
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
          <p className="text-xs font-semibold text-white/60 font-sans leading-relaxed drop-shadow-md">
            Acceso seguro solo para técnicos autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}

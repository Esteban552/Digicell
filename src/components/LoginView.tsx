import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validaciones iniciales
    if (!email.trim()) {
      setErrorMsg("El correo electrónico es obligatorio.");
      return;
    }
    if (!password) {
      setErrorMsg("La contraseña es obligatoria.");
      return;
    }
    if (mode === "register" && !displayName.trim()) {
      setErrorMsg("El nombre es obligatorio.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        // --- PROCESO DE INICIO DE SESIÓN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(
            error.message === "Invalid login credentials"
              ? "Credenciales inválidas. Verificá tu correo y contraseña."
              : error.message,
          );
        } else {
          // ¡ÉXITO! El usuario inició sesión correctamente
          console.log("¡Inicio de sesión exitoso!", data);
          // Aquí puedes agregar un redireccionamiento si no usas un listener global, ej: router.push('/dashboard')
        }
      } else {
        // --- PROCESO DE REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() } },
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg(
            "Cuenta creada. Revisá tu email para confirmar (si aplica) o ya podés iniciar sesión.",
          );
          setMode("login");
          // Limpiamos los campos por comodidad del usuario
          setDisplayName("");
          setPassword("");
        }
      }
    } catch (err: unknown) {
      setErrorMsg("Ocurrió un error inesperado al conectar con el servidor.");
      console.error("Error del sistema:", err);
    } finally {
      // Este bloque SIEMPRE se ejecuta al final, apagando el cargando pase lo que pase
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
            {successMsg && (
              <div className="bg-green-50 text-green-700 border border-green-200 text-xs p-3 rounded-md font-sans">
                {successMsg}
              </div>
            )}

            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-on-surface font-sans"
                  htmlFor="displayName"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none select-none text-[20px]">
                    badge
                  </span>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="Ej: Juan Pérez"
                    className="h-11 w-full pl-10 pr-3 rounded-md border border-outline-variant bg-white text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-colors text-sm font-sans outline-none"
                    required
                  />
                </div>
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
              ) : mode === "login" ? (
                <>
                  Ingresar
                  <span className="material-symbols-outlined text-[18px]">
                    login
                  </span>
                </>
              ) : (
                <>
                  Crear Cuenta
                  <span className="material-symbols-outlined text-[18px]">
                    person_add
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-xs font-semibold text-tertiary hover:text-tertiary-container transition-colors font-sans underline underline-offset-2 cursor-pointer outline-none"
            >
              {mode === "login"
                ? "¿No tenés cuenta? Crear una nueva"
                : "Ya tengo cuenta, iniciar sesión"}
            </button>
          </div>
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

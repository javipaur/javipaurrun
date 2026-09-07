"use client";

import { useState, FormEvent } from "react";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("¡Te has suscrito correctamente!");
        setEmail("");
        toast("¡Te has suscrito correctamente!");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Error al suscribirse");
        toast(data.error || "Error al suscribirse", "error");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión");
      toast("Error de conexión", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          disabled={status === "loading"}
          className="field h-11 pl-9 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary justify-center disabled:opacity-50"
      >
        {status === "loading" ? "Enviando..." : "Suscribirse"}
      </button>
      {status === "success" && (
        <div className="flex items-center gap-1.5 text-success text-xs">
          <CheckCircle size={13} />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-1.5 text-error text-xs">
          <AlertCircle size={13} />
          {message}
        </div>
      )}
    </form>
  );
}

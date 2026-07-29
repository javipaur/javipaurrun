"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { raceTypes, provinces } from "@/lib/utils";

export default function NewRacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
      const latVal = form.get("latitude");
      const lngVal = form.get("longitude");
      const data = {
        name: form.get("name"),
        type: form.get("type"),
        distance: form.get("distance"),
        location: form.get("location"),
        province: form.get("province"),
        date: form.get("date"),
        time: form.get("time"),
        description: form.get("description"),
        url: form.get("url"),
        latitude: latVal ? Number(latVal) : undefined,
        longitude: lngVal ? Number(lngVal) : undefined,
        price: form.get("price"),
        status: form.get("status"),
      };

    const res = await fetch("/api/races", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/races");
      router.refresh();
    } else {
      alert("Error al crear la carrera");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva carrera</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input name="name" required className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select name="type" required className="w-full px-4 py-2.5 border rounded-lg text-sm">
              {raceTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distancia</label>
            <input name="distance" className="w-full px-4 py-2.5 border rounded-lg text-sm" placeholder="10 km" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
            <select name="province" required className="w-full px-4 py-2.5 border rounded-lg text-sm">
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
            <input name="location" required className="w-full px-4 py-2.5 border rounded-lg text-sm" placeholder="Ej: Bilbao" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input name="date" type="date" required className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
            <input name="time" type="time" className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <input name="price" className="w-full px-4 py-2.5 border rounded-lg text-sm" placeholder="Ej: 15€" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select name="status" className="w-full px-4 py-2.5 border rounded-lg text-sm">
              <option value="PROXIMAMENTE">Próximamente</option>
              <option value="INSCRIPCIONES_ABIERTAS">Inscripciones abiertas</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL (inscripción/evento)</label>
          <input name="url" type="url" className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
            <input name="latitude" type="number" step="any" className="w-full px-4 py-2.5 border rounded-lg text-sm" placeholder="43.2630" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
            <input name="longitude" type="number" step="any" className="w-full px-4 py-2.5 border rounded-lg text-sm" placeholder="-2.9350" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="description" rows={4} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar carrera"}
        </button>
      </form>
    </div>
  );
}

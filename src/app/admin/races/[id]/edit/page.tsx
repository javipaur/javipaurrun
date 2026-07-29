"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { raceTypes, provinces } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRacePage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [race, setRace] = useState<any>(null);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/races/${id}`)
      .then((res) => res.json())
      .then(setRace)
      .catch(() => router.push("/admin/races"));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch(`/api/races/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/races");
      router.refresh();
    } else {
      alert("Error al actualizar");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta carrera?")) return;
    await fetch(`/api/races/${id}`, { method: "DELETE" });
    router.push("/admin/races");
    router.refresh();
  }

  if (!race) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar carrera</h1>
        <button onClick={handleDelete} className="text-red-500 text-sm hover:underline">
          Eliminar
        </button>
      </div>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input name="name" defaultValue={race.name} required className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select name="type" defaultValue={race.type} required className="w-full px-4 py-2.5 border rounded-lg text-sm">
              {raceTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distancia</label>
            <input name="distance" defaultValue={race.distance || ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
            <select name="province" defaultValue={race.province} required className="w-full px-4 py-2.5 border rounded-lg text-sm">
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
            <input name="location" defaultValue={race.location} required className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input name="date" type="date" defaultValue={new Date(race.date).toISOString().split("T")[0]} required className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
            <input name="time" type="time" defaultValue={race.time || ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <input name="price" defaultValue={race.price || ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select name="status" defaultValue={race.status} className="w-full px-4 py-2.5 border rounded-lg text-sm">
              <option value="PROXIMAMENTE">Próximamente</option>
              <option value="INSCRIPCIONES_ABIERTAS">Inscripciones abiertas</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
          <input name="url" type="url" defaultValue={race.url || ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
            <input name="latitude" type="number" step="any" defaultValue={race.latitude ?? ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
            <input name="longitude" type="number" step="any" defaultValue={race.longitude ?? ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="description" rows={4} defaultValue={race.description || ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

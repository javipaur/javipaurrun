"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function CompareButton() {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([""]);

  function addField() {
    if (ids.length < 3) setIds([...ids, ""]);
  }

  function removeField(i: number) {
    setIds(ids.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = ids.map((id) => id.trim()).filter(Boolean);
    if (valid.length >= 2) {
      router.push(`/comparar?ids=${valid.join(",")}`);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        O introduce los IDs de las carreras manualmente
      </h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        {ids.map((id, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={id}
              onChange={(e) => {
                const next = [...ids];
                next[i] = e.target.value;
                setIds(next);
              }}
              placeholder="ID de la carrera..."
              className="flex-1 h-10 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            {ids.length > 1 && (
              <button
                type="button"
                onClick={() => removeField(i)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {ids.length < 3 && (
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 transition-colors"
          >
            <Plus size={14} /> Añadir otra carrera
          </button>
        )}
        <button
          type="submit"
          disabled={ids.filter((id) => id.trim()).length < 2}
          className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Comparar
        </button>
      </form>
    </div>
  );
}

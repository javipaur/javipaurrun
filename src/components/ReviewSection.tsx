"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

export default function ReviewSection({ raceId }: { raceId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/races/${raceId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setAverage(d.average || 0);
        setTotal(d.total || 0);
      })
      .catch(() => {});
  }, [raceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/races/${raceId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => [data.review, ...prev]);
        setAverage(
          Math.round(((average * total + rating) / (total + 1)) * 10) / 10
        );
        setTotal((t) => t + 1);
        setSuccess(true);
        setShowForm(false);
        setRating(0);
        setComment("");
      } else {
        setError(data.error || "Error al enviar valoración");
      }
    } catch {
      setError("Error de conexión");
    }
    setSubmitting(false);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare size={15} />
            Valoraciones
          </h2>
          {total > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {average.toFixed(1)} ★ · {total} valoración{total !== 1 ? "es" : ""}
            </p>
          )}
        </div>
        {!success && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
          >
            {showForm ? "Cancelar" : "Valorar carrera"}
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-xl">
          ¡Gracias por tu valoración!
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Puntuación
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`p-1 transition-colors ${
                    n <= rating ? "text-orange-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  <Star size={20} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Cuenta tu experiencia en esta carrera..."
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Enviando..." : "Enviar valoración"}
          </button>
        </form>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  {r.user.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link
                    href={`/atleta/${r.user.id}`}
                    className="text-xs font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-600 transition-colors"
                  >
                    {r.user.name || "Anónimo"}
                  </Link>
                  <span className="text-[10px] text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={11}
                      className={n <= r.rating ? "text-orange-400" : "text-gray-300 dark:text-gray-600"}
                      fill={n <= r.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {r.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
          {success ? "" : "Sé el primero en valorar esta carrera"}
        </p>
      )}
    </div>
  );
}

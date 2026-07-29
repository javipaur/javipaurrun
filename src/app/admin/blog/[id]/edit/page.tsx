"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditBlogPostPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/blog/${id}`)
      .then((res) => res.json())
      .then(setPost)
      .catch(() => router.push("/admin/blog"));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title"),
      excerpt: form.get("excerpt"),
      content: form.get("content"),
      published: form.get("published") === "on",
    };

    const res = await fetch(`/api/blog/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/blog");
      router.refresh();
    } else {
      alert("Error al actualizar");
      setLoading(false);
    }
  }

  if (!post) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar artículo</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input name="title" defaultValue={post.title} required className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extracto</label>
          <textarea name="excerpt" rows={2} defaultValue={post.excerpt || ""} className="w-full px-4 py-2.5 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
          <textarea name="content" rows={12} defaultValue={post.content} required className="w-full px-4 py-2.5 border rounded-lg text-sm font-mono" />
        </div>
        <div className="flex items-center gap-2">
          <input name="published" type="checkbox" id="published" defaultChecked={post.published} className="rounded" />
          <label htmlFor="published" className="text-sm text-gray-700">Publicado</label>
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

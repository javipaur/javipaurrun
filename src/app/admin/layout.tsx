import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/races", label: "Carreras", icon: "🏃" },
  { href: "/admin/blog", label: "Blog", icon: "📝" },
  { href: "/admin/scraping", label: "Scraping", icon: "🤖" },
  { href: "/admin/results", label: "Mis resultados", icon: "⏱️" },
  { href: "/admin/subscribers", label: "Suscriptores", icon: "📧" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="flex min-h-[80vh]">
      <aside className="w-56 bg-white border-r border-gray-200 p-5 hidden md:block">
        <h2 className="text-sm font-bold text-gray-900 mb-5">Panel Admin</h2>
        <nav className="space-y-0.5">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-5 md:p-6">{children}</div>
    </div>
  );
}

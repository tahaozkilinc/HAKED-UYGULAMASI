import { requireProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-svh flex-col">
      <Topbar profile={profile} />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r bg-card md:block">
          <Sidebar role={profile.role} />
        </aside>
        <main className="flex-1 bg-muted/20 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return (
    <div className="flex h-[100dvh] bg-page overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}

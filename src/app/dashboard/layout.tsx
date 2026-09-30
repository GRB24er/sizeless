import { AppSidebar } from "@/components/features/dashboard/app-sidebar";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth-guards";

// The whole /dashboard area is admin-only. Clients use the public site
// (profile, their shipments, their vault) and never see this interface.
const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <SidebarProvider className="font-admin">
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 md:gap-6 min-h-screen p-2">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;

"use client";
import * as React from "react";
import {
  FileTextIcon, FolderIcon, Globe, HelpCircleIcon,
  LayoutDashboardIcon, SettingsIcon, Vault, Users, DollarSign,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
const data = {
  user: { name: "Admin", email: "admin@aegiscargo.org", avatar: "/avatars/admin.jpg" },
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
    { title: "Website", url: "/", icon: Globe },
    { title: "Shipments", url: "/dashboard/shipments", icon: FolderIcon },
    { title: "Fees & Payments", url: "/dashboard/fees", icon: DollarSign },
    { title: "Users", url: "/dashboard/users", icon: Users },
    { title: "Vault Management", url: "/dashboard/vault", icon: Vault },
    { title: "Documents", url: "/dashboard/documents", icon: FileTextIcon },
  ],
  navSecondary: [
    { title: "Settings", url: "#", icon: SettingsIcon },
    { title: "Get Help", url: "#", icon: HelpCircleIcon },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Logo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

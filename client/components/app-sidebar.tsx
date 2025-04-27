"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useCurrentUser } from "@/hooks/use-user"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Patients",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Appointments",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Medical Records",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Lab Results",
      url: "#",
      icon: IconChartBar,
    },
  ],
  navClouds: [
    {
      title: "Imaging",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Recent Scans",
          url: "#",
        },
        {
          title: "Archive",
          url: "#",
        },
      ],
    },
    {
      title: "Prescriptions",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Medications",
          url: "#",
        },
        {
          title: "History",
          url: "#",
        },
      ],
    },
    {
      title: "AI Assistance",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Diagnosis Support",
          url: "#",
        },
        {
          title: "Treatment Plans",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/profile",
      icon: IconSettings,
    },
    {
      title: "Support",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Clinical Guidelines",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Medical Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Documentation",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const user = useCurrentUser();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

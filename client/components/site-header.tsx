"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { logout } from "@/services/auth.service"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

export function SiteHeader() {
  const pathname = usePathname()

  const pageName = useMemo(() => {
    const segment = pathname?.split("/").pop() || "Dashboard"
    return segment === "dashboard" ? "Patients" : segment.charAt(0).toUpperCase() + segment.slice(1)
  }, [pathname])

  const handleLogout = () => {
    logout();
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageName}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleLogout} variant="ghost" size="sm" className="hidden sm:flex">
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

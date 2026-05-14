"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/auth-cookie";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Library,
  LogOut,
  School,
  ScrollText,
  User,
  Users,
  ClipboardList,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Courses",
    items: [
      { href: "/courses", label: "Courses", icon: School },
      { href: "/course-semesters", label: "Course semesters", icon: Layers },
      { href: "/course-books", label: "Course books", icon: Library },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/professors", label: "Professors", icon: GraduationCap },
      { href: "/students", label: "Students", icon: Users },
    ],
  },
  {
    label: "Enrollment & exams",
    items: [
      { href: "/enrollments", label: "Enrollments", icon: ClipboardList },
      { href: "/exams", label: "Exams", icon: ScrollText },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/authors", label: "Authors", icon: User },
      { href: "/books", label: "Books", icon: BookOpen },
    ],
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearAuthToken();
    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1">
            <SidebarTrigger className="-ml-1" />
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              Course Record
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-0">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={pathname === item.href}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">Log out</span>
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-medium">Course Record</span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

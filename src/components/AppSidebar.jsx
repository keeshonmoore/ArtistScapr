import * as React from "react";
import {
  Home,
  Search,
  Music,
  User,
  BookOpen,
  Book,
  Sun,
  Moon,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "./ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const data = {
  user: {
    name: "Hollywood Eiman",
    email: "user@artistfindr.com",
    avatar: "./avatar.jpg",
  },
  teams: [
    {
      name: "ArtistFindr",
      logo: Music,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Find Artist",
      url: "/find-artist",
      icon: Search,
    },
    {
      title: "Scrape Playlist",
      url: "/scrape-playlist",
      icon: Music,
    },
    {
      title: "Library",
      icon: Book,
      items: [
        {
          title: "Artists",
          url: "/artist",
        },
        {
          title: "Playlists",
          url: "/playlist",
        },
      ],
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: BookOpen,
    },
  ],
};

export default function AppSidebar({ ...props }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar collapsible="icon" className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          className="[&>li>a]:transition-colors [&>li>a]:duration-200 [&>li>a]:hover:bg-accent [&>li>a]:hover:text-accent-foreground [&>li>a[data-active=true]]:bg-accent [&>li>a[data-active=true]]:text-accent-foreground"
        />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="rounded-apple border-accent text-accent hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </Button>
          <NavUser user={data.user} />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
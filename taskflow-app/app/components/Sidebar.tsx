"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { LayoutDashboard, FolderKanban, PlusCircle, LogOut, Menu, X, Bell } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [hasGoogleAccount, setHasGoogleAccount] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSidebar = async () => {
      await checkUserAccount();
      await fetchPendingInvitations();
      setIsLoading(false);
    };
    
    initializeSidebar();
    
    // Refresh invitations every 30 seconds (only if not Google user)
    const interval = setInterval(() => {
      if (hasGoogleAccount === false) {
        fetchPendingInvitations();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [hasGoogleAccount]);

  const checkUserAccount = async () => {
    try {
      const res = await fetch('/api/users/me');
      const data = await res.json();
      if (res.ok && data.user) {
        const isGoogleUser = !!data.user.google_id;
        setHasGoogleAccount(isGoogleUser);
      }
    } catch (error) {
      setHasGoogleAccount(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const res = await fetch('/api/invitations/pending');
      const data = await res.json();
      if (res.ok) {
        setPendingInvitations(data.invitations?.length || 0);
      }
    } catch (error) {
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/logout', { method: 'POST' });
        
        if (response.ok) {
          await Swal.fire({
            icon: "success",
            title: "Logged Out",
            timer: 1500,
            showConfirmButton: false,
          });
          router.push('/login');
          router.refresh();
        } else {
          throw new Error('Logout failed');
        }
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Logout Failed",
          text: "An error occurred during logout",
        });
      }
    }
  };

  type NavItem = {
    name: string;
    path: string;
    icon: any;
    badge?: number;
  };

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Projects", path: "/project", icon: FolderKanban },
    { name: "Create Task", path: "/create-task", icon: PlusCircle },
  ];

  // Only show Invitations menu for non-Google users
  if (!isLoading && hasGoogleAccount === false) {
    navItems.push({ name: "Invitations", path: "/invitations", icon: Bell, badge: pendingInvitations });
  }

  return (
    <aside
      className={`bg-white shadow-lg transition-all duration-300 ${
        isOpen ? "w-80" : "w-20"
      }`}
    >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {isOpen && (
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                TaskFlow
              </span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                    pathname === item.path
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isOpen && <span className="font-medium">{item.name}</span>}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
                      pathname === item.path
                        ? "bg-white text-blue-500"
                        : "bg-red-500 text-white"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all ${
                !isOpen && "justify-center"
              }`}
            >
              <LogOut className="w-5 h-5" />
              {isOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
  );
}

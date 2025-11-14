"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
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

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Group", path: "/group" },
    { name: "Create Task", path: "/create-task" },
  ];

  return (
    <aside
      className={`bg-gray-800 text-white transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {isOpen && (
              <span className="text-2xl font-bold text-blue-400">TaskFlow</span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isOpen ? "◀" : "▶"}
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.path
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                {isOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              {isOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
  );
}

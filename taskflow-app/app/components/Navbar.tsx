"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === "/login"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === "/register"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

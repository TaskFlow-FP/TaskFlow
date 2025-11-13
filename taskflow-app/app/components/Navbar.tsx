"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-400">TaskFlow</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/login"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/register"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
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

"use client"

import { useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const resp = await fetch("/api/register", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, full_name: fullName, password})
      })

      const data = await resp.json()

      if (!resp.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: data.message || data.error,
        });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        timer: 1500,
        showConfirmButton: false,
      });

      router.push('/login')
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto">
        <div className="w-full bg-gray-800 rounded-lg shadow-xl md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-center md:text-2xl">
              Create an Account
            </h1>

            <form className="space-y-4 md:space-y-6" onSubmit={handleRegister}>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="block mb-2 text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>

              <p className="text-sm font-light text-center text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-500 hover:underline">
                  Login here
                </Link>
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {isLoading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
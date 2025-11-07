"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginFormProps {
  onSuccess: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate login process
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onSuccess()
      setEmail("")
      setPassword("")
    }, 1000)
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Sign in to your account</h1>
        <p className="text-center text-gray-500 text-sm">Enter your credentials to access the admin panel</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Forgot password?
          </a>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          Don't have an account?{" "}
          <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

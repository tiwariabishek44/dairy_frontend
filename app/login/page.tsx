"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import SuccessToast from "@/components/success-toast"

export default function LoginPage() {
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  const handleLoginSuccess = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      router.push("/dashboard")
    }, 2000)
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://media.istockphoto.com/id/539023932/photo/dairy-cows-grazing-on-summer-farm-fields.jpg?s=612x612&w=0&k=20&c=RzalqMXlto-sSOxdfc9NTevtKwhNmnNl5XklHm4cByc=")',
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content - positioned to the right */}
      <div className="relative z-10 flex items-center min-h-screen px-4 py-8">
        <div className="w-full flex justify-end pr-12">
          <div className="w-full max-w-md">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && <SuccessToast />}
    </main>
  )
}

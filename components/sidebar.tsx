"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Milk, Users, Bell, CreditCard, LogOut, X } from "lucide-react"
import { useState } from "react"

const menuItems = [
  { href: "/dashboard/analytics", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/milk-record-upload", label: "Upload Milk Data", icon: Milk },
  { href: "/dashboard/milk-records", label: "Milk Record", icon: Milk },
  { href: "/dashboard/farmers", label: "Farmers Record", icon: Users },
  { href: "/dashboard/farmer-record-upload", label: "Add Farmers", icon: Users },
  { href: "/dashboard/notices", label: "Announcements", icon: Bell },
  // { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
]

interface SidebarProps {
  isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    // Clear any stored authentication data (localStorage, sessionStorage, cookies, etc.)
    localStorage.removeItem("authToken")
    sessionStorage.removeItem("user")

    // You can also clear cookies if using them
    // document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"

    // Redirect to login page
    router.push("/login")
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    handleLogout()
  }

  return (
    <>
      <div
        className={`${isOpen ? "w-64" : "w-20"
          } bg-white text-slate-800 flex flex-col transition-all duration-300 ease-in-out shadow-lg border-r border-gray-200`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-2xl font-bold text-slate-900">{isOpen ? "Dairy Center" : "DC"}</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-100"
                    }`}
                >
                  <Icon size={20} />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-lg text-slate-600 hover:bg-red-50 transition-all hover:text-red-600"
          >
            <LogOut size={20} />
            {isOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-md w-full shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              Do you want to logout? You will be redirected to the login page.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

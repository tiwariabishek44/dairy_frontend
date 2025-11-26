"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AlertCircle, Bell, Plus, X, RefreshCw } from "lucide-react"
import { noticeService, type Notice } from "@/lib/services/notice-service"

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  // Form fields
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const loadNotices = async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await noticeService.getAllNotices()
      setNotices(data)
    } catch (err: any) {
      console.error("[LOAD NOTICES ERROR]", err)
      setError(err.message || "Failed to load notices")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotices()
  }, [])

  const handleAddNotice = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    setError("")
    try {
      await noticeService.createNotice({
        title: title.trim(),
        content: content.trim(),
      })

      setSuccessMessage("Notice posted successfully!")
      setShowAddModal(false)
      setTitle("")
      setContent("")

      // Reload notices
      await loadNotices()

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (err: any) {
      console.error("[ADD NOTICE ERROR]", err)
      setError(err.message || "Failed to post notice")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">Notices & Updates</h1>
              <p className="text-sm text-slate-600">Post announcements and important updates for all farmers</p>
            </div>
          </div>

          {/* Add Notice Button */}
          <button
            onClick={() => {
              setShowAddModal(true)
              setError("")
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Notice
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && !showAddModal && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center bg-white rounded-lg shadow-sm border">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading notices...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notices.length === 0 && (
          <div className="p-12 text-center bg-white rounded-lg shadow-sm border">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No notices posted yet</p>
            <p className="text-sm text-slate-500">Click "Add New Notice" to create your first notice</p>
          </div>
        )}

        {/* Notices List */}
        {!isLoading && notices.length > 0 && (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">{notice.title}</h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    {formatDate(notice.postedAt)}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">
                  {truncateContent(notice.content)}
                </p>
                {notice.content.length > 150 && (
                  <button
                    onClick={() => setSelectedNotice(notice)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    See More
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-slate-900">Add New Notice</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setTitle("")
                  setContent("")
                  setError("")
                }}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., New disease alert"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>

              {/* Content Field */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the notice details..."
                  rows={6}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setTitle("")
                  setContent("")
                  setError("")
                }}
                disabled={isSubmitting}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNotice}
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Post Notice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Full Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">{selectedNotice.title}</h2>
                <span className="text-xs text-slate-500">
                  {formatDate(selectedNotice.postedAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotice.content}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

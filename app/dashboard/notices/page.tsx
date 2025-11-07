"use client"

import { useState } from "react"

export default function NoticesPage() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      content: "Payment released for October milk collection. Please verify your account.",
      image: null,
      date: "2025-10-31",
      time: "14:30",
    },
    {
      id: 2,
      content: "New milk quality standards implemented. SNF minimum increased to 8.0%",
      image: "/dairy-milk-quality-standards.jpg",
      date: "2025-10-30",
      time: "10:15",
    },
    {
      id: 3,
      content: "Scheduled maintenance on collection center on November 5th. No collections will be accepted.",
      image: null,
      date: "2025-10-29",
      time: "09:00",
    },
    {
      id: 4,
      content: "Monthly bonus distribution schedule announced. Check your account for details.",
      image: "/announcement-bonus-distribution.jpg",
      date: "2025-10-28",
      time: "15:45",
    },
  ])

  const [postContent, setPostContent] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePost = () => {
    if (postContent.trim()) {
      const newPost = {
        id: posts.length + 1,
        content: postContent,
        image: imagePreview,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      }
      setPosts([newPost, ...posts])
      setPostContent("")
      setSelectedImage(null)
      setImagePreview(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Notices & Updates</h1>
          <p className="text-slate-600 text-lg">Post announcements and important updates for all farmers</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-8">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Share an important announcement with farmers..."
            className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-slate-50 resize-none placeholder-slate-500 text-base leading-relaxed"
            rows={4}
          />

          {imagePreview && (
            <div className="mt-6 relative rounded-lg overflow-hidden border border-slate-200">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                className="max-h-64 rounded-lg object-cover w-full"
              />
              <button
                onClick={() => {
                  setImagePreview(null)
                  setSelectedImage(null)
                }}
                className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors shadow-lg"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <label className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white">
              Add Image
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            <button
              onClick={handlePost}
              disabled={!postContent.trim()}
              className="ml-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              Post Notice
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-slate-600">
                    {post.date} at {post.time}
                  </div>
                </div>

                {/* Post content */}
                <p className="text-slate-800 leading-relaxed text-base font-medium">{post.content}</p>

                {post.image && (
                  <div className="mt-4 -mx-6 -mb-6">
                    <img
                      src={post.image || "/placeholder.svg"}
                      alt="Post"
                      className="rounded-b-xl object-cover max-h-96 w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

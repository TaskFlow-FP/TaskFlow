"use client"

import { useRouter } from 'next/navigation'
import { useState } from "react"

export default function CreateProjectModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const resp = await fetch('http://localhost:3000/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            })

            const data = await resp.json()
            if (!resp.ok) {
                throw new Error(data.error || "Failed to create project.");
            }

            onClose()
            router.refresh()
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a New Project</h2>
                <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4 text-sm font-medium">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                    <input
                    id="name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder="Enter project name"
                    required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                    <textarea
                    id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition h-24"
                    placeholder="Describe your project..."
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50">
                    {isLoading ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
                </form>
            </div>
        </div>
    )
}

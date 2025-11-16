"use client"

import { useRouter } from "next/navigation"
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
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6">Create a New Project</h2>
                <form onSubmit={handleSubmit}>
                {error && <p className="text-red-400 mb-4">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                    <input
                    id="name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                    <textarea
                    id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50">
                    {isLoading ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
                </form>
            </div>
        </div>
    )
}
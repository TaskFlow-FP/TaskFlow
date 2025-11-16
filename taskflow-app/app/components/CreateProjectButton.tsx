"use client"

import { useState } from "react"
import CreateProjectModal from "./CreateProjectModal"

export default function CreateProjectButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                + Create Project
            </button>

            {isModalOpen && (
                <CreateProjectModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    )
}
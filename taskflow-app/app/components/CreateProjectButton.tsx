"use client"

import { useState } from "react"
import CreateProjectModal from "./CreateProjectModal"

export default function CreateProjectButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm"
            >
                + Create Project
            </button>

            {isModalOpen && (
                <CreateProjectModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    )
}

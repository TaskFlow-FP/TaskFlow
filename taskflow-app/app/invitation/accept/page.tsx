"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Swal from "sweetalert2"

export default function AcceptInvitationPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const acceptInvitation = async () => {
            const token = searchParams.get('token')

            if (!token) {
                setStatus('error')
                setMessage('Invalid invitation link. Token is missing.')
                return
            }

            try {
                const resp = await fetch('http://localhost:3000/api/invitations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                })

                const data = await resp.json()

                if (resp.ok) {
                    setStatus('success')
                    setMessage(data.message || 'Invitation accepted successfully!')

                    await Swal.fire({
                        icon: 'success',
                        title: 'Welcome!',
                        text: data.message || 'Invitation accepted successfully!',
                        timer: 2000,
                        showConfirmButton: false,
                    });

                    setTimeout(() => {
                        router.push('/project');
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Failed to accept invitation');
                    
                    await Swal.fire({
                        icon: 'error',
                        title: 'Invitation Failed',
                        text: data.error || 'Failed to accept invitation',
                    });
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred while accepting the invitation');
                
                await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while accepting the invitation',
                });
            }
        }

        acceptInvitation();
    }, [searchParams, router])

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700 text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">Processing Invitation</h1>
                        <p className="text-gray-400">Please wait while we accept your invitation...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">✅</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Invitation Accepted!</h1>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to projects...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">❌</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Invitation Failed</h1>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/project')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
                        >
                            Go to Projects
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
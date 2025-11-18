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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-10 max-w-md w-full border-2 border-gray-700 text-center shadow-2xl relative z-10">
                {status === 'loading' && (
                    <>
                        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-3xl font-bold text-white mb-3">Processing Invitation</h1>
                        <p className="text-gray-300">Please wait while we accept your invitation...</p>
                        <div className="mt-6 flex justify-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">Invitation Accepted!</h1>
                        <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>
                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                            <p className="text-sm text-blue-300 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Redirecting to projects...
                            </p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">Invitation Failed</h1>
                        <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>
                        <button
                            onClick={() => router.push('/project')}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Go to Projects</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
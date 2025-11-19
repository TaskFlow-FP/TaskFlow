"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/app/components/SidebarLayout";
import Swal from "sweetalert2";

interface Invitation {
  _id: string;
  projectId: string;
  projectName: string;
  projectDescription: string;
  role: string;
  invitedBy: {
    name: string;
    email: string;
  } | null;
  invitedAt: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/invitations/pending');
      const data = await res.json();
      if (res.ok) {
        setInvitations(data.invitations || []);
      } else if (res.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: "Please login to view invitations",
        }).then(() => router.push("/login"));
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load invitations",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (memberId: string) => {
    setProcessing(memberId);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Invitation Accepted!",
          text: data.message,
          timer: 2000,
        });
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv._id !== memberId));
        // Redirect to projects page
        router.push("/project");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Accept",
          text: data.error || "Something went wrong",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to accept invitation",
      });
    }
    setProcessing(null);
  };

  const handleDecline = async (memberId: string) => {
    const result = await Swal.fire({
      title: "Decline Invitation",
      text: "Are you sure you want to decline this invitation?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, decline",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    setProcessing(memberId);
    try {
      const res = await fetch(`/api/invitations?memberId=${memberId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Invitation Declined",
          timer: 1500,
          showConfirmButton: false,
        });
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv._id !== memberId));
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Decline",
          text: data.error || "Something went wrong",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to decline invitation",
      });
    }
    setProcessing(null);
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invitations...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Project Invitations</h1>
              <p className="text-gray-600 mt-1">Manage your pending project invitations</p>
            </div>
          </div>
          {invitations.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-full">
                {invitations.length} pending {invitations.length === 1 ? 'invitation' : 'invitations'}
              </span>
            </div>
          )}
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6">
              <div className="text-7xl">📭</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Pending Invitations</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">You're all caught up! Check back later for new project collaboration opportunities.</p>
            <button
              onClick={() => router.push('/project')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Browse Projects
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {invitations.map((invitation, index) => (
              <div
                key={invitation._id}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:border-indigo-400 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header bar */}
                <div className="h-2 bg-indigo-600"></div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Project icon and title */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {invitation.projectName}
                            </h3>
                            <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                              {invitation.role}
                            </span>
                          </div>
                          
                          {invitation.projectDescription && (
                            <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">{invitation.projectDescription}</p>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {invitation.invitedBy && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {invitation.invitedBy.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{invitation.invitedBy.name}</p>
                              <p className="text-xs text-gray-500">{invitation.invitedBy.email}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">
                            {new Date(invitation.invitedAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                      <button
                        onClick={() => handleAccept(invitation._id)}
                        disabled={processing === invitation._id}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed group"
                      >
                        {processing === invitation._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Accept</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDecline(invitation._id)}
                        disabled={processing === invitation._id}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed group"
                      >
                        {processing === invitation._id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Decline</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

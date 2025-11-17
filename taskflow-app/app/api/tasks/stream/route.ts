/**
 * SSE (Server-Sent Events) Route for Real-Time Task Updates
 * 
 * What is SSE?
 * SSE adalah teknologi yang memungkinkan server untuk mengirim update secara real-time
 * ke client (browser). Seperti WhatsApp yang otomatis menampilkan pesan baru tanpa refresh.
 * 
 * Flow Kerja SSE:
 * 1. Client (browser) membuka koneksi ke endpoint ini
 * 2. Server menjaga koneksi tetap hidup (keep-alive)
 * 3. Setiap ada update task, server langsung push ke semua client yang terhubung
 * 4. Client menerima update dan otomatis refresh tampilan
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/helpers/auth";
import TaskNotifier from "@/server/TaskNotifier";

// Force dynamic rendering - pastikan endpoint ini selalu fresh dan tidak di-cache
export const dynamic = 'force-dynamic';

/**
 * GET Handler - Endpoint utama untuk SSE connection
 * 
 * Endpoint: /api/tasks/stream
 * Method: GET
 * Auth: Required (JWT token)
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Verifikasi user - pastikan user sudah login
    const currentUser = getCurrentUser(request);
    
    // Step 2: Setup encoder untuk convert data ke format yang bisa dikirim via stream
    const encoder = new TextEncoder();
    
    // Step 3: Buat ReadableStream - ini adalah "pipa" untuk kirim data ke client
    const stream = new ReadableStream({
      start(controller) {
        // Step 3a: Buat ID unik untuk koneksi ini (user + timestamp)
        const connectionId = `${currentUser.id}-${Date.now()}`;
        
        /**
         * Helper function untuk kirim event ke client
         * Format SSE: "data: {json}\n\n"
         */
        const sendEvent = (data: any) => {
          const eventData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        // Step 3b: Kirim pesan "connected" ke client sebagai konfirmasi koneksi berhasil
        sendEvent({
          type: 'connected',
          message: 'Connected to task updates stream',
          timestamp: new Date().toISOString()
        });

        // Step 3c: Daftarkan koneksi ini ke TaskNotifier (manager untuk semua SSE connections)
        const notifier = TaskNotifier.getInstance();
        notifier.addConnection(connectionId, sendEvent);

        /**
         * Step 3d: Setup heartbeat (ping setiap 30 detik)
         * 
         * Kenapa perlu heartbeat?
         * - Jaga koneksi tetap hidup
         * - Deteksi kalau koneksi terputus
         * - Prevent timeout dari proxy/load balancer
         */
        const heartbeat = setInterval(() => {
          try {
            sendEvent({ 
              type: 'ping', 
              timestamp: new Date().toISOString() 
            });
          } catch (error) {
            // Kalau kirim ping gagal, berarti koneksi sudah mati
            clearInterval(heartbeat);
            notifier.removeConnection(connectionId);
          }
        }, 30000); // 30 detik

        /**
         * Step 3e: Cleanup ketika client disconnect
         * 
         * Event ini trigger ketika:
         * - User close tab/browser
         * - User navigate ke halaman lain
         * - Koneksi timeout/error
         */
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          notifier.removeConnection(connectionId);
          controller.close();
        });
      }
    });

    // Step 4: Return response dengan headers khusus untuk SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',        // Format SSE
        'Cache-Control': 'no-cache, no-transform',  // Jangan di-cache
        'Connection': 'keep-alive',                 // Jaga koneksi tetap hidup
        'X-Accel-Buffering': 'no',                 // Disable buffering (untuk Nginx)
      },
    });
    
  } catch (error: any) {
    // Error handling: Unauthorized (user belum login atau token invalid)
    if (error.message === "Not authenticated" || error.message === "Invalid token") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Error handling: General error
    return new Response(
      JSON.stringify({ error: 'Failed to establish SSE connection' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

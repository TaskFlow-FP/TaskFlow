import { NextRequest } from "next/server";
import { getCurrentUser } from "@/helpers/auth";
import TaskNotifier from "@/server/TaskNotifier";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const connectionId = `${currentUser.id}-${Date.now()}`;
        
        const sendEvent = (data: any) => {
          const eventData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        sendEvent({
          type: 'connected',
          message: 'Connected to task updates stream',
          timestamp: new Date().toISOString()
        });

        const notifier = TaskNotifier.getInstance();
        notifier.addConnection(connectionId, sendEvent);

        const heartbeat = setInterval(() => {
          try {
            sendEvent({ type: 'ping', timestamp: new Date().toISOString() });
          } catch (error) {
            clearInterval(heartbeat);
            notifier.removeConnection(connectionId);
          }
        }, 30000);

        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          notifier.removeConnection(connectionId);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    if (error.message === "Not authenticated" || error.message === "Invalid token") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to establish SSE connection' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

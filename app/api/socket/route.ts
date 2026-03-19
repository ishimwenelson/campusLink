/**
 * Socket.io API route fallback for Vercel.
 * Note: Full WebSocket support requires a custom server (server.js).
 * This route is kept as a placeholder for health checks.
 * For production, deploy on Railway or Render to use server.js.
 */
export async function GET() {
  return new Response(JSON.stringify({
    status: "Socket.io server running",
    note: "WebSocket connections handled by server.js",
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

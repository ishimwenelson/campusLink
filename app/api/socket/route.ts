
export async function GET() {
  return new Response(JSON.stringify({
    status: "Socket.io server running",
    note: "WebSocket connections handled by server.js",
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

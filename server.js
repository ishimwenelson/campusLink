/**
 * CampusLink Investment - Custom Next.js Server with Socket.io
 * Run: node server.js
 * Production: Deploy to Railway or Render for full WebSocket support.
 * Vercel does not support persistent WebSocket connections.
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const compression = require("compression");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const compress = compression();
  const httpServer = createServer(async (req, res) => {
    try {
      // Apply compression
      compress(req, res, () => {});
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Store io instance globally for use in API routes
  global.io = io;

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Join user-specific room for targeted notifications
    socket.on("join", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join role-specific rooms
    socket.on("joinRole", (role) => {
      socket.join(`role:${role}`);
      console.log(`Socket joined role room: ${role}`);
    });

    // Real-time vote updates on proposals
    socket.on("voteUpdate", (data) => {
      io.emit("proposalVoteUpdated", data);
    });

    // Real-time chat messages
    socket.on("meetingMessage", ({ meetingId, message }) => {
      socket.to(`meeting:${meetingId}`).emit("messageReceived", message);
    });

    // Real-time reactions
    socket.on("meetingReaction", ({ meetingId, emoji }) => {
      socket.to(`meeting:${meetingId}`).emit("reactionReceived", emoji);
    });

    // Real-time meeting notes
    socket.on("meetingNoteUpdate", ({ meetingId, notes }) => {
      socket.to(`meeting:${meetingId}`).emit("meetingNotesChanged", notes);
    });

    socket.on("joinMeeting", (meetingId, userId) => {
      socket.join(`meeting:${meetingId}`);
      socket.meetingId = meetingId; // Store for disconnect cleanup
      console.log(`🔌 Socket ${socket.id} (User: ${userId}) joined meeting ${meetingId}`);
      // Notify others in the room that a new peer has joined
      socket.to(`meeting:${meetingId}`).emit("peerJoined", { socketId: socket.id, userId });
    });

    // WebRTC Signaling
    socket.on("offer", ({ to, offer, fromUserId }) => {
      socket.to(to).emit("offer", { from: socket.id, offer, fromUserId });
    });

    socket.on("answer", ({ to, answer, fromUserId }) => {
      socket.to(to).emit("answer", { from: socket.id, answer, fromUserId });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
      if (socket.meetingId) {
        socket.to(`meeting:${socket.meetingId}`).emit("peerLeft", socket.id);
      }
      io.emit("peerLeft", socket.id); // Global fallback
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`\n🚀 CampusLink Investment running at http://${hostname}:${port}`);
      console.log(`   ✅ Socket.io enabled`);
      console.log(`   🌍 Environment: ${dev ? "development" : "production"}\n`);
    });
});

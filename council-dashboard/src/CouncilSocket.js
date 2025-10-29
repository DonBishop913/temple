// src/CouncilSocket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_COUNCIL_SOCKET_URL || "http://localhost:3000";
const councilSocket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  transports: ["websocket"],
});

councilSocket.on("connect", () => {
  console.log(
    `Connected to CouncilSocket at ${SOCKET_URL} with id ${councilSocket.id}`,
  );
});

councilSocket.on("disconnect", (reason) => {
  console.warn(`CouncilSocket disconnected: ${reason}`);
});

councilSocket.on("connect_error", (err) => {
  console.error("CouncilSocket connection error:", err);
});

export default councilSocket;

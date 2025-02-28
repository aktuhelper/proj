import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000"; // Change this if your backend is running on a different URL

export const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Ensures stable connection
  withCredentials: true,
});

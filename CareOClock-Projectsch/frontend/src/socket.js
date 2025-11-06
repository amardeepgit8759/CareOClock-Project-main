// src/socket.js

import { io } from "socket.io-client";

// Connect to backend server socket (adjust port if needed)
const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

export default socket;

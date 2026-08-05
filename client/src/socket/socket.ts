import { io } from "socket.io-client";


const socket = io(import.meta.env.VITE_SERVER_URL);

socket.on("connect", () =>{
    console.log("Connected!");
    console.log("Socket ID:", socket.id);
});

socket.on("welcome", (message) => {
    console.log("Server says:", message);
});



export default socket;
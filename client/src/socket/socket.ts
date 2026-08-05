import { io } from "socket.io-client";


const socket = io("http://localhost:3000");

socket.on("connect", () =>{
    console.log("Connected!");
    console.log("Socket ID:", socket.id);
});

socket.on("welcome", (message) => {
    console.log("Server says:", message);
});



export default socket;
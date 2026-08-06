import { useState } from "react";
import { useNavigate } from "react-router-dom";





function Home() {

    const navigate = useNavigate();

    const [username, setUsername] = useState(
        localStorage.getItem("username") || ""
    );

    const [roomId, setRoomId] = useState("");

    const joinRoom = () => {

      if (!roomId.trim()) return;

      localStorage.setItem("username", username);

      navigate(`/room/${roomId}`);

    };

    return (

        <div className="home">

          <h1>Cordisk.exe</h1>



          <p>Username</p>

          <input
              value = {username}
              onChange={(e) => setUsername(e.target.value)}
          />



          <p>Room ID</p>
          
          <input
              value = {roomId}
              onChange={(e) => setRoomId(e.target.value)}
          />

          <button onClick={joinRoom}>
              Join Room
          </button>

          

        </div>
    );

}

export default Home;
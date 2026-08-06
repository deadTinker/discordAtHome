import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Home.css";





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

          <div className="window">

            <div className="title-bar">
              
              <span>Cordisk.exe</span>

              <div className="window-buttons">

              <span>_</span>
              <span>□</span>
              <span>✕</span>
              
              </div>
          </div>

          <div className="content">

            <br></br>
            <br></br>
            <br></br>
            <br></br>

          <div className="field">

          <label>Username</label>

          <input
              value = {username}
              onChange={(e) => setUsername(e.target.value)}
          />

          </div>


          <div className="field">
          <label>Room ID</label>
          
          <input
              value = {roomId}
              onChange={(e) => setRoomId(e.target.value)}
          />

          </div>

          <button onClick={joinRoom}>
              Join Room
          </button>

            </div>
          </div>
        </div>
    );

}

export default Home;
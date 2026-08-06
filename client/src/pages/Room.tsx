import { useParams } from "react-router-dom";

import { useEffect, useState } from "react";

import socket from "../socket/socket";

import useWebRTC from "../hooks/useWebRTC";

import "./Room.css";

import { useNavigate } from "react-router-dom";

import { playSound } from "../utils/playSound";


// Interfaces

interface Participant {
    socketId: string;
    username: string;
    mic: boolean;
    camera: boolean;
    screenShare: boolean;
}

interface RoomStateEvent {
    participants: Participant[];
}

interface UserJoinedEvent {
    participant: Participant;
}

interface UserLeftEvent {
    socketId: string;
}

interface MicChangedEvent {
    socketId: string;
    mic: boolean;
}


// Room function


function Room(){

// Registering Components/Functions
    
   const { roomId }= useParams();

    const [participants, setParticipants] = useState<Participant[]>([]);

    const navigate = useNavigate();

    const leaveRoom = () => {

        cleanup();

        socket.disconnect();

        navigate("/");

      };

    const { 

        initialiseWebRTC,

        createOffer,

        registerOfferListener,

        registerAnswerListener,

        registeIceCandidateListener,

        remoteAudio,

        toggleMic,

        cleanup,

      } = useWebRTC();

   

   




    useEffect(() => {

// Initialising Web RTC   
      const setup = async () => {

          socket.connect();

          await initialiseWebRTC(roomId!);

          registerOfferListener(roomId!);
          registerAnswerListener();
          registeIceCandidateListener();

          socket.emit("join-room", {
            roomId,
            username: localStorage.getItem("username"),
          });
      };


      setup();

// Handlers Creation

      const handleRoomState = (data: RoomStateEvent) => {

        console.log("Room State:", data);

        setParticipants(data.participants);

      };

      const handleUserJoined = async (data: UserJoinedEvent) => {

        console.log("User joined:", data);
        
        setParticipants(previous => [
          ...previous,
          data.participant
      ]);
        
        if (data.participant.socketId !== socket.id){
      // Existing user creates the offer
          await createOffer(
            
          data.participant.socketId
          );
        }
      };

      const handleUserLeft = (data: UserLeftEvent) => {
        console.log("User Left:", data);
        
          setParticipants(previous =>
              previous.filter(
                  user => user.socketId !== data.socketId
              )
          );    
      };


      const handleMicChanged = (data: MicChangedEvent) => {

        console.log("Mic Changed:", data);

        setParticipants(previous => 
          previous.map(user => {

            if (user.socketId === data.socketId){
              return {
                ...user,
                mic: data.mic
              };
            }

            return user;

          })
        );
      };


      


// Registering Handlers
      socket.on("room-state", handleRoomState);
      socket.on("user-joined", handleUserJoined);
      socket.on("user-left", handleUserLeft);
      socket.on("mic-changed", handleMicChanged);

      



// Cleanup 
      return() => {
        socket.off("room-state", handleRoomState);
        socket.off("user-joined", handleUserJoined);
        socket.off("user-left", handleUserLeft);
        socket.off("mic-changed", handleMicChanged);
        socket.off("offer");
        socket.off("answer");
        socket.off("ice-candidate");

        
      };


    }, [roomId]);



    return (

      <div className="Room">
        <div className="window">

          <div className="title-bar">
            <span> Cordisk.exe - Room: {roomId} </span>

            <span></span>

            <div className="window-buttons">
              <span>_</span>
              <span>□</span>
              <span>✕</span>
            </div>
          </div>

          

          <div className="room-info">


            <span> 👥 {participants.length} Participant{participants.length !==1 ? "s" : ""}
            </span>

            
          </div>



          <div className="content">



          
           <div className="participants">
            {participants.map((user) => (


              

              <div
                  className="participant-card"
                  key = {user.socketId}
                  >

                <div className="avatar">
                  ?
                  </div>

                <div className="username"> 

                  {user.username}

                </div>

                <div className="status">

                <div>🎤 {user.mic ? "On" : "Off"}</div>

                

                <div>📷 {user.camera ? "On" : "Off"}</div>

                

                <div>🖥️ {user.screenShare ? "On" : "Off"}</div>


                </div>
                </div>
                
              ))}
              </div>

    


        
              <div className="toolbar">

                <button onClick={() => {
                    playSound("plop.mp3");
                    toggleMic();
                }}
                  >
                  {participants.find(user => user.socketId === socket.id)?.mic
                    ? "🔊"
                    : "🔈"}
                </button>

                <button disabled>
                  📷
                </button>

                <button disabled>
                  🖥️
                </button>

                <button onClick={() => {
                    playSound("plop.mp3");
                    leaveRoom();
                }}
                >
                  📞
                </button>

              </div>
        


      <audio
          ref={(remoteAudio)}
          autoPlay
      />

          </div>

          

          
      
        </div>
      </div>
    );
}

export default Room;
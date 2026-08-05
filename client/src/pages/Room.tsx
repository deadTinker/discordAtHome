import { useParams } from "react-router-dom";

import { useEffect, useState } from "react";

import socket from "../socket/socket";

import useWebRTC from "../hooks/useWebRTC";


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

    const { 

        initialiseWebRTC,

        createOffer,

        registerOfferListener,

        registerAnswerListener,

        registeIceCandidateListener,

        remoteAudio,

      } = useWebRTC();

   

   




    useEffect(() => {

// Initialising Web RTC   
      const setup = async () => {

          await initialiseWebRTC(roomId!);
          registerOfferListener(roomId!);
          registerAnswerListener();
          registeIceCandidateListener();

          socket.emit("join-room", roomId);
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

      // Existing user creates the offer
          await createOffer(roomId!);
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
      };


    }, [roomId]);



    return (
      <>
      <h1> Room Page </h1>
      <h2> Room ID: {roomId} </h2>

      <ul>
        {participants.map((user) => (
          <li key={user.socketId}>

            <strong>{user.username}</strong>

            <br />

            🎤 {user.mic ? "On" : "Off"}

            <br />

            📷 {user.camera ? "On" : "Off"}

            <br />

            🖥️ {user.screenShare ? "On" : "Off"}

            <br /><br />

            </li>
          ))}

      </ul>



      {/* <h2> Participants: {participants.length} </h2> */}


      <button onClick={() => socket.emit("toggle-mic")}>
        {participants.find(user => user.socketId === socket.id)?.mic
        ? "Mute"
        : "Unmute"}
      </button>

      <br></br>

      < button onClick={() => createOffer(roomId!)}>
          Create Offer
      </button>


      <audio
          ref={(remoteAudio)}
          autoPlay
      />



      </>
    );
}

export default Room;
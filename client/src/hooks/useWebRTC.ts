import { useRef } from "react";

import socket from "../socket/socket";


function useWebRTC() {

    const currentRoomId = useRef<string>("");

    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const localStream = useRef<MediaStream | null>(null);

    const remoteAudio = useRef<HTMLAudioElement | null>(null);

    const initialised = useRef(false);
    



    const createPeerConnection = () => {


      if (peerConnection.current) {
          return;
      }
        
        peerConnection.current = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });
        
        console.log("Peer Connection has been created");


        peerConnection.current.onicecandidate = (event) => {

            if (event.candidate) {
                
                console.log("Sending ICE candidate");

                socket.emit("ice-candidate", {
                    roomId: currentRoomId.current,
                    candidate: event.candidate,
                });
            }
        };


        peerConnection.current.ontrack = (event) => {

            console.log("Remote track recieved");

            if (remoteAudio.current){

                remoteAudio.current.srcObject = event.streams[0];
                remoteAudio.current.volume = 1;

                console.log(event.streams[0]);
                console.log(event.streams[0].getAudioTracks());
            }
        };

      
      };




      
    const getLocalAudio = async () => {

        try {

            localStream.current = await navigator.mediaDevices.getUserMedia({
                
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,

                },
                
            });

            console.log("Microphone connected");


            const track = localStream.current.getAudioTracks() [0];
            console.log(track.getSettings());

        } catch (error) {

            console.error("Couldn't access microphone:", error);
        }
    };


    const addLocalTracks = () => {

      if (!peerConnection.current) return;
      if (!localStream.current) return;

      localStream.current.getTracks().forEach(track => {

          peerConnection.current?.addTrack(
              track,
              localStream.current!
          );
      });

      console.log("Local tracks has been added");

    };


    const createOffer = async (roomId: string) => {

        if (!peerConnection.current) return;

        const offer = await peerConnection.current.createOffer();

        await peerConnection.current.setLocalDescription(offer);

        console.log("Offer created");

        socket.emit("offer", {
            roomId,
            offer,
        });

    };


    const createAnswer = async (
        roomId: string,
        offer: RTCSessionDescriptionInit
    ) => {

        if (!peerConnection) return;

        // Accept Browser A's Offer
        await peerConnection.current?.setRemoteDescription(offer);

        console.log("Remote offer accepted");

        // Create our answer
        const answer = await peerConnection.current?.createAnswer();

        // Save itlocally
        await peerConnection.current?.setLocalDescription(answer);

        console.log("Answer created");

        // Send it back
        socket.emit("answer", {
            roomId,
            answer,
        });

    };
    

    
    const registerOfferListener = (
            roomId: string,
        ) => {

        socket.on("offer", async ({ offer }) => {

            console.log("Offer received");

            await createAnswer(roomId, offer);

        });
    };

    const registerAnswerListener = () => {

        socket.on("answer", async ({ answer }) => {

            console.log("Answer recieved");

            if (!peerConnection) return;

            await peerConnection.current?.setRemoteDescription(answer);

            console.log("Peer connection established !!");

        });

    };

    const registeIceCandidateListener = () => {

        socket.on("ice-candidate", async ({ candidate }) => {

            if (!peerConnection.current) return;

            console.log("Received ICE Candidate");

            await peerConnection.current.addIceCandidate(candidate);
        });
    };
   

    
    
    const initialiseWebRTC = async (roomId: string) => {

        currentRoomId.current = roomId;

    if (initialised.current) return;

       initialised.current = true;

       createPeerConnection();
       
       await getLocalAudio();

       addLocalTracks();

    };



    return {
        initialiseWebRTC,
        createOffer,
        registerOfferListener,
        registerAnswerListener,
        registeIceCandidateListener,
        peerConnection,
        localStream,
        remoteAudio,
        
    };
}


export default useWebRTC;
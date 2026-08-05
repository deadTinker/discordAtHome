import { useRef } from "react";

import socket from "../socket/socket";


function useWebRTC() {

    const currentRoomId = useRef<string>("");

    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const localStream = useRef<MediaStream | null>(null);

    const remoteAudio = useRef<HTMLAudioElement | null>(null);

    const initialised = useRef(false);
    
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);



    const createPeerConnection = () => {


      if (peerConnection.current) {
          return;
      }
        
        peerConnection.current = new RTCPeerConnection({
            iceServers: [
                // { urls: "stun:stun.l.google.com:19302 "},
                // { urls: "stun:stun1.l.google.com:19302" },
                // { urls: "stun:stun2.l.google.com:19302" },
                {   urls: "stun:stun.relay.metered.ca:80",
                },
                {
                    urls: "turn:global.relay.metered.ca:80",
                    username: "ecc177c4ae968f7c9f665b04",
                    credential: "Ab522JkPxZ+vuRC6",
                },
                {
                    urls: "turn:global.relay.metered.ca:80?transport=tcp",
                    username: "ecc177c4ae968f7c9f665b04",
                    credential: "Ab522JkPxZ+vuRC6",
                },
                {
                    urls: "turn:global.relay.metered.ca:443",
                    username: "ecc177c4ae968f7c9f665b04",
                    credential: "Ab522JkPxZ+vuRC6",
                },
                {
                    urls: "turns:global.relay.metered.ca:443?transport=tcp",
                    username: "ecc177c4ae968f7c9f665b04",
                    credential: "Ab522JkPxZ+vuRC6",
                },
            ],
        });
        
        console.log("Peer Connection has been created");


        peerConnection.current.onicecandidate = (event) => {

            if (event.candidate) {
            console.log(
                "ICE Candidate:",
                event.candidate.candidate
            );

            socket.emit("ice-candidate", {
                roomId: currentRoomId.current,
                candidate: event.candidate,
            });
    }
        };

        peerConnection.current.oniceconnectionstatechange = () => {
            console.log(
                "ICE State:",
                peerConnection.current?.iceConnectionState
            );
        };

peerConnection.current.onconnectionstatechange = () => {
    console.log(
        "Connection State:",
        peerConnection.current?.connectionState
    );
};


        peerConnection.current.ontrack = (event) => {

            console.log("Remote track recieved");

            if (remoteAudio.current){

                remoteAudio.current.srcObject = event.streams[0];
                remoteAudio.current.volume = 1;

                remoteAudio.current.play()
                .then(() => console.log("Audio playing"))
                .catch(err => console.error("Play failed:", err));

                console.log(event.streams[0]);
                const track = event.streams[0].getAudioTracks()[0];

                console.log(track);
                console.log(track.enabled);
                console.log(track.muted);
                console.log(track.readyState);
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


    const createOffer = async (
        targetSocketId: string
        ) => {

        if (!peerConnection.current) return;

        const offer = await peerConnection.current.createOffer();
        console.log(offer.sdp);

        await peerConnection.current.setLocalDescription(offer);

        console.log("Offer created");

        socket.emit("offer", {
            targetSocketId,
            offer,
        });

    };


    const createAnswer = async (
        roomId: string,
        offer: RTCSessionDescriptionInit
    ) => {

        

        if (!peerConnection.current) return;

        // Accept Browser A's Offer
        await peerConnection.current?.setRemoteDescription(offer);

        console.log("Remote offer accepted");

        while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();

            if (candidate) {
                await peerConnection.current?.addIceCandidate(candidate);
                console.log("Added queued ICE candidate");
            }
        }

        // Create our answer
        const answer = await peerConnection.current?.createAnswer();

        console.log(answer?.sdp);

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

            if (!peerConnection.current) return;

            await peerConnection.current?.setRemoteDescription(answer);

            console.log("Peer connection established !!");

            
            while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();

            if (candidate) {
                await peerConnection.current?.addIceCandidate(candidate);
                console.log("Added queued ICE candidate");
            }
        }

        });

    };

    const registeIceCandidateListener = () => {

        socket.on("ice-candidate", async ({ candidate }) => {

            if (!peerConnection.current) return;

            if (!peerConnection.current.remoteDescription) {
                console.log("Queueing ICE candidate");

                pendingCandidates.current.push(candidate);
                return;
            }

            console.log("Adding ICE candidate");

            await peerConnection.current?.addIceCandidate(candidate);

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
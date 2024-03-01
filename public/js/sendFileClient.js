console.log("hello",localStorage.getItem('userId'))

let userOneReady = false
let userTwoReady = false



let otherUserPresent=false
let connectEstablished = true
const iceCandidates = [];
let iceButton = document.getElementById('iceButton')
iceButton.addEventListener('click' ,(event)=>{
event.preventDefault()
console.log("getting ice")
console.log(iceCandidates)
})
const ws = new WebSocket("ws://localhost:3000");
secondUserId = localStorage.getItem('senderId')
let localPeerConnection
const userId = localStorage.getItem('userId')
ws.onopen = function(){
    console.log("REGISTERING")
    sendMessage({
        type:'register',
        userId:userId
    })
}
ws.onmessage =  function(event){
    const eventData = JSON.parse(event.data)
    const type = eventData.type

    if (type === "offer"){
        const dataOffer = eventData.data
        console.log(dataOffer)
        localPeerConnection.setRemoteDescription(new RTCSessionDescription(dataOffer))

        console.log("Got User Offer data",dataOffer)
        
    }else if(type === "candidate"){
        const ICEdata = eventData.data
        console.log("Got ICE Candidate" ,ICEdata)
        localPeerConnection.addIceCandidate(new RTCIceCandidate(ICEdata))
        console.log("ICE gathering state:", localPeerConnection.iceConnectionState ,ICEdata);
    }else if(type === "confirmation"){
        console.log("CONFIRMATION")
        if(eventData.result === "YES"){
            console.log("CONFIRMATION YESS")
            clearTimeout(checkUserTime)
            // userOneReady=true
            if(connectEstablished){
                startConnection()
                connectEstablished=false
            }
            console.log("ICE gathering state:", localPeerConnection.iceConnectionState );

        }
    }else if(type==="confirmation_"){
        clearTimeout(checkUserTime)
        if(connectEstablished){
            startConnection()
            connectEstablished=false
        }
        console.log("ICE gathering state:", localPeerConnection.iceConnectionState );

        
    }else if(type==="answer"){
        const answer=eventData.data
        console.log("Got answers  " ,answer)
        localPeerConnection.setRemoteDescription(answer)
        // if (localPeerConnection.signalingState === 'have-remote-offer') {
        //         .then(() => {
        //             console.log('Remote description set successfully.');
        //             // ICE negotiation and connection establishment may continue from here
        //         })
        //         .catch(error => {
        //             console.error('Error setting remote description:', error);
        //         });
        // } else {
        //     console.error('Cannot set remote description: Signaling state is not appropriate.');
        // }
    }
    // else if(type === "available"){
    //     console.log("YYYYEEEEEEEESSSSSS",eventData)
    //     if(eventData.result === "YES"){
    //         clearTimeout(checkUserTime)
    //         otherUserPresent=true
    //         if(connectEstablished){
    //             startConnection()
    //             connectEstablished=false
    //         }
            
    //     }
    // }else if(type === "user_available"){
    //     sendMessage({
    //         type:"available",
    //         result:"YES",
    //         recipient:secondUserId
    //     })
    //     if(connectEstablished){
    //         startConnection() 
    //         connectEstablished=false
    //     }  
    // }
}
function sendCheckuser(){
    sendMessage({
        type:"user_available",
        recipient:secondUserId,
        fromId:userId
    })
}
const checkUserTime = setTimeout(sendCheckuser ,2000)

function sendMessage(message){
    ws.send(JSON.stringify(message))
}
const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
};
localPeerConnection = new RTCPeerConnection(configuration)
localPeerConnection.onicecandidate = event =>{
    if(event.candidate){
        iceCandidates.push(event.candidate);
        console.log(event.candidate ,"is candidate")
        sendIceCandidate(event.candidate)
    }
}
intiateDataChannel()




function intiateDataChannel(){
    try {
        const dataChannel = localPeerConnection.createDataChannel('fileTransfer');

        dataChannel.onopen = function (event) {
            console.log("Channel Opened");
            dataChannel.send("hello there mate");

        }
        dataChannel.onmessage = function (event) {
            console.log("message:", event.data);
        }
        dataChannel.onclose = function(event) {
            console.log("Channel Closed");
            // Add any cleanup or error handling code here
        };
    } catch (error) {
        console.error("Error initializing data channel:", error);
    }
}

function sendFile(){
    const message = 'hello';
    dataChannel.send(message);
}
function startConnection(){
    createAndSetLocalDescription()
}
function createAndSetLocalDescription() {
    localPeerConnection.createOffer()
        .then(offer => localPeerConnection.setLocalDescription(offer))
        .then(() => sendSdpOffer(localPeerConnection.localDescription))
        .catch(error => console.log("Error in offer sending", error));
}
function sendIceCandidate(iceCandidate){
    console.log("sending Ice candidate" ,iceCandidate)
    sendMessage({
        type:'candidate',
        candidate:iceCandidate,
        recipient:secondUserId
    })
}
function sendSdpOffer(offer){
    console.log("sending offfers")
    sendMessage({
        type:'offer',
        data:offer,
        recipient:secondUserId
    })
}


// const subButton = document.getElementById('sub')
// subButton.addEventListener('click' ,(event)=>{
//     event.preventDefault()
//     sendMessage({
//         type:'message',
//         text:"hello from client"
//     })
// })





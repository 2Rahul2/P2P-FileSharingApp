const ConnectionStatus = localStorage.getItem("status")
const myuserId = localStorage.getItem("userId")
const seconduserId = localStorage.getItem("senderId")
if(seconduserId===null || myuserId ===null){
    window.location.href = '/home'
}

let once=true
let sentIndex = 0
let receivedIndex = 0
let offerSent = true
let checkUserTime

let sendButton = document.getElementById("sendButton")
let selectFiles = document.getElementById("selectFiles")
let errorMenu = document.getElementById("requestMenu")
let errorHeading = document.getElementById("errorHeading")
let quitPage = document.getElementById("quitPage")
let fileListS = document.getElementById("Files-ListS")
let fileListR = document.getElementById("Files-ListR")
const ws = new WebSocket("ws://localhost:3000");
quitPage.addEventListener("click" ,(e)=>{
    e.preventDefault()
    window.location.href = '/home'
})
function removeLocalStorageData(){
    localStorage.removeItem("senderId")
    localStorage.removeItem("senderName")
}
if (ConnectionStatus === "sender"){
    let recHead = document.getElementById("recHead")
    recHead.remove()
    window.addEventListener("beforeunload" ,function(event){
        sendMessage({
            type:"close",
            toId:seconduserId
        })
        removeLocalStorageData()
    })
    let progress_bar;
    document.getElementById("RF").remove()
    const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
    }
    const lc = new RTCPeerConnection(configuration)
    const dc = lc.createDataChannel("channel" ,{ordered:true})
    dc.onmessage = e=>console.log('msg '+e.data);
    dc.onopen = e=> console.log("connection opened");
    dc.onerror = e => {
        sendMessage({
            type:"close",
            toId:seconduserId
        })
        removeLocalStorageData()
        errorMenu.style.display = "flex"
        errorHeading.innerText = "Connection Timed out"
        errorMenu.style.display = "flex"
    }
    ws.onopen = function(){
        console.log("Web socket open")
        sendMessage({
            type:'register',
            userId:myuserId
        })
    }
    ws.onerror = function(){
        sendMessage({
            type:"close",
            toId:seconduserId
        })
        removeLocalStorageData()
        errorMenu.style.display = "flex"

        errorHeading.innerText = "Connection Timed out"
        errorMenu.style.display = "flex"
    }
    ws.onclose = function(){
        sendMessage({
            type:"close",
            toId:seconduserId
        })
        removeLocalStorageData()
        errorMenu.style.display = "flex"

        errorHeading.innerText = "Connection Timed out"
        errorMenu.style.display = "flex"
    }
    ws.onmessage = async function(event){
        const eventData = JSON.parse(event.data)
        console.log(eventData)
        const type = eventData.type
        if(type === "availableResponse"){
            console.log("Other User Available")
            // create the offers if result is yes
            if(eventData.result ==="YES"){
                // stop the timeout
                clearTimeout(checkForUser)
                // offer creation
                await lc.createOffer().then(o=>{
                    lc.setLocalDescription(o)
                }).then(a=>{
                    console.log("offer was created")
                })
    
            }
        }else if(type ==="answer"){
            const answer = eventData.data
            console.log("got answer :" ,answer)
            if(once){
                await lc.setRemoteDescription(answer).then(() => {
                    console.log("Remote description set successfully.");
                    // Check the state of the data channel
                    if (lc.dataChannel && lc.dataChannel.readyState === "open") {
                      console.log("Data channel is open.");
                    } else {
                      console.log("Data channel is not open or not yet created.");
                    }
                  })
                  .catch(error => {
                    console.error("Error setting remote description:", error);
                    // Handle the error appropriately
                  });
                once=false
            }     
        }else if(type==="ice"){
            const candidate = eventData.data
            console.log("Got ice data : " ,candidate)
            lc.addIceCandidate(candidate)
            .then(() => {
                console.log("ICE candidate added successfully");
            })
            .catch(error => {
                console.error("Error adding ICE candidate:", error);
            });
        }else if(type==="close"){
            console.log("Other user Left")
            removeLocalStorageData()
            errorMenu.style.display = "flex"

            errorHeading.innerText = "User left the room"
            errorMenu.style.display = "flex"
            // window.location.href = '/home'
        }
    }
    checkForUser = setTimeout(checkForUser ,2000)
    
    lc.onicecandidate = e =>{
        // get the offer
        // send the offer to the other user
        const icedata = null
        if(icedata){
            console.log("sending ice data : " ,icedata)
            sendMessage({
                type:'ice',
                data:icedata,
                toId:seconduserId
            })

        }
        if(offerSent){
            const offer = lc.localDescription
            console.log("sending offer : " ,offer)
            sendMessage({
                type:"offer",
                data:offer,
                toId:seconduserId
            })
            offerSent=false
        }
    }
    console.log("sender")
    // document.getElementById('check').addEventListener('click',(e)=>{
    //     e.preventDefault()
    //     dc.send("hello from first user")

    // })
    // setP2PClient.js:285  WebSocket is already in CLOSING or CLOSED state.
    document.getElementById('sendButton').addEventListener('click' ,(e)=>{
        e.preventDefault()
        const fileInput = document.getElementById('fileInput');
        const files = fileInput.files;
        if(files.length===0){
            console.log("No files selected")
        }else{
            for(let i =0;i<files.length;i++){
                const fileName = files[i].name
                const singileFileObject = `
                <li class="listContainer">
                    <p class="file-heading">${fileName}</p>
                    <div class="progressBar">
                        <div id="proS${sentIndex}" class="progress"></div>
                    </div>
                    <a>sample</a>
                </li>
                `
                fileListS.innerHTML += singileFileObject
                progress_bar = document.getElementById(`proS${sentIndex}`)

                console.log(fileName)
                // dc.send(JSON.stringify({type:"fileName",fileName:fileName }));
                const reader = new FileReader();
                reader.onload = function(event) {
                    const data = event.target.result;
                    sendFileData(data ,fileName ,sentIndex);
                };
                reader.readAsArrayBuffer(files[i]);
                // sentIndex += 1
            }
        }
        // fileInput.files.forEach(file => {
        //     console.log(file.name)
        // });
        // alert(file.name)
    })

    function sendFileData(data ,fileName ,index){
        const CHUNK_SIZE = 16384
        let offset = 0;
        const totalLength = data.byteLength
        let totalChunks = Math.ceil(data.byteLength / CHUNK_SIZE);
        // let progress_bar = document.getElementById(`proS${index}`)
        dc.send(JSON.stringify({type:"metaData",totalChunks:totalChunks,fileName:fileName }));
        let sendTimeout; // Declare a variable to hold the timeout ID

        function sendNextChunk() {
            if (offset < data.byteLength) {
                const chunk = data.slice(offset, offset + CHUNK_SIZE);
                if (dc.bufferedAmount < CHUNK_SIZE * 2) {
                    console.log("sending data")
                    dc.send(chunk);
                    offset += CHUNK_SIZE;
                    if(progress_bar){
                        console.log(progress_bar)
                        progress_bar.style.width = `${(offset / totalLength) * 100}%`;
                    }else{
                        console.log(progress_bar ,"is null " ,`proS${index}`)
                        progress_bar = document.getElementById(`proS${index}`)

                    }
                    sendTimeout = setTimeout(sendNextChunk, 3);
                } else {
                    sendTimeout = setTimeout(sendNextChunk, 3);
                }
            } else {
                sentIndex += 1
                // All chunks sent, clear the timeout
                clearTimeout(sendTimeout);
            }
        }
        sendNextChunk();
        // while (offset < data.byteLength) {
        //     const chunk = data.slice(offset, offset + CHUNK_SIZE);
        //     dc.send(chunk);
        //     offset += CHUNK_SIZE;
        //     progress_bar.style.width = `${(offset/totalLength)*100}%`
        // }
    }
}else if(ConnectionStatus === "getter"){
    selectFiles.remove()
    sendButton.remove()
    document.getElementById("SF").remove()
    // document.getElementById("sendButton").style.display = "none"
    console.log("getter")
    const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
    }
    const rc = new RTCPeerConnection(configuration)
    ws.onopen = function(){
        console.log("Web socket open")
        sendMessage({
            type:'register',
            userId:myuserId
        })
    }
    ws.onclose = function(){
        removeLocalStorageData()
        errorMenu.style.display = "flex"

        errorHeading.innerText = "Connection Timed out"
        errorMenu.style.display = "flex"
        sendMessage({
            type:"close",
            toId:seconduserId
        })
    }
    window.addEventListener("beforeunload" ,function(event){
        sendMessage({
            type:"close",
            toId:seconduserId
        })
        removeLocalStorageData()
    })
    ws.onmessage =async function(event){
        const eventData = JSON.parse(event.data)
        const type = eventData.type
        if(type === "available"){
            sendMessage({
                type:"availableResponse",
                toId:seconduserId,
                result:"YES"
            })
        }else if(type ==="offer"){
            console.log("Got offer : " ,eventData.data)
            // set offer in remote desc which got from other user
            await rc.setRemoteDescription(eventData.data).then(a=>{
                console.log("Has Set Remote Description")
            })
            // creating answer which will generate ice candiadte for other user
            await rc.createAnswer().then(a=>{
                rc.setLocalDescription(a)
            }).then(a=>{
                console.log("Has Set local description")
            })
        }else if(type==="ice"){
            const candidate = eventData.data
            console.log("Got ice data : " ,candidate)
            rc.addIceCandidate(candidate)
            .then(() => {
                console.log("ICE candidate added successfully");
            })
            .catch(error => {
                console.error("Error adding ICE candidate:", error);
            });
        }else if(type==="close"){
            removeLocalStorageData()
            errorMenu.style.display = "flex"

            errorHeading.innerText = "User left the room"
            errorMenu.style.display = "flex"
            // window.location = '/home'
        }
    }
    rc.onicecandidate = e =>{
        const icedata = null
        if(icedata){
            console.log("sending ice : " ,icedata)
            sendMessage({
                type:'ice',
                data:icedata,
                toId:seconduserId
            })
        }
        if(offerSent){
            const offer = rc.localDescription
            console.log("sending answer " ,offer)
            sendMessage({
                type:'answer',
                data:offer,
                toId:seconduserId
            })
            offerSent=false
        }
    }
    let receivedChunks = [];
    
    let totalChunks;
    let currentFileName;
    let received_progress_bar ;
    let aTag;
    rc.ondatachannel = e=>{rc.dc = e.channel;rc.dc.onmessage = e=>{
        // console.log("getting data")
        const data = e.data;
        if (typeof data === 'string') {
            // Parse metadata if it's JSON
            try {
                const message = JSON.parse(data);
                if(message.type === "metaData"){
                    totalChunks = message.totalChunks;
                    currentFileName = message.fileName
                    const receivedObject =  `
                    <li class="listContainer">
                        <p class="file-heading">${currentFileName}</p>
                        <div class="fileData">
                            <div class="progressBar">
                                <div id="pro${receivedIndex}" class="progress"></div>
                            </div>
                            <a id="a${receivedIndex}" href="#"></a>
                        </div>
                    </li>    
                    `
                    fileListR.innerHTML += receivedObject
                    aTag = document.getElementById(`a${receivedIndex}`)
                    received_progress_bar = document.getElementById(`pro${receivedIndex}`)
                }
                receivedIndex += 1
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        } else if (data instanceof ArrayBuffer) {
            // Handle ArrayBuffer as file chunk
            receivedChunks.push(data);
            console.log(receivedChunks.length , "~~~~" ,totalChunks)
            received_progress_bar.style.width = `${(receivedChunks.length/totalChunks)*100}%`
            console.log(received_progress_bar ,`pro${receivedIndex}~~${(receivedChunks.length/totalChunks)*100}`)
            // Check if all chunks have been received
            if (receivedChunks.length === totalChunks) {
                const fileData = new Blob(receivedChunks);
                // const getAtag = document.getElementById(`a${receivedIndex}`)
                saveFile(fileData ,currentFileName ,aTag);
                console.log(currentFileName , "downloaded")
            }
        }
    };
    rc.dc.onerror = e =>{
        console.log("Error in data channel")
        sendMessage({
            type:"close",
            toId:seconduserId
        })
        removeLocalStorageData()
        errorMenu.style.display = "flex"

        errorHeading.innerText = "Connection Timed out"
        errorMenu.style.display = "flex"
    }
    rc.dc.onclose = e =>{
        console.log("Closing Data channel")
        sendMessage({
            type:"close",
            toId:seconduserId
        })
        removeLocalStorageData()
        errorMenu.style.display = "flex"

        errorHeading.innerText = "Connection Timed out"
        errorMenu.style.display = "flex"
    }
    rc.dc.onopen = e=>console.log("channel opened!")}

    // document.getElementById('check').addEventListener('click',(e)=>{
    //     e.preventDefault()
    //     rc.dc.send("hello from second user")
    // })

    function saveFile(fileData,currentFileName ,a) {
        const blobUrl = URL.createObjectURL(fileData);
        // const a = document.createElement('a');
        // a.innerText = `download ${currentFileName}`
        a.href = blobUrl;
        a.download = currentFileName;
        // document.body.appendChild(a); // Append the link to the body
        a.click();
        URL.revokeObjectURL(blobUrl);
        receivedChunks=[]

        // link.click();
    }
}

function checkForUser(){
    sendMessage({
        type:"available",
        toId:seconduserId
    })
}
function sendMessage(message){
    ws.send(JSON.stringify(message))
}
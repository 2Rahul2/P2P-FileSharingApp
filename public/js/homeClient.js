subButton = document.getElementById('sub')
let userListMenu = document.getElementById('userList')
let myuserName = localStorage.getItem("userName")
let myuserId = localStorage.getItem("userId")
if(myuserId===null){
    window.location.href = "/"
}
let logoutButton = document.getElementById("logoutButton")
let searchText = document.getElementById("searchText")
searchText.innerText = ""
const yesButton = document.getElementById("yes")
const noButton = document.getElementById("no")
const websocketProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${websocketProtocol}//${window.location.hostname}:${window.location.port}/user-connect`);
ws.onopen = function(){
    const userId = localStorage.getItem('userId')
    sendMessage({
        type:'register',
        userId:userId
    })
}
logoutButton.addEventListener("click" ,(e)=>{
    e.preventDefault()
    
    fetch('/deleteUser',{
        method:"POST",
        headers:{
            "Content-Type":"Application/json",
        },
        body:JSON.stringify({"name":myuserName})

    }).then(response=>{
        if (!response.ok) {
            console.log("not okay")
            throw new Error('Network response was not ok');
        }
        return response.json();   
    }).then(data=>{
        console.log(data)
        if(data.type ==="success"){
            localStorage.removeItem("userId")
            localStorage.removeItem("userName")
            window.location.href = "/"
        }else{
            console.log("failed to logout")
        }
    }).catch(err=>console.log(err))
})

ws.onmessage = function(event) {
    const eventData = JSON.parse(event.data)
    const type = eventData.type
    
    console.log(event.data ,`type : ${type}`)
    if(type === "request_connect"){
        const requestMenu = document.getElementById("requestMenu")
        requestMenu.style.display = "flex"
        yesButton.addEventListener('click' ,(e)=>{
            e.preventDefault()
            const requestMenu = document.getElementById("requestMenu")
            requestMenu.style.display = "none"
            console.log("ok")
                    sendMessage({
                        type:"confirm_request",
                        userId:eventData.fromId,
                        from:myuserId,
                        fromuserName:myuserName,
                        message:"YES"
                    })
                    localStorage.setItem("senderName",eventData.from)
                    localStorage.setItem("senderId" ,eventData.fromId)
                    localStorage.setItem("status" ,"getter")
                    window.location =  "/transfer/"
        })
        noButton.addEventListener('click' ,(e)=>{
            e.preventDefault()
            sendMessage({
                type:"confirm_request",
                userId:eventData.fromId,
                from:myuserId,
                fromuserName:myuserName,
                message:"NO"
            })
            const requestMenu = document.getElementById("requestMenu")
            requestMenu.style.display = "none"
        
            console.log("not ok")
        })
        console.log("CONFIRM BOX ACTIVATED")
        // const confirmBox = confirm(`${eventData.from} wants to connect`)
        // if(confirmBox){
        //     console.log("ok")
        //     sendMessage({
        //         type:"confirm_request",
        //         userId:eventData.fromId,
        //         from:myuserId,
        //         fromuserName:myuserName,
        //         message:"YES"
        //     })
        //     localStorage.setItem("senderName",eventData.from)
        //     localStorage.setItem("senderId" ,eventData.fromId)
        //     localStorage.setItem("status" ,"getter")
        //     window.location =  "http://localhost:3000/transfer/"
        // }else{
        //     sendMessage({
        //         type:"confirm_request",
        //         userId:eventData.fromId,
        //         from:myuserId,
        //         fromuserName:myuserName,
        //         message:"NO"
        //     })
        //     console.log("not ok")
        // }
        console.log('Received message from server:', event.data);
    }else if(type === "confirmation"){
        if(eventData.accept === true){
            localStorage.setItem("senderName",eventData.fromuserName)
            localStorage.setItem("senderId" ,eventData.from)
            localStorage.setItem("status" ,"sender")
            window.location =  "/transfer/"
        }else{
            console.log("User declined to connect")
        }
        console.log(event.data)
    }
    // Process the received message here
  };

function sendMessage(message){
    ws.send(JSON.stringify(message))

}


subButton.addEventListener('click' ,(event)=>{
    userListMenu.innerHTML = ''
    searchText.style.color = "brown"
    searchText.innerText = "Searching..."
    const username = document.getElementById('whatName').value
    event.preventDefault()
    fetch('/getUser/',{
        method:"POST",
        headers:{
            "Content-Type":"Application/json",
        },
        body:JSON.stringify({"name":username})
    }).then(response=>{
        if (!response.ok) {
            console.log("not okay")
            throw new Error('Network response was not ok');
        }
        return response.json();   
    }).then(data=>{
        data.forEach(element => {
            userListMenu.innerHTML += `<li> ${element.userName} <button onclick="getId('${element.userId+element.userName}' ,'${element.userName}')" id="${element.userId}">Connect</button></li>`
            searchText.innerText = ""

        });
        console.log(data)
    }).catch(err=>{
        searchText.style.color = "red"
        searchText.innerText = "Error getting user"
        console.log(err)
    })

})
function getId(id , username){
    sendMessage({
        type:"send_request",
        userId:id,
        from:myuserId,
        fromuserName:myuserName,
        message:"hello user from other user"
    })
    console.log("sent message")
    // localStorage.setItem("senderName",username)
    // localStorage.setItem("senderId" ,id)
    // window.location =  "http://localhost:3000/transfer/"
}

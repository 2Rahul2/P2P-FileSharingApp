console.log("heheh")
// let nameTag = document.getElementById('name')
// nameTag.innerText = "My Name"
const localName = localStorage.getItem('userName')
if (localName != null){
    window.location = "/home/"
}
// nameTag.innerText='Name ' + localStorage.getItem('userName')

let creatingUserText = document.getElementById("creating")
let submitButton = document.getElementById('sub')
submitButton.addEventListener('click' ,(e)=>{
    creatingUserText.innerText = "Creating..."
    e.preventDefault()
    console.log("sending")
    let username = document.getElementById('username').value
    fetch('/addUser/',{
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
        console.log(data)
        if(data.type ==="success"){
            localStorage.setItem("userId",data.userId+data.userName)
            localStorage.setItem('userName',data.userName)
            // nameTag.innerText = data.userName
            console.log("Name in Local Storage" ,localStorage.getItem("userName"))
            creatingUserText.innerText = "User Created"
            window.location.href = "/home"

        }else if(data.type ==="failed"){
            creatingUserText.innerText = "User Already Exsits"
            console.log("User Exists")
        }else{
            console.log("Error creating user")
        }
    }).catch(err=>console.log(err))
})






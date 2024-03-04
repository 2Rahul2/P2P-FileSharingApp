const express = require('express')
const expressWs = require('express-ws');
const firebase = require('firebase-admin');

const http = require('http');
const { FieldValue } = require('firebase-admin/firestore')
const bodyParser = require('body-parser')
const path = require('path')
const {db} = require('./firebase.js')


router = express.Router()
const app = express()
expressWs(app);
const server = http.createServer(app);

const port = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.use(bodyParser.json());

// app.use(express.json())

// add data
function generateId() {
    const id = Math.random().toString(36).substr(2,10)
    return id
}
// const userExists = async(userId)=>{
//     const peopleDoc = await db.collection('people').doc('associates').get()
//     if(peopleDoc.exists()){
//         const userData = peopleDoc.data()
//         // if userData
//     }

//     return userDoc.exists()
// }
siteRoute = require('./controllers/siteController')

app.use('/' ,siteRoute)


// ~~WEB SOCKET~~

// ~~~make request to user websocket
const clients = new Map();
app.ws('/user-connect' ,function connectUser(ws ,req){
    ws.on('message' ,function incoming(message){
        const data = JSON.parse(message)
        if(data.type === "register"){
            clients.set(data.userId ,ws)
            console.log("registered  user:  " ,data.userId)
        }else if(data.type === "send_request"){
            const client = clients.get(data.userId)
            const fromUserName = data.fromuserName
            const fromUserId = data.from
            console.log("sent messagr to other user from server" ,data.userId)
            if(client){
                console.log("SENDING TO :  " ,data.userId)
                client.send(JSON.stringify({
                    type:'request_connect',
                    from:fromUserName,
                    fromId:fromUserId,
                    message:"Wanna Connect?"
                }))
            }
        }else if(data.type === "confirm_request"){
            const client = clients.get(data.userId)
            if(client){
                if(data.message === "YES"){
                    client.send(JSON.stringify({
                        type:'confirmation',
                        fromuserName:data.fromuserName,
                        from:data.from,
                        accept:true   
                    }))
                }else{
                    client.send(JSON.stringify({
                        type:'confirmation',
                        accept:false
                    }))                
                }
            }

        }else if(data.type === "close"){
            console.log("sending close message")
            const client = clients.get(data.toId)
            if(client){
                console.log("sending close message to :" ,data.toId)
                client.send(JSON.stringify({
                    type:"close"
                }))
            }
            removeClient(ws);

        }
    })


    ws.on('close', function() {
        console.log('Client disconnected');
    });
})
function removeClient(ws) {
    for (const [userId, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(userId);
        console.log('Client removed:', userId);
        break;
      }
    }
  }

// ~~~~~~~~TRANSFER FILE WEB SOCKET~~~~~~~~~

const connections = new Map()
// const wss = new WebSocket.Server({ server });
// console.log(server.)

app.ws('/', function connection(ws , req){
    ws.on('message',function incoming(message){
        const data = JSON.parse(message);

        if (data.type === "register"){
            connections.set(data.userId ,ws)
            console.log(`registered user : ${connections.get(data.userId)}`)
        }else if(data.type==="available"){
            const client = connections.get(data.toId)
            if(client){
                client.send(JSON.stringify({
                    type:"available",
                }))
            }
        }else if(data.type === "availableResponse"){
            const client = connections.get(data.toId)
            if (client){
                client.send(JSON.stringify({
                    type:"availableResponse",
                    result:"YES"
                }))
            }
        }else if(data.type ==="offer"){
            const client = connections.get(data.toId)
            if(client){
                client.send(JSON.stringify({
                    type:"offer",
                    data:data.data
                }))
            }
        }else if(data.type === "answer"){
            const client = connections.get(data.toId)
            if (client){
                client.send(JSON.stringify({
                    type:'answer',
                    data:data.data,
                }))
            }
        }else if(data.type ==="ice"){
            // console.log("sending ice")
            const client = connections.get(data.toId)
            if(client){
                // console.log("sending ice to " ,data.data)
                client.send(JSON.stringify({
                    type:"ice",
                    data:data.data
                }))
            }
        }else if(data.type === "close"){
            console.log("sending close message" ,data.toId ,connections.get(data.toId))
            const client = connections.get(data.toId)
            if(client){
                console.log("sending close message to :" ,data.toId)
                client.send(JSON.stringify({
                    type:"close",
                }))
            }
            // removeClient(ws);

        }else if(data.type === "error"){
            const client = connections.get(data.toId)
            if(client){
                client.send(JSON.stringify({
                    type:"error"
                }))
            }
        }

        // }else if(data.type === 'message'){
        //     console.log(`message : ${data.text}`)
        // }else if(data.type === 'offer'){
        //     const client = connections.get(data.recipient)
        //     if(client){
        //         client.send(JSON.stringify({
        //             type:'offer',
        //             data:data.data,
        //         }))
        //     }
        // }else if(data.type === "candidate"){
        //     const client = connections.get(data.recipient)
        //     if (client){
        //         client.send(JSON.stringify({
        //             type:'candidate',
        //             data:data.candidate
        //         }))
        //     }
        // }else if(data.type ===  "user_available"){
        //     const client = connections.get(data.recipient)
        //     if(client){
        //         client.send(JSON.stringify({
        //             type:"confirmation_",
        //         }))
        //         ws.send(JSON.stringify({
        //             type:"confirmation",
        //             result:"YES"
        //         }))
        //     }else{
        //         ws.send(JSON.stringify({
        //             type:"confirmation",
        //             result:"NO"
        //         }))
        //     }
        // }else if(data.type === "available"){
        //     const client = connections.get(data.recipient)
        //     if(client){
        //         client.send(JSON.stringify({
        //             type:"available",
        //             result:"YES"
        //         }))
        //     }
        // }else if(data.type === "answer"){
        //     const client = connections.get(data.recipient)
        //     if(client){
        //         console.log(data.answer)
        //         client.send(JSON.stringify({
        //             type:'answer',
        //             data:data.answer
        //         }))
        //     }else{
        //         console.log("No client to send answers back!")
        //     }
        // }
    })

    ws.on('close' ,function(){
        // for (const [userId, client] of connections.entries()) {
        //     if (client === ws) {
        //       connections.delete(userId);
        //       console.log('Client removed:', userId);
        //       break;
        //     }
        //   }
        // const userId = Object.keys(connections).find(key=> connections[key] ===ws)
        // if (userId){
        //     delete connections[userId]
        // }
    })
})






app.post('/deleteUser' ,async(req ,res)=>{
    const username = req.body.name
    const peopleRef =  db.collection("people").doc(username)
    await peopleRef.delete().then(function(){
        res.send(JSON.stringify({
            type:"success",
        }))
    }).catch(err=>{
        res.send(JSON.stringify({
            type:"failed",
        }))
    })

})
app.post('/getUser' , async(req,res)=>{
    const searchString = req.body.name
    const peopleRef = db.collection('people');
    const similarUser = await peopleRef.where(firebase.firestore.FieldPath.documentId(), '>=', searchString)
                                      .where(firebase.firestore.FieldPath.documentId(), '<=', searchString + '\uf8ff')
                                      .get();
    const matchingUsernames = [];
    similarUser.forEach(doc => {
        const userId = doc.data().id
        const username = doc.id;
        console.log(username ,userId,"name here and search string :" ,searchString)
      matchingUsernames.push({'userId':userId ,'userName':username});
    });

    res.send(matchingUsernames);
    }
)

app.post('/add', async (req, res) => {
    const name = req.body.name
    const peopleRef = await db.collection('people').doc('associates')
    const peopleData = await peopleRef.get()
    if(peopleData.exists){
        const userData = peopleData.data()
        let id = generateId()
        do{
            id = generateId()
        }while(userData[id])
        const res2 = await peopleRef.set({
            "id": id,
            "name":name
        }, { merge: true })
        // friends[name] = status
        res.status(200).send(JSON.stringify({"userId":id ,"userName":name}))
        return
    }
    res.status(404).send("Error here")
})

async function userExists(username){
    const docRef = db.collection("people").doc(username);
    const doc = await docRef.get();
    console.log(`Checking if document ${username} exists: ${doc.exists}`);
    return doc.exists;
}



app.post('/addUser' ,async(req ,res)=>{
    try {
        const name  = req.body.name;
        let id = generateId()
        let userExistRes =await userExists(name)
        if(userExistRes){
            res.status(200).send(JSON.stringify({"type":"failed"}));
        }else{
            id = generateId()
            // do{
            //     console.log(id)
            //     userExistRes = await userExists(name)
            // }while(userExistRes)
            const docRef = db.collection("people").doc(name);
            await docRef.set({
                'id':id
            })
            res.status(200).send(JSON.stringify({"type":"success","userId":id ,"userName":name}));
        }
      } catch (error) {
        console.error("Error storing data: ", error);
        res.status(500).send(JSON.stringify({"type":"error"}));
      }
})
app.get('/getData' ,async (req ,res)=>{
    const peopleRef = db.collection('people').doc('associates')
    const doc = await peopleRef.get()
    if (!doc.exists) {
        return res.sendStatus(400)
    }

    res.status(200).send(doc.data())
})
app.listen(port ,()=>{
    console.log("hello")
})


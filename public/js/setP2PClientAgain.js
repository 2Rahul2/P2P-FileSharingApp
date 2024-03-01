// import { Peer } from "peerjs";
const { PeerServer } = require("peer");
const ConnectionStatus = localStorage.getItem("status")
const myuserId = localStorage.getItem("userId")
const seconduserId = localStorage.getItem("senderId")
const peer = new Peer(52,{
    host: "localhost",
		port: 9000,
		path: "/",
});
const peerServer = PeerServer({ port: 9000, path: "/" });
// You can pick your own id or omit the id if you want to get a random one from the server.

if (ConnectionStatus==="sender"){
    peer.on('open', function(id) {
        console.log('My peer ID is: ' + id);
      });

}else{
    peer.on("connection", (conn) => {
        conn.on("data", (data) => {
            // Will print 'hi!'
            console.log(data);
        });
        conn.on("open", () => {
            conn.send("hello!");
        });
    });
}


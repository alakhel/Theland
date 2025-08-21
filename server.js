const shareNow = require("./sharenow.js");
const express = require("express");
const WebSocket = require("ws");
const http = require("http")

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
let client = new shareNow();
client.connect();
wss.on("connection", ws => {
    ws.send(JSON.stringify(client.getVehicles(vehicleUpdate => {
        ws.send(JSON.stringify(vehicleUpdate));
    })))
});

app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile("index.html", {root: __dirname});
});

server.listen(process.env.PORT , () => {
    console.log("Server is up and running on port 8080.");
});
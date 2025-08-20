const shareNow = require("./sharenow.js");
const express = require("express");
const WebSocket = require("ws");

const app = express();
const wss = new WebSocket.Server({port: process.env.PORT});
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

app.listen(process.env.PORT, () => {
    console.log("Server is up and running on port 8080.");
});
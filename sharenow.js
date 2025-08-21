const mqtt = require("mqtt");
const zlip = require("zlib");
const uuid = require("uuid-random");

class ShareNowClient {
    static VEHICLELISTDELTA = "C2G/S2C/48/VEHICLELISTDELTA.GZ";
    static VEHICLELIST = "C2G/S2C/48/VEHICLELIST.GZ"
    vehicles = [];
    chargers = [];
    #updateCallback;

    connect() {
        let clientId = `a:${uuid()}`;
        let client = mqtt.connect('mqtts://driver.eu.share-now.com:443', {
            clientId,
            rejectUnauthorized: false,
            reconnectPeriod: 0
        });

        client.on('connect', () => {
            console.log("Connected to MQTT broker. Subscribing to topics.");
            client.subscribe(ShareNowClient.VEHICLELIST, {qos: 0});
            client.subscribe(ShareNowClient.VEHICLELISTDELTA, {qos: 1});
        });

        client.on("message", (topic, message) => {
            let json = JSON.parse(zlip.gunzipSync(message));
            if (topic === ShareNowClient.VEHICLELISTDELTA) {
                this.updateVehicles(json);
                if (this.#updateCallback !== undefined) {
                    this.#updateCallback(json);
                }
            } else if (topic === ShareNowClient.VEHICLELIST) {
                console.log("Received initial vehicle list");
                client.unsubscribe(ShareNowClient.VEHICLELIST);
                this.vehicles = json.connectedVehicles;
            }
        });

        client.on("error", error => {
            console.log(`Error: ${error}`);
        });

        client.on("close", () => {
            console.log("Close");
        });
    }

    getVehicles(callback) {
        this.#updateCallback = callback;
        return this.vehicles;
    }
    
    updateVehicles(vehicleUpdate) {
        this.vehicles = this.vehicles.concat(vehicleUpdate.addedVehicles);
        vehicleUpdate.removedVehicles.forEach(vehicleId => {
            this.vehicles = this.vehicles.filter(e => e.id !== vehicleId);
        });
    }
    async getChargers(){
        // Endpoint temps réel Belib
const API_URL = "https://opendata.paris.fr/api/records/1.0/search/?dataset=belib-points-de-recharge-pour-vehicules-electriques-disponibilite-temps-reel&rows=1000";

// Fonction pour filtrer les bornes opérationnelles et Type 2
    
        const response = await fetch(API_URL);

        const data = await response.json();
        console.log(data)
        fetch(API_URL).then(response=>{
            const data = response.json()
            console.log(data)

        })
        
        const stations = data.records
            .filter(record => {
                const fields = record.fields;
                // Filtrer par statut "Disponible" ou "En charge" = opérationnel
                const operational = fields.statut === "Disponible" || fields.statut === "En charge";
                
                // Vérifier si Type de prise contient "Type 2"
                const hasType2 = fields.type_prise?.some(tp => tp.includes("Type 2"));
                
                return operational && hasType2;
            })
            .map(record => ({
                id: record.recordid,
                name: record.fields.nom_station,
                status: record.fields.statut,
                address: record.fields.adresse,
                lat: record.fields.geo_point_2d[0],
                lon: record.fields.geo_point_2d[1],
                plugs: record.fields.type_prise
            }));

        console.log("Bornes opérationnelles Type 2 :", stations.length);
        console.log(stations);

        this.chargers= stations;
        return stations;
 


    }
}

module.exports = ShareNowClient;
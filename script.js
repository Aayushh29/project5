let client;
let isConnected = false;
let reconnectTimeout = null;

const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const topicInput = document.getElementById('topic');
const startBtn = document.getElementById('start');
const endBtn = document.getElementById('end');
const shareBtn = document.getElementById('share');
const statusDiv = document.getElementById('status');

startBtn.onclick = () => {
    if (isConnected) return;

    const useSSL = document.querySelector('input[name="ssl"]:checked').value === "true";
    const protocol = useSSL ? "wss" : "ws";
    const host = hostInput.value;
    const port = Number(portInput.value);
    const wsURL = `${protocol}://${host}:${port}/mqtt`;
    if(!port || !host)
    {   
        showStatus("Provide all the details");
        return;

    }
    console.log("Trying to connect to:", wsURL);

    client = new Paho.MQTT.Client(wsURL, "clientId-" + Math.random().toString(36).substr(2, 9));
    showStatus("Attempting to reconnect...");

    client.connect({
        onSuccess: () => {
            isConnected = true;
            clearTimeout(reconnectTimeout);
            showStatus("Connected!");
            client.subscribe(topicInput.value);
        },
        useSSL: useSSL,
        onFailure: (err) => {
            console.error("❌ Connection failed:", err.errorMessage);
            showStatus("Connection failed. Retrying...");
            reconnectTimeout = setTimeout(() => connectClient(wsURL, useSSL), 3000);
        }
    });

    client.onConnectionLost = () => {
        showStatus("Connection lost. Attempting to reconnect...");
        isConnected = false;
        reconnectTimeout = setTimeout(() => connectClient(wsURL, useSSL), 3000);
    };

    client.onMessageArrived = onMessageArrived;

    // Disable host and port inputs
    hostInput.disabled = true;
    portInput.disabled = true;
    document.querySelectorAll('input[name="ssl"]').forEach(rb => rb.disabled = false);

};


function connectClient(wsURL, useSSL) {
    console.log("Reconnecting to:", wsURL);

    client.connect({
        onSuccess: () => {
            isConnected = true;
            clearTimeout(reconnectTimeout);
            showStatus("Reconnected!");
            client.subscribe(topicInput.value);
        },
        useSSL: useSSL,
        onFailure: (err) => {
            console.error("Reconnection failed:", err.errorMessage);
            showStatus("Retrying connection...");
            reconnectTimeout = setTimeout(() => connectClient(wsURL, useSSL), 3000);
        }
    });
}


endBtn.onclick = () => {
    if (client && isConnected) {
        client.disconnect();
        isConnected = false;
        showStatus("Disconnected.");
    }

    // Enable host and port input again
    hostInput.disabled = false;
    portInput.disabled = false;
    clearTimeout(reconnectTimeout);
};

function showStatus(message) {
    statusDiv.innerText = message;
}

shareBtn.onclick = () => {
    if (!isConnected) return alert("Connect first!");
    const topic = topicInput.value;

    if (!topic.match(/^[a-zA-Z0-9_/-]+\/[a-zA-Z0-9_/-]+\/my_temperature$/)) {
        alert("Please follow the topic format: course_code/name/my_temperature (with _ instead of space)");
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const temp = Math.floor(Math.random() * 100 - 40); // [-40, 60]

        const geojson = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lon, lat]
            },
            properties: {
                temperature: temp
            }
        };

        const message = new Paho.MQTT.Message(JSON.stringify(geojson));
        message.destinationName = topic;
        client.send(message);
    }, () => {
        alert("Unable to get location.");
    });
};

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker;

function onMessageArrived(message) {
    try {
        const data = JSON.parse(message.payloadString);
        const [lon, lat] = data.geometry.coordinates;
        const temp = data.properties.temperature;

        const color = temp < 10 ? "blue" : temp < 30 ? "green" : "red";

        if (marker) map.removeLayer(marker);
        marker = L.circleMarker([lat, lon], {
            radius: 10,
            color,
            fillColor: color,
            fillOpacity: 0.8
        }).addTo(map)
            .bindPopup(`Temperature: ${temp}°C`)
            .openPopup();

        map.setView([lat, lon], 15);
    } catch (err) {
        console.error("Invalid MQTT message received:", err);
    }
}
const locateBtn = document.getElementById('locateBtn');
let userLocationMarker;
locateBtn.onclick = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        

        // Removes previous user marker if exists
        if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
        }

        // Add a new marker
        userLocationMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup("📍 You are here")
            .openPopup();

        // Center map
        map.setView([lat, lon], 15);
    }, () => {
        alert("Unable to retrieve your location.");
    });
};

let client;
let isConnected = false;
let reconnectTimeout = null;

// Elements from the DOM
const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const topicInput = document.getElementById('topic');
const startBtn = document.getElementById('start');
const endBtn = document.getElementById('end');
const shareBtn = document.getElementById('share');
const statusDiv = document.getElementById('status');
const locateBtn = document.getElementById('locateBtn');

// Start button = connect to MQTT broker
startBtn.onclick = () => {
    if (isConnected) return;

    const useSSL = document.querySelector('input[name="ssl"]:checked').value === "true";
    const protocol = useSSL ? "wss" : "ws";
    const host = hostInput.value;
    const port = Number(portInput.value);
    const wsURL = `${protocol}://${host}:${port}/mqtt`;

    if (!port || !host) {
        showStatus("Please provide accurate details", true);
        return;
    }

    console.log("Trying to connect to:", wsURL);

    client = new Paho.MQTT.Client(wsURL, "clientId-" + Math.random().toString(36).substr(2, 9));
    showStatus("Attempting to reconnect...");

    setupClient(wsURL, useSSL);

    // Set up connection lost and message handling
    client.onConnectionLost = () => {
        showStatus("Connection lost. Attempting to reconnect...");
        isConnected = false;
        reconnectTimeout = setTimeout(() => setupClient(wsURL, useSSL), 3000);
    };

    client.onMessageArrived = onMessageArrived;

    // Disable inputs so they don't change mid-session
    hostInput.disabled = true;
    portInput.disabled = true;
    document.querySelectorAll('input[name="ssl"]').forEach(rb => rb.disabled = true);
    shareBtn.disabled = false;
};

// Sets up MQTT client and handles success/failure
function setupClient(wsURL, useSSL) {
    client.connect({
        onSuccess: () => {
            isConnected = true;
            clearTimeout(reconnectTimeout);
            showStatus("Connected!");

            const topic = topicInput.value;
            client.subscribe(topic); // Subscribes to <course>/<name>/my_temperature
        },
        useSSL: useSSL,
        onFailure: (err) => {
            console.error("❌ Connection failed:", err.errorMessage);
            showStatus("Connection failed. Retrying...");
            reconnectTimeout = setTimeout(() => setupClient(wsURL, useSSL), 3000);
        }
    });
}


// Disconnects from MQTT broker
endBtn.onclick = () => {
    if (client && isConnected) {
        client.disconnect();
        isConnected = false;
        showStatus("Disconnected.");
    }

    hostInput.disabled = false;
    portInput.disabled = false;
    document.querySelectorAll('input[name="ssl"]').forEach(rb => rb.disabled = false);
    shareBtn.disabled = true;
    clearTimeout(reconnectTimeout);
};

// Updates the status bar
function showStatus(message, isError = false) {
    statusDiv.innerText = message;
    statusDiv.className = isError ? "error" : "";
}

// Share your location + fake temperature
shareBtn.onclick = () => {
    if (!isConnected) return alert("Connect first!");

    const topic = topicInput.value;

    // Check if topic format is correct
    if (!topic.match(/^[a-zA-Z0-9_/-]+\/[a-zA-Z0-9_/-]+\/my_temperature$/)) {
        alert("Please follow the topic format: course_code/name/my_temperature (with _ instead of space)");
        return;
    }

    // Get user's location
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const temp = Math.floor(Math.random() * 100 - 40); // [-40, 60] temperature

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

        // Send to MQTT
        const message = new Paho.MQTT.Message(JSON.stringify(geojson));
        message.destinationName = topic;
        client.send(message);
    }, () => {
        alert("Unable to get location.");
    });
};

// Setup the map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker;

// When a message arrives, plot it on the map
// When a message arrives, show the sender's location and temperature on the map
function onMessageArrived(message) {
    try {
        const data = JSON.parse(message.payloadString);

        if (!data.geometry || !data.properties || !data.geometry.coordinates) {
            console.warn("Message doesn't have expected GeoJSON structure.");
            return;
        }

        const [lon, lat] = data.geometry.coordinates;
        const temp = data.properties.temperature;

        // Determine marker color based on temperature
        const color = temp < 10 ? "blue" : temp < 30 ? "green" : "red";

        // Remove previous marker if it exists
        if (marker) map.removeLayer(marker);

        // Add new temperature marker
        marker = L.circleMarker([lat, lon], {
            radius: 10,
            color,
            fillColor: color,
            fillOpacity: 0.8
        }).addTo(map)
          .bindPopup(`Temperature: ${temp}°C`)
          .openPopup();

        // Zoom in to location
        map.setView([lat, lon], 15);
    } catch (err) {
        console.error("Error processing incoming MQTT message:", err);
    }
}

// Locate Me button behavior
let userLocationMarker;
locateBtn.onclick = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
        }

        userLocationMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup("📍 You are here")
            .openPopup();

        map.setView([lat, lon], 15);
    }, () => {
        alert("Unable to retrieve your location.");
    });
};

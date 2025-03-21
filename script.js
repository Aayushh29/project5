let client;
let isConnected = false;

document.getElementById('start').onclick = () => {
  const host = document.getElementById('host').value;
  const port = Number(document.getElementById('port').value);
  const clientId = "clientId-" + Math.random().toString(36).substr(2, 9);

  client = new Paho.MQTT.Client(host, port, clientId);

  client.onConnectionLost = (responseObject) => {
    showStatus("Connection lost. Reconnecting...");
    connectClient();
  };

  client.onMessageArrived = onMessageArrived;

  connectClient();
};

function connectClient() {
  client.connect({
    onSuccess: () => {
      isConnected = true;
      showStatus("Connected!");
      const topic = document.getElementById('topic').value;
      client.subscribe(topic);
    },
    useSSL: false,
    onFailure: () => showStatus("Connection failed.")
  });
}

document.getElementById('end').onclick = () => {
  if (client && isConnected) {
    client.disconnect();
    isConnected = false;
    showStatus("Disconnected.");
  }
};

function showStatus(message) {
  document.getElementById('status').innerText = message;
}

document.getElementById('share').onclick = () => {
    if (!isConnected) return alert("Connect first!");
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const temp = Math.floor(Math.random() * 100 - 40); // Range [-40, 60]
      const topic = document.getElementById('topic').value;
  
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
    });
  };
  
  const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker;

function onMessageArrived(message) {
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
}

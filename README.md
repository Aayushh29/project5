# Geoweb App

🔗 **Access the Web App Here:** [https://aayushh29.github.io/project5/](https://aayushh29.github.io/project5/)

This is a web application developed to demonstrate MQTT communication with geolocation and map visualization. The app connects to an MQTT broker, publishes GeoJSON messages containing location and temperature, and subscribes to display them dynamically on a map.

## 📋 Features

- 🔌 **MQTT Broker Configuration:** Users can specify MQTT host and port.
- 🚀 **Start/End Connection:** Connect/disconnect to the MQTT broker with buttons. Inputs are locked during the connection.
- 🔁 **Auto-Reconnect:** App automatically attempts to reconnect if the connection is lost.
- 📬 **Publish Messages:** Users can publish messages to any topic they specify.
- 🌍 **"Share My Status" Button:**
  - Publishes current GPS location and a random temperature (-40°C to 60°C).
  - Message is sent in GeoJSON format to a topic matching this pattern:  
    ```
    <course_code>/<your_name>/my_temperature
    ```
- 🗺 **Live Map (Leaflet):**
  - Subscribes to the topic and shows location markers on the map.
  - Clicking the marker shows the current temperature.
  - Marker color depends on temperature:
    - 🔵 Blue: `[-40, 10)`
    - 🟢 Green: `[10, 30)`
    - 🔴 Red: `[30, 60]`

- 📱 **Mobile Ready:** Fully responsive and uses device GPS for mobile demo.

## 🛠 Technologies Used

- HTML, CSS, JavaScript
- [Paho MQTT JS Client](https://www.eclipse.org/paho/index.php?page=clients/js/index.php)
- [Leaflet.js](https://leafletjs.com/)
- MQTT Broker (e.g., `test.mosquitto.org`)

## 🚀 How to Run

1. Open `index.html` in a web browser (preferably on a mobile device for GPS features).
2. Enter the MQTT host and port (e.g., `test.mosquitto.org` and `8081`).
3. Choose WebSocket type (`ws` or `wss`).
4. Click **Start** to connect.
5. Enter a valid topic (e.g., `engo651/ayush/my_temperature`).
6. Click **Share My Status** to publish a location + temperature message.
7. Use **MQTTX** to verify message transmission and reception.

## 📁 File Structure

```
├── index.html       # Main UI
├── script.js        # App logic (MQTT + map)
├── style.css        # UI styling
└── README.md        # Project documentation
```

## 📌 Notes

- Topic format must strictly match:
  ```
  <your_course_code>/<your_name>/my_temperature
  ```
  Use `_` instead of spaces.
- Ensure GPS is enabled on your device for accurate location.

## 📧 Author

Ayush Parikh – *ENGO 651 – University of Calgary

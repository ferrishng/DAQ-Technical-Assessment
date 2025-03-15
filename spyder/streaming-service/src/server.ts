import net from "net";
import { WebSocket, WebSocketServer } from "ws";

interface VehicleData {
  battery_temperature: number | string;
  timestamp: number;
}

const TCP_PORT = 12000;
const WS_PORT = 8080;
const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: WS_PORT });
let dangerous_temps: number[] = [];

tcpServer.on("connection", (socket) => {
  console.log("TCP client connected");

  socket.on("data", (msg: any) => {
    const message: string = msg.toString();
    const parsedMessage: VehicleData = JSON.parse(message);
    const battery_temperature = parsedMessage.battery_temperature;
    const timestamp = parsedMessage.timestamp;
    
    if (typeof battery_temperature === "number") {
      console.log(`Received: ${message}`);

      if (battery_temperature < 20 || battery_temperature > 80) {
        dangerous_temps.push(timestamp);        
      }

      dangerous_temps = dangerous_temps.filter(timestamp => Date.now() - timestamp <= 5000);

      if (dangerous_temps.length > 3) {
        console.log(`Current timestamp: ${timestamp}`);
        console.log("Error: received battery temperature exceeds safe range more than 3 times in 5 seconds")
        dangerous_temps.shift();
      }

      // Send JSON over WS to frontend clients
      websocketServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  socket.on("end", () => {
    console.log("Closing connection with the TCP client");
  });

  socket.on("error", (err) => {
    console.log("TCP client error: ", err);
  });
});

websocketServer.on("listening", () =>
  console.log(`Websocket server started on port ${WS_PORT}`)
);

websocketServer.on("connection", async (ws: WebSocket) => {
  console.log("Frontend websocket client connected");
  ws.on("error", console.error);
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP server listening on port ${TCP_PORT}`);
});

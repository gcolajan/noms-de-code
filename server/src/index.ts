import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { Player } from './Player';
import { Game } from './Game';

const app = express();
const server = http.createServer(app);
server.listen(3030, () => {
  const { port } = server.address()! as any;
  console.log(`Opening at 0.0.0.0:${port}`);
});

const wss = new WebSocket.Server({ server });

const instances: Game[] = [];

wss.on('connection', (ws: WebSocket) => {
  let player: Player | null = null;
  let game: Game | null = null;

  // connection is up, let's add a simple simple event
  ws.on('message', async (message: string) => {
    console.log('received: %s', message);
    const { action, payload, proceed = true } = JSON.parse(message);

    if (!player) {
      if (action === 'pseudo') {
        player = Player.create(payload.pseudo, ws);
        ws.send(JSON.stringify({ action, payload: { success: true, pseudo: player.name } }));
      } else {
        ws.send(JSON.stringify({ action: 'error', payload: "Send pseudo first" }));
      }
    } else if (!game) {
      if (action === 'create') {
        game = new Game();
        instances.push(game);
        game.add(player);
        player.send({ action, payload: game.name });
      } else if (action === 'join') {
        const instance = instances.find(g => g.name === payload.name);
        if (instance) {
          game = instance;
          game.add(player);
          player.send({ action, payload: game.name });
        } else {
          player.error("Game not found")
        }
      } else {
        player.error("Game required");
      }
    } else {
      game.handle(player, action, payload, proceed);
    }
  });

  // send immediatly a feedback to the incoming connection
  ws.send(JSON.stringify({ body: 'Hi there, I am a WebSocket server' }));
});

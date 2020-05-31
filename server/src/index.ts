import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { Player } from './Player';
import { Game } from './Game';
import { CONFIG } from './config';

const app = express();
const server = http.createServer(app);
server.listen(3030, () => {
  const { port } = server.address()! as any;
  console.log(`Opening at 0.0.0.0:${port}`);
});

const wss = new WebSocket.Server({ server });

const instances: Game[] = [];

wss.on('connection', (ws: WebSocket) => {
  let isAdmin = false;
  let player: Player | null = null;
  let game: Game | null = null;
  
  let isAlive = true;
  ws.on('pong', () => isAlive = true);
  const pingInterval = setInterval(() => {
    console.log('ping');
    if (!isAlive) {
      clearInterval(pingInterval);
      if (player) {
        if (player.isSpyMaster && game) {
          game.end();
        } else {
          player.close();
        }
      }
      return ws.terminate();
    }
 
    isAlive = false;
    ws.ping();
  }, 10000);

  // connection is up, let's add a simple simple event
  ws.on('message', async (message: string) => {
    console.log('received: %s', message);
    const { action, payload } = JSON.parse(message);

    if (isAdmin) {
      ws.send(JSON.stringify({
        action: 'debug',
        payload: {
          clients: wss.clients.size,
          instances: instances.map(i => i.toJSON()),
        }
      }));
    } else if (!player) {
      if (action === 'pseudo') {
        if (payload.pseudo === CONFIG.ADMIN_ACCESS) {
          isAdmin = true;
          ws.send(JSON.stringify({ action, payload: { success: true, pseudo: 'admin', isAdmin: true } }));
          return;
        }
        player = Player.create(payload.pseudo, ws);
        ws.send(JSON.stringify({ action, payload: { success: true, pseudo: player.name } }));
      } else {
        ws.send(JSON.stringify({ action: 'error', payload: "Send pseudo first" }));
      }
    } else if (!game) {
      if (player.isRecycling) {
        const instance = instances.find(game => game.hasPlayer(player!));
        if (instance) {
          game = instance;
          player.isRecycling = false;
          game.handle(player, action, payload);
          return;
        } else {
          player.isRecycling = false;
        }
      }

      if (action === 'create') {
        game = new Game();
        instances.push(game);
        game.onEnd = () => instances.splice(instances.indexOf(game!), 1);
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
      game.handle(player, action, payload);
    }
  });

  // send immediatly a feedback to the incoming connection
  ws.send(JSON.stringify({ body: 'Hi there, I am a WebSocket server' }));
});

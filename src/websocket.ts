import * as ws from 'ws';
import { type Request } from 'express';
import { type Socket } from 'net';
import { Games } from './models';
import { createGame } from './gameLogic/game';
import { type Game, type ParsedWebSocketContent } from './types';
import { chatActions, gameActions } from './utils';

interface ExtWebSocket extends ws.WebSocket {
  isAlive: boolean;
  roomId: string;
}

type Sockets = Record<string, ws.WebSocketServer>;

function createSockets(id: string, newSocket: ws.WebSocketServer) {
  const gameInstance: Game = createGame();
  newSocket.on('connection', function connection(ws: ExtWebSocket) {
    (async () => {
      const finalContent = await gameActions(
        gameInstance,
        {
          userId: '12345',
          userName: '12345',
          gameCommand: 'initial',
          contentType: 'game'
        },
        ws.roomId
      );
      ws.send(finalContent);
    })().catch((err) => {
      console.error(err);
    });

    function heartbeat() {
      ws.isAlive = true;
    }
    ws.roomId = id;
    ws.isAlive = true;
    ws.on('error', console.error);
    ws.on('pong', () => {
      heartbeat();
    });

    ws.on('message', async (data: ws.RawData, isBinary) => {
      const message = isBinary ? data : data.toString();

      let parse = {} as ParsedWebSocketContent;
      if (typeof message === 'string') {
        try {
          parse = JSON.parse(message);
        } catch (e) {
          console.error('parse failed:', e);
        }
      }
      /*
      all messages must contain proper body content
      {
      "userId": <uuid>/string,
      "content": string,
      "contentType": chat | game,
      }
      */
      let finalContent = '';
      if (parse.contentType === 'chat') {
        finalContent = await chatActions(parse, ws.roomId);
      } else if (parse.contentType === 'game') {
        finalContent = await gameActions(gameInstance, parse, ws.roomId);
      }
      newSocket.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(finalContent);
        }
      });
    });

    ws.on('close', () => {
      ws.send('closed');
      clearInterval(interval);
    });
  });

  const interval = setInterval(() => {
    newSocket.clients.forEach((ws) => {
      // due to ws library being a class, not an interface
      // we have to hack the type
      const wsx = ws as ExtWebSocket;
      if (!wsx.isAlive) {
        wsx.terminate();
        return;
      }

      wsx.isAlive = false;
      wsx.ping();
    });
  }, 30000);
}

const socketStore: Sockets = {};

export async function upgradeConnection(
  request: Request,
  socket: Socket,
  head: Buffer
) {
  const pathContent = request.url.split('/');
  const id = pathContent[2].toString();
  // confirm base path before query
  if (pathContent[1] === 'games') {
    // if game id isnt in db then terminate
    const findGame = await Games.getGame(id);
    if (findGame !== undefined) {
      if (
        socketStore[id] === undefined &&
        Object.keys(socketStore).length <= 5
      ) {
        socketStore[id] = new ws.WebSocketServer({ noServer: true });
        createSockets(id, socketStore[id]);
      }
      socketStore[id].handleUpgrade(request, socket, head, (ws) => {
        socketStore[id].emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } else {
    socket.destroy();
  }
}

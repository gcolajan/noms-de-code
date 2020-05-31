import * as WebSocket from 'ws';
import { Team } from './Team';

export class Player {
  private static players: Set<Player> = new Set();

  private _name: string;
  private _ws: WebSocket;
  private _team: Team | null;

  private _teamChosen: boolean;
  private _readyToStart: boolean;
  private _wantsToSpy: boolean;
  private _isSpyMaster: boolean;
  private _onRecycledPlayer?: Function;
  private _isRecycling: boolean;

  get name(): string  { return this._name; }

  get team(): Team | null { return this._team; }
  set team(val: Team | null) { this._team = val; }

  get teamChosen(): boolean { return this._teamChosen; }
  set teamChosen(val: boolean) { this._teamChosen = val; }

  get wantsToSpy(): boolean { return this._wantsToSpy; }
  set wantsToSpy(val: boolean) { this._wantsToSpy = val; }

  get readyToStart(): boolean { return this._readyToStart; }
  set readyToStart(val: boolean) { this._readyToStart = val; }

  get isSpyMaster(): boolean { return this._isSpyMaster; }
  set isSpyMaster(val: boolean) { this._isSpyMaster = val; }

  get isRecycling(): boolean { return this._isRecycling; }
  set isRecycling(val: boolean) { this._isRecycling = val; }

  set onRecycledPlayer(fn: Function) { this._onRecycledPlayer = fn; }

  private constructor(name: string, ws: WebSocket) {
    this._name = name;
    this._ws = ws;
    this._team = null;
    this._teamChosen = false;
    this._wantsToSpy = false;
    this._isSpyMaster = false;
    this._readyToStart = false;
    this._isRecycling = false;
  }

  protected static findPlayer(name: string): Player | void {
    for (const player of this.players.values()) {
      if (player.name === name) {
        return player;
      }
    }
  }

  static create(name: string, connection: WebSocket): Player {
    let player = this.findPlayer(name);
    if (player) {
      console.log('Recycle player');
      player._ws.close();
      player._ws = connection;
      player._isRecycling = true;
      player._onRecycledPlayer && player._onRecycledPlayer();
    } else {
      console.log('Create player');
      player = new Player(name, connection);
      this.players.add(player);
    }

    return player;
  }

  send(msg: { action: string, payload?: any }): void {
    this._ws.send(JSON.stringify(msg));
  }

  error(msg: string): void {
    this.send({ action: 'error', payload: msg });
  }

  invalidAction(): void {
    this.error('Invalid action');
  }

  toJSON(): any {
    return {
      name: this._name,
      team: this._team,
      teamChosen: this._teamChosen,
      wantsToSpy: this._wantsToSpy,
      isSpyMaster: this._isSpyMaster,
      readyToStart: this._readyToStart,
    }
  }

  close(): void {
    this._ws.close();
    Player.players.delete(this);
    console.log(`Player disconnected: ${this.name}`);
  }
}

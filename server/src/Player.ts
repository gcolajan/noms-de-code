import * as WebSocket from 'ws';
import { Team } from './Team';

export class Player {
  private static players: Player[] = [];

  private _name: string;
  private _ws: WebSocket;
  private _team: Team;

  private _teamChosen: boolean;
  private _readyToStart: boolean;
  private _wantsToSpy: boolean;
  private _isSpyMaster: boolean;

  get name(): string  { return this._name; }

  get team(): Team { return this._team; }
  set team(val: Team) { this._team = val; }

  get teamChosen(): boolean { return this._teamChosen; }
  set teamChosen(val: boolean) { this._teamChosen = val; }

  get wantsToSpy(): boolean { return this._wantsToSpy; }
  set wantsToSpy(val: boolean) { this._wantsToSpy = val; }

  get readyToStart(): boolean { return this._readyToStart; }
  set readyToStart(val: boolean) { this._readyToStart = val; }

  get isSpyMaster(): boolean { return this._isSpyMaster; }
  set isSpyMaster(val: boolean) { this._isSpyMaster = val; }

  private constructor(name: string) {
    this._name = name;
    this._teamChosen = false;
    this._wantsToSpy = false;
    this._isSpyMaster = false;
    this._readyToStart = false;
  }

  static create(name: string, connection: WebSocket): Player {
    let player = this.players.find(p => p.name === name);
    if (player) {
      console.log('Recycle player');
      player._ws && player._ws.close();
    } else {
      console.log('Create player')
      player = new Player(name);
    }

    player._ws = connection;

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
}

import { Player } from "./Player";
import { Team } from "./Team";
import { words } from './words';
import { HandleAction, isPreAction, isSpyAction, isGameAction, HandlePreAction, HandleSpyAction, HandleGameAction, isSpyElectionAction, HandleSpyElectionAction } from "./GameActions";

type WordKind = 'blue' | 'red' | 'black' | 'neutral';
type Word = {
  index: number;
  word: string;
  kind: WordKind;
  revealed: 'red' | 'blue' | null;
}
type Attempt = {
  index: number;
  success: boolean;
}

type Guess = {
  word: string;
  occ: number;
  attempts: Attempt[];
  team: Team;
}

export class Game {
  /** Timeout after 30min without any interaction */
  protected static TIMEOUT = 30 * 60 * 1000;
  protected static _usedIds = new Set<string>();
  protected static MATRIX: WordKind[] = [
    'black',
    'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red',
    'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue',
    'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral', 'neutral',
  ];
  protected static MATRIX_RED_COUNT = Game.MATRIX.filter(w => w === 'red').length;
  protected static MATRIX_BLUE_COUNT = Game.MATRIX.filter(w => w === 'blue').length;

  private _startedAt: Date;
  private _name: string;
  private _players: Player[];
  private _currentWords: Word[];
  private _turn: number;
  private _guesses: Guess[];
  private _timeout?: NodeJS.Timeout;
  private _onEnd?: Function;

  private _redSpy?: Player;
  private _blueSpy?: Player;

  get name(): string { return this._name; }
  get teamDefined(): boolean { return this._players.map(p => p.teamChosen).reduce((acc, val) => acc && val, true) }
  get readyToStart(): boolean { return this._players.map(p => p.readyToStart).reduce((acc, val) => acc && val, true) }
  get started(): boolean { return this._turn > 0; }

  set onEnd(fn: Function) { this._onEnd = fn; }

  get redSpy(): Player {
    if (!this._redSpy) {
      this._redSpy = this.redTeam.find(p => p.isSpyMaster)!;
    }
    return this._redSpy!;
  }

  get blueSpy(): Player {
    if (!this._blueSpy) {
      this._blueSpy = this.blueTeam.find(p => p.isSpyMaster)!;
    }
    return this._blueSpy!;
  }

  get redTeam(): Player[] { return this._players.filter(p => p.team === 'red'); }
  get blueTeam(): Player[] { return this._players.filter(p => p.team === 'blue'); }

  get publicBoard(): Partial<Word>[] {
    return this._currentWords
      .map(({ kind, revealed, ...keep }) => ({
        ...keep,
        revealed,
        ...(revealed ? { kind } : {}),
      })
    );
  }
  get spyBoard(): Partial<Word>[] { return this._currentWords; }

  constructor() {
    this._startedAt = new Date(),
    this._name = Game.createID();
    Game._usedIds.add(this._name);
    this._currentWords = this.generateBoard();
    this._players = [];
    this._turn = 0;
    this._guesses = [];
    this.refreshTimeout();
  }

  end(): void {
    Game._usedIds.delete(this._name);
    this._onEnd && this._onEnd();
    this._turn = -1;
    this.broadcast({ action: 'end' });
    this._players.forEach(p => p.close());
  }

  generateBoard(): Word[] {
    const spyMatrix = Game.getRandomArray(Game.MATRIX, Game.MATRIX.length);
    return Game.getRandomArray(words, Game.MATRIX.length)
      .map((word, index) => ({ index, word, kind: spyMatrix[index], revealed: null }));
  }

  add(player: Player) {
    if (this._players.find(p => p === player)) return;
    this._players.push(player);

    player.team = this.redTeam.length > this.blueTeam.length ? 'blue' : 'red';
    player.onRecycledPlayer = () => this.onRecyclePlayer(player);
    this.broadcastPlayers();
  }

  hasPlayer(player: Player): boolean {
    return this._players.includes(player);
  }

  /** When a player has been recycled, we need to send data to restore his local state */
  onRecyclePlayer(player: Player): void {
    if (!this.started) {
      player.error('Not supported action: recycling player on non started game');
      return;
    }

    // We give the name of the instance
    player.send({ action: 'join', payload: this.name });

    // We call start again to broadcast players and board
    this.start(true);
  }

  handle(player: Player, action: HandleAction, payload: any): void {
    this.refreshTimeout();

    if (!this.teamDefined) {
      if (isPreAction(action)) {
        this.handlePreAction(player, action, payload);
      } else {
        player.invalidAction();
      }
    } else if (!this.started) {
      if (isSpyElectionAction(action)) {
        this.handleSpyElectionAction(player, action, payload);
      } else {
        player.invalidAction();
      }
    } else if (player.isSpyMaster) {
      if (isSpyAction(action)) {
        this.handleSpyAction(player, action, payload);
      } else {
        player.invalidAction();
      }
    } else {
      if (isGameAction(action)) {
        this.handleGameAction(player, action, payload);
      } else {
        player.invalidAction();
      }
    }
  }

  protected handlePreAction(player: Player, action: HandlePreAction, payload: any): void {
    if (action === HandlePreAction.team) {
      player.team = payload;
      this.broadcastPlayers();
      return;
    }

    if (action === HandlePreAction.ok) {
      player.teamChosen = true;
      this.broadcastPlayers();
      return;
    }
  }

  protected handleSpyElectionAction(player: Player, action: HandleSpyElectionAction, payload: any): void {
    if (action === HandleSpyElectionAction.master) {
      player.wantsToSpy = payload;
      this.broadcastPlayers();
      return;
    }

    if (action === HandleSpyElectionAction.start) {
      player.readyToStart = true;
      this.broadcastPlayers();
      if (this.readyToStart && this.blueTeam.some(p => p.wantsToSpy) && this.redTeam.some(p => p.wantsToSpy)) {
        this.start();
      }
      return;
    }
  }

  protected handleSpyAction(player: Player, action: HandleSpyAction, payload: any): void {
    if (this.getTeamTurn() !== player.team || this._turn === this._guesses.length) {
      player.error('Not your turn');
      return;
    }

    if (action === HandleSpyAction.tell) {
      const guess = {
        word: payload.word,
        occ: payload.occ,
        attempts: [],
        team: player.team,
      };
      this._guesses.push(guess);
      this.broadcast({ action: 'guess', payload: guess });
      return;
    }
  }

  protected handleGameAction(player: Player, action: HandleGameAction, payload: any): void {
    if (this.getTeamTurn() !== player.team || this._turn !== this._guesses.length) {
      player.error('Not your turn');
      return;
    }

    const guess = this._guesses[this._guesses.length - 1];

    if (action === HandleGameAction.hover) {
      player.error('Not supported');
      return;
    }

    if (action === HandleGameAction.select) {
      const word = this._currentWords[payload.index];
      word.revealed = player.team;
      const success = word.kind === player.team;
      guess.attempts.push({ index: payload.index, success });

      this.broadcastWord(word, success);

      if (word.kind === 'black' || this.isComplete()) {
        this.end();
        return;
      }

      if (!success || guess.attempts.length === guess.occ) {
        this._turn += 1;
        this.broadcastEndOfTurn();
      }
    }

    if (action === HandleGameAction.pass) {
      this._turn += 1;
      this.broadcastEndOfTurn();
    }
  }

  protected start(repeat: boolean = false): void {
    // Elect spy master
    this.redTeam.find(p => p.wantsToSpy)!.isSpyMaster = true;
    this.blueTeam.find(p => p.wantsToSpy)!.isSpyMaster = true;
    this.broadcastPlayers();

    // Send words to players
    this._players.filter(p => !p.isSpyMaster).forEach(p => p.send({ action: 'board', payload: this.publicBoard }));
    
    // Send words+def to spies
    const wordsWithDef = this.spyBoard;
    this.redSpy.send({ action: 'board', payload: wordsWithDef });
    this.blueSpy.send({ action: 'board', payload: wordsWithDef });

    // Start game
    if (!repeat) {
      this._turn = 1;
    }

    // Broadcast start action
    this.broadcast({
      action: 'start',
      payload: {
        score: this.score(),
        turn: this._turn,
        repeat,
      }
    });
  }

  protected getTeams(player: Player): [Player[], Player[]] {
    const hisTeam = player.team === 'red' ? this.redTeam : this.blueTeam;
    const otherTeam = player.team === 'red' ? this.blueTeam : this.redTeam;
    return [hisTeam, otherTeam];
  }

  protected getTeamTurn(): Team {
    return this._turn % 2 ? 'red' : 'blue';
  }

  protected score(): [number, number] {
    const blackRevealed = this._currentWords.find(w => w.kind === 'black')!.revealed;

    return [
      blackRevealed === 'red' ? 0 : this._currentWords.filter(w => w.kind === 'red' && w.revealed).length,
      blackRevealed === 'blue' ? 0 : this._currentWords.filter(w => w.kind === 'blue' && w.revealed).length,
    ];
  }

  /** Determine if game is finished */
  protected isComplete(): boolean {
    const [red, blue] = this.score();
    return red === Game.MATRIX_RED_COUNT || blue === Game.MATRIX_BLUE_COUNT;
  }

  protected broadcast(msg: { action: string, payload?: any }): void {
    this._players.forEach(p => {
      p.send(msg);
    });
  }

  protected broadcastPlayers(): void {
    this.broadcast({ action: 'players', payload: this._players.map(p => p.toJSON()) });
  }

  protected broadcastWord(word: Word, success: boolean): void {
    this.broadcast({ action: 'reveal', payload: {
      index: word.index,
      kind: word.kind,
      revealed: word.revealed,
      score: this.score(),
      turn: this._turn,
      success
    }})
  }

  protected broadcastEndOfTurn(): void {
    this.broadcast({ action: 'turn', payload: { turn: this._turn } });
  }

  protected refreshTimeout(): void {
    this._timeout && clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      this.broadcast({ action: 'timeout' });
      this.end();
    }, Game.TIMEOUT);
  }

  toJSON(): any {
    return {
      name: this._name,
      startedAt: this._startedAt,
      turn: this._turn,
      readyToStart: this.readyToStart,
      teamDefined: this.teamDefined,
      players: this._players.map(p => p.toJSON()),
    }
  }

  protected static createID(length: number = 5): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < length; i++) {
      id += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // If already used, we attempt a new one
    if (Game._usedIds.has(id)) {
      id = Game.createID(length);
    }

    return id;
  }

  protected static getRandomArray<T>(arr: T[], n: number): T[] {
    let result = new Array(n),
      len = arr.length,
      taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandomWords: more elements taken than available");
    while (n--) {
      let x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }
}

import Vue from 'vue'
import Vuex from 'vuex'
import {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
} from './mutation-types'

// export in proper file
const GAME_PSEUDO = 'GAME_PSEUDO';
const GAME_JOIN = 'GAME_JOIN';
const GAME_PLAYERS = 'GAME_PLAYERS';
const GAME_START = 'GAME_START';
const GAME_BOARD = 'GAME_BOARD';
const GAME_REVEAL = 'GAME_REVEAL';
const GAME_GUESS = 'GAME_GUESS';
const GAME_TURN = 'GAME_TURN';
const GAME_END = 'GAME_END';

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    count: 0,
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false,
    },
    game: {
      pseudo: '',
      isAdmin: false,
      instance: '',
      players: [],
      started: false,
      end: false,
      score: [0, 0],
      turn: 0,
      words: [],
      guesses: [],
    },
  },
  mutations: {
    increment (state) {
      state.count++
    },
    [SOCKET_ONOPEN](state) {
      state.socket.isConnected = true
    },
    [SOCKET_ONCLOSE](state) {
      state.socket.isConnected = false
    },
    [SOCKET_ONERROR](state, event) {
      console.error(state, event)
    },
    // default handler called for all methods
    [SOCKET_ONMESSAGE](state, message) {
      state.socket.message = message
    },
    // mutations for reconnect methods
    [SOCKET_RECONNECT](state, count) {
      console.info(state, count)
    },
    [SOCKET_RECONNECT_ERROR](state) {
      state.socket.reconnectError = true;
    },
    [GAME_PSEUDO](state, { pseudo, isAdmin = false }) {
      state.game.pseudo = pseudo;
      state.game.isAdmin = isAdmin;
    },
    [GAME_JOIN](state, name) {
      state.game.instance = name;
    },
    [GAME_PLAYERS](state, players) {
      state.game.players = players;
    },
    [GAME_START](state, { score, turn }) {
      state.game.started = true;
      state.game.score = score;
      state.game.turn = turn;
    },
    [GAME_BOARD](state, words) {
      state.game.words = words;
    },
    [GAME_REVEAL](state, data) {
      state.game.words[data.index].kind = data.kind;
      state.game.words[data.index].revealed = data.revealed;
      state.game.score = data.score;
      state.game.turn = data.turn;
    },
    [GAME_GUESS](state, guess) {
      state.game.guesses.push(guess);
    },
    [GAME_TURN](state, { turn }) {
      state.game.turn = turn;
    },
    [GAME_END](state) {
      state.game.end = true;
    }
  },
  actions: {
    sendMessage: function(context, message) {
      if (!context.state.socket.isConnected) {
        console.warn('Socket not connected');
        return;
      }
      Vue.prototype.$socket.sendObj(message)
    },
    error: function(ctx, { payload }) {
      window.alert(payload);
    },
    pseudo: function(ctx, { payload }) {
      ctx.commit(GAME_PSEUDO, payload);
    },
    create: function(ctx, { payload }) {
      ctx.commit(GAME_JOIN, payload);
    },
    join: function(ctx, { payload }) {
      ctx.commit(GAME_JOIN, payload);
    },
    players: function(ctx, { payload }) {
      ctx.commit(GAME_PLAYERS, payload);
    },
    start: function(ctx, { payload }) {
      ctx.commit(GAME_START, payload)
    },
    board: function(ctx, { payload }) {
      ctx.commit(GAME_BOARD, payload);
    },
    reveal: function(ctx, { payload }) {
      ctx.commit(GAME_REVEAL, payload);
    },
    guess: function(ctx, { payload }) {
      ctx.commit(GAME_GUESS, payload)
    },
    turn: function(ctx, { payload }) {
      ctx.commit(GAME_TURN, payload);
    },
    end: function(ctx) {
      ctx.commit(GAME_END);
    } 
  }
})

export default store;

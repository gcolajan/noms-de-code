import Vue from 'vue'
import VueNativeSock from 'vue-native-websocket'
import store from '../store'
import {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
} from '../mutation-types'
 
const mutations = {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
}

const address = window.location.hostname === 'localhost'
  ? 'ws://localhost:3030'
  : 'wss://home.gautiercolajanni.fr/spy.io';

Vue.use(VueNativeSock, address, {
  format: 'json',
  store: store,
  mutations: mutations
})

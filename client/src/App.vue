<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <span class="headline">Noms de code</span>
      </div>

      <v-spacer />

      <template v-if="!$store.state.socket.isConnected">
        Serveur déconnecté
      </template>

      <v-spacer/>

      <v-btn
        href="https://github.com/"
        target="_blank"
        text
      >
        <span class="mr-2">GitHub</span>
      </v-btn>
    </v-app-bar>

    <v-content>
      <Home v-if="$store.state.game.pseudo === ''" />
      <Debug v-else-if="$store.state.game.pseudo === 'debug'" />
      <GameJoin v-else-if="$store.state.game.instance === ''" />
      <GameTeam v-else-if="!$store.state.game.started" />
      <Game v-else />
    </v-content>
  </v-app>
</template>

<script>
import Home from './components/Home';
import Debug from './components/Debug';
import GameJoin from './components/GameJoin';
import GameTeam from './components/GameTeam';
import Game from './components/Game';

export default {
  name: 'App',

  components: {
    Home,
    Debug,
    GameJoin,
    GameTeam,
    Game
  },

  created() {
    document.title = 'Noms de code';
  },

  data: () => ({
    //
  }),
};
</script>

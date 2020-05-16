<template>
  <v-container
    class="fill-height"
    fluid
  >
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        sm="6"
      >
        Nom de l'instance: {{$store.state.game.instance}}

        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
          >
            <v-toolbar-title>Équipe rouge</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="text-center">
            <ul>
              <li v-for="player in redTeam" :key="player.name" :style="{ color: player.teamChosen ? 'red' : 'inherit' }">
                <strong v-if="player.name === $store.state.game.pseudo">
                  {{player.name}}
                </strong>
                <span v-else>
                  {{player.name}}
                </span>
                <span v-if="player.wantsToSpy">*</span>
                <span v-if="player.readyToStart">(!)</span>
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
          >
            <v-toolbar-title>Équipe bleue</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text class="text-center">
            <ul>
              <li v-for="player in blueTeam" :key="player.name" :style="{ color: player.teamChosen ? 'blue' : 'inherit' }">
                <strong v-if="player.name === $store.state.game.pseudo">
                  {{player.name}}
                </strong>
                <span v-else>
                  {{player.name}}
                </span>
                <span v-if="player.wantsToSpy">*</span>
                <span v-if="player.readyToStart">(!)</span>
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col class="text-center" v-if="readyToStart">
        La partie démarre quand tout le monde est prêt!
      </v-col>
      <v-col class="text-center" v-else>
        <template v-if="!currentPlayer.teamChosen">
          <v-btn color="tertiary" class="mx-2" @click="changeTeam">Changer d'équipe</v-btn>
          <v-btn color="primary" class="mx-2" @click="teamChosen">OK!</v-btn>
        </template>
        <template v-else>
          <v-btn color="secondary" class="mx-2" :disabled="!allTeamChosen" :outlined="currentPlayer.wantsToSpy" @click="wantsToSpy">{{currentPlayer.wantsToSpy ? 'Devenir un espion classique' : 'Devenir un maitre espion'}}</v-btn>
          <v-btn color="primary" class="mx-2" :disabled="!allTeamChosen || !spyOk" @click="validate">Démarrer la partie</v-btn>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    name: 'GameTeam',

    methods: {
      changeTeam: function() {
        const otherTeam = this.currentPlayer.team === 'red' ? 'blue' : 'red';
        this.$store.dispatch('sendMessage', { action: 'team', payload: otherTeam });
      },
      teamChosen: function() {
        this.$store.dispatch('sendMessage', { action: 'ok' });
      },
      wantsToSpy: function() {
        this.$store.dispatch('sendMessage', { action: 'master', payload: !this.currentPlayer.wantsToSpy });
      },
      validate: function() {
        this.$store.dispatch('sendMessage', { action: 'start' });
        this.readyToStart = true;
      }
    },

    computed: {
      redTeam() {
        return this.$store.state.game.players.filter(p => p.team === 'red');
      },
      blueTeam() {
        return this.$store.state.game.players.filter(p => p.team === 'blue');
      },
      allTeamChosen() {
        return this.$store.state.game.players
          .map(p => p.teamChosen)
          .reduce((acc, val) => acc && val, true);
      },
      spyOk: function() {
        return this.redTeam.some(p => p.wantsToSpy) && this.blueTeam.some(p => p.wantsToSpy);
      },
      currentPlayer() {
        return this.$store.state.game.players.find(p => p.name === this.$store.state.game.pseudo);
      }
    },

    data: () => ({
      pseudo: '',
      readyToStart: false,
    }),
  }
</script>

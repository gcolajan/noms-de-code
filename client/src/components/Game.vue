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
        cols="3"
        sm="3"
      >
        <ul class="players team-red text-right">
          <li v-for="player in redTeam" :key="player.name">
            {{player.name}}
          </li>
        </ul>
      </v-col>

      <v-col
        cols="4"
        sm="4"
      >
        <v-card class="text-center elevation-12 pa-6 font-weight-bold headline">
          <span :class="{
            'team-red': true,
            blink: teamTurn === 'red'
          }">{{$store.state.game.score[0]}}</span>
          :
          <span :class="{
            'team-blue': true,
            blink: teamTurn === 'blue'
          }">{{$store.state.game.score[1]}}</span>
        </v-card>
      </v-col>

      <v-col
        cols="3"
        sm="3"
      >
        <ul class="players team-blue">
          <li v-for="player in blueTeam" :key="player.name">
            {{player.name}}
          </li>
        </ul>
      </v-col>
    </v-row>

    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        sm="10"
      >
        <v-container v-if="$store.state.game.end" class="text-center font-weight-bold">
          Partie terminée !
        </v-container>

        <v-container v-if="isTeamTurn" class="text-center font-weight-bold">
          À votre tour, équipe {{frTeamTurn}} !
        </v-container>
        <v-container v-else class="text-center font-weight-bold">
          Équipe {{teamName}}, patientez, l'autre équipe joue !
        </v-container>

        <template v-if="!$store.state.game.end">
          <v-container v-if="currentPlayer.isSpyMaster">
            <p>Vous êtes le maître espion {{teamName}}.</p>

            <template v-if="isTeamTurn">
              <p v-if="this.guessGiven">
                Vous avez fourni l'indice, vos espions réflechissent !
              </p>
              <v-form @submit.prevent="giveIndice" id="clue-form" v-else>
                Vous devez fournir un indice ainsi que le nombre de mots qui s'y rapportent.
                <v-layout row wrap>
                  <v-flex>
                    <v-text-field
                      label="Indice"
                      name="tell"
                      type="text"
                      class="mx-3"
                      v-model="tell"
                      outline
                    />
                  </v-flex>
                  <v-flex >
                    <v-btn-toggle v-model="occurences" value="1" class="mx-3">
                      <v-btn v-for="i in [1,2,3,4,5,6]" :key="i" :value="i">{{i}}</v-btn>
                    </v-btn-toggle>
                    <v-btn color="primary" class="mx-3" type="submit" form="clue-form">
                      Donner l'indice
                    </v-btn> 
                  </v-flex>
                </v-layout>
              </v-form>
            </template>
            <template v-else>
              <p v-if="this.guessGiven">
                L'indice fourni est <strong>{{currentGuess.word}}</strong> ({{currentGuess.occ}}).
              </p>
              <p v-else>
                Le maître espion ennemi doit fournir un indice !
              </p>
            </template>
          </v-container>

          <v-container v-else>
            <template v-if="isTeamTurn">
              <p v-if="this.guessGiven">
                Décidez en équipe des {{currentGuess.occ}} mot(s) en lien avec: <strong>{{currentGuess.word}}</strong> 
              </p>
              <p v-else>
                Votre maître espion doit fournir un indice !
              </p>
            </template>
            <template v-else>
              <p v-if="this.guessGiven">
                L'indice fourni est <strong>{{currentGuess.word}}</strong> ({{currentGuess.occ}}).
              </p>
              <p v-else>
                Le maître espion ennemi doit fournir un indice !
              </p>
            </template>
          </v-container>
        </template>

        <v-container grid-list-xl align-center text-xs-center>
          <v-layout justify-center row wrap>
            <v-flex xs6 sm4 md3 xl2 class="lg5-custom" v-for="word in $store.state.game.words" :key="word.index">
              <v-card class="text-center elevation-4" @click="reveal(word.index)">
                <v-card-text :class="{ 
                  'word': true,
                  'word-neutral': word.kind === 'neutral',
                  'word-red': word.kind === 'red',
                  'word-blue': word.kind === 'blue',
                  'word-black': word.kind === 'black',
                  'word-revealed-neutral': word.revealed && word.kind === 'neutral',
                  'word-revealed-red': word.revealed && word.kind === 'red',
                  'word-revealed-blue': word.revealed && word.kind === 'blue',
                  'word-revealed-black': word.revealed && word.kind === 'black',
                 }">{{word.word}}</v-card-text>
              </v-card>
            </v-flex>
          </v-layout>
        </v-container>
      </v-col>
    </v-row>

    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="4"
        sm="4"
        class="text-center"
      >
        <v-btn :disabled="!isTeamTurn" @click="pass">
          Finir le tour
        </v-btn>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
  export default {
    name: 'Game',

    methods: {
      cardColor(word) {
        if (this.currentPlayer.isSpyMaster) {
          return word.kind;
        }

        if (!word.reveal) {
          return 'grey';
        }

        return word.reveal;
      },
      reveal: function(index) {
        this.$store.dispatch('sendMessage', { action: 'select', payload: { index } });
      },
      giveIndice: function() {
        this.$store.dispatch('sendMessage', { action: 'tell', payload: { word: this.tell, occ: this.occurences } });
        this.tell = '';
      },
      pass: function() {
        this.$store.dispatch('sendMessage', { action: 'pass' })
      }
    },

    computed: {
      currentPlayer() {
        return this.$store.state.game.players.find(p => p.name === this.$store.state.game.pseudo);
      },
      teamName() {
        return this.currentPlayer.team === 'red' ? 'rouge' : 'bleue';
      },
      currentGuess() {
        return this.$store.state.game.guesses[this.$store.state.game.guesses.length - 1];
      },
      teamTurn() {
        return this.$store.state.game.turn % 2 ? 'red' : 'blue';
      },
      frTeamTurn() {
        return this.$store.state.game.turn % 2 ? 'rouge' : 'bleue';
      },
      guessGiven() {
        return this.$store.state.game.turn === this.$store.state.game.guesses.length;
      },
      isTeamTurn() {
        return this.teamTurn === this.currentPlayer.team
      },
      canAttempt() {
        return this.isTeamTurn && this.guessGiven;
      },
      redTeam() {
        return this.$store.state.game.players.filter(p => p.team === 'red');
      },
      blueTeam() {
        return this.$store.state.game.players.filter(p => p.team === 'blue');
      },
    },

    data: () => ({
      tell: '',
      occurences: 1,
    })
  }
</script>

<style>
@media (min-width: 1264px) and (max-width: 1920px) {
    .flex.lg5-custom {
        width: 20%;
        max-width: 20%;
        flex-basis: 20%;
    }
}

.word {
  font-weight: bold;
  border: 4px solid rgb(87, 87, 87);
}

.team-red { color: #D70A0A }
.team-blue { color: #2590D7 }

.word-neutral { border-color: rgb(197, 155, 91);; }
.word-red { border-color: #D70A0A; }
.word-blue { border-color: #2590D7; }
.word-black { border-color: black; }

.word-revealed-neutral { background: rgb(197, 155, 91); }
.word-revealed-red { background: #D70A0A; }
.word-revealed-blue { background: #2590D7; }
.word-revealed-black { background: #2C2C2C; color: white; }

.word:hover {
  opacity: 0.8;
}

ul.players {
  list-style-type: none;
  padding-left: 0 !important;
}

.blink {
  animation: blinker 1.5s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0.1;
  }
}
</style>

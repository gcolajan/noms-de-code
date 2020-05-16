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
        sm="8"
        md="4"
      >
        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
          >
            <v-toolbar-title>Bonjour {{$store.state.game.pseudo}}!</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="text-center">
            <v-btn color="primary" @click="createGame">Créer une partie</v-btn>
          </v-card-text>

          <v-divider />
          
          <v-card-text>
            <v-form @submit.prevent="joinGame">
              <v-text-field
                label="Instance"
                name="instance"
                type="text"
                v-model="instance"
                @paste="joinPastedGame"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" @click="joinGame">Rejoindre</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    name: 'GameJoin',

    methods: {
      joinPastedGame: function(v) {
        setTimeout(() => {
          const pastedValue = v.srcElement.value;
          this.$store.dispatch('sendMessage', { action: 'join', payload: { name: pastedValue } });
        });
      },
      joinGame: function() {
        this.$store.dispatch('sendMessage', { action: 'join', payload: { name: this.instance } });
      },
      createGame: function() {
        this.$store.dispatch('sendMessage', { action: 'create' });
      }
    },

    data: () => ({
      instance: '',
    }),
  }
</script>

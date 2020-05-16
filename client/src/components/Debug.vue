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
            <v-toolbar-title>Debug</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="text-center">
            Players

            Game played: X
            Game playing:

            <v-btn color="primary" @click="createGame">Créer une partie</v-btn>
          </v-card-text>

        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    name: 'Debug',

    methods: {
      createGame: function() {
        this.$store.dispatch('sendMessage', { action: 'create' });
      }
    },

    data: () => ({
    }),
  }
</script>

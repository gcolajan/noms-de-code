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
            <v-toolbar-title>Connexion</v-toolbar-title>
          </v-toolbar>
          <v-form @submit.prevent="sendPseudo">
            <v-card-text>
                <v-text-field
                  label="Pseudo"
                  name="pseudo"
                  type="text"
                  v-model="pseudo"
                />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" type="submit" :disabled="!$store.state.socket.isConnected">Entrer</v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  // TODO: Easier to debug 
  const queryParams = document.location.search ? document.location.search.split('?')[1].split('&').reduce((acc, val) => {
    const splitted = val.split('=');
    return { ...acc, [splitted[0]]: splitted[1] };
  }, {}) : {};

  export default {
    name: 'Home',

    methods: {
      sendPseudo: function() {
        if (!this.$store.state.socket.isConnected) return;
        this.$store.dispatch('sendMessage', { action: 'pseudo', payload: { pseudo: this.pseudo } });
      }
    },

    data: () => ({
      pseudo: queryParams.name || '',
    }),

    mounted: function () {
      if (!this.pseudo) return;
      const connected = setInterval(() => {
        if (this.$store.state.socket.isConnected) {
          this.sendPseudo();
          clearInterval(connected);
        }
      }, 500);
    }
  }
</script>

import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import colors from 'vuetify/es5/util/colors'

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors.blueGrey.base,
        secondary: colors.pink.base,
        accent: colors.indigo.base,
        error: colors.deepOrange.base,
        warning: colors.amber.base,
        info: colors.lightBlue.base,
        success: colors.lightGreen.base
      }
    }
  }
});

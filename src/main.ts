import {createApp} from 'vue';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import {definePreset} from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';
import './style.css';
import App from './App.vue';




const tlpPreset = definePreset(Aura, {
  components: {
    card: {
      body: {
        padding: '0.75rem',
      },
    },
  },
});
console.log(tlpPreset);

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: tlpPreset,
    options: {
      prefix: 'p',
      darkModeSelector: 'system',
      cssLayer: false,
    },
  },
});
app.use(ConfirmationService);
app.use(ToastService);
app.directive('tooltip', Tooltip);
app.mount('#app');

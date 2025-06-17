import {createApp} from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
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
app.use(ToastService)
app.mount('#app');

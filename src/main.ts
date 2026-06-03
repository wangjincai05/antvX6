import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import { initDependencies } from '@/di/init';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

initDependencies();

app.mount('#app');

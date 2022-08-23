import { createApp } from './main';

const { app, router, store } = createApp();

const { initState } = window.Vise || {};
if (initState) {
  store.replaceState(initState);
}

// wait until router is ready before mounting to ensure hydration match
router.isReady().then(() => {
  app.mount('#app');
});

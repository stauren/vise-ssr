import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { createApp } from './main.tsx';
import { createStore } from '@/store';

const { initState } = window.Vise || {};

const store = createStore(initState);

const app = createApp({
  store,
  Router: BrowserRouter,
});

ReactDOM.hydrateRoot(document.getElementById('app')!, app);

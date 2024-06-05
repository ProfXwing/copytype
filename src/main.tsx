import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.scss';
import "@fontsource/roboto-mono";
import Router from './Router.tsx';

// import { invoke } from "@tauri-apps/api/tauri";

// document.addEventListener("DOMContentLoaded", () => {
//   invoke("close_splashscreen");
// });V

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);

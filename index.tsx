import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Expose React globally to resolve "Cannot read properties of null (reading 'useRef')"
// This is critical for libraries like Recharts in this CDN/ESM environment.
if (typeof window !== 'undefined') {
    (window as any).React = React;
    (window as any).ReactDOM = ReactDOM;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// --- ERROR SUPPRESSION ---
// This block prevents benign Chrome Extension errors from cluttering the console
// or falsely reporting "runtime.lastError" in the application context.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string') {
    const errorMsg = args[0];
    if (
      errorMsg.includes('runtime.lastError') || 
      errorMsg.includes('message port closed') ||
      errorMsg.includes('Extension context invalidated')
    ) {
      return; // Suppress
    }
  }
  originalConsoleError(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || '';
  if (msg.includes('message port closed') || msg.includes('Extension context invalidated')) {
      event.preventDefault(); // Stop propagation
  }
});
// -------------------------

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
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler to catch unhandled promises (often caused by extension message failures)
window.addEventListener('unhandledrejection', (event) => {
    // We filter out specific "Extension context invalidated" or "Message port closed" errors if needed,
    // though usually they don't even reach here. This ensures valid app errors are still logged.
    if (event.reason && event.reason.message && 
       (event.reason.message.includes('Extension context invalidated') || 
        event.reason.message.includes('message port closed'))) {
        event.preventDefault(); // Suppress specific extension noise
    }
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
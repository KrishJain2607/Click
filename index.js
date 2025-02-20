import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';
import ClickTracker from './ClickTracker.js';
import reportWebVitals from './reportWebVitals';
import ClickTrackerWrapper from './ClickTrackerWrapper.js';

const SERVER_URL = "http://localhost:1000/track-clickData"; // Change as needed

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClickTrackerWrapper serverURL={SERVER_URL}>
      <App />
    </ClickTrackerWrapper>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
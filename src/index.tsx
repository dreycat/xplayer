import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import './styles/index.css';
import './styles/global.css';
import './styles/variables.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

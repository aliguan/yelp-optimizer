import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Route } from 'react-router-dom';

require('dotenv').config();

ReactDOM.render(
    <Router>
        <div>
            <Route exact path="/" component={App}/>
        </div>
    </Router>
    , document.getElementById('root'));
registerServiceWorker();

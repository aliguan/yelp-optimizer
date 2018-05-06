import React, { Component } from 'react';
import PropTypes from 'prop-types'
// import logo from './logo.svg';
import './App.css';
import Userinput from './components/userinput.js';
import jquery from 'jquery';


class App extends Component {
    constructor(props) {
        super(props);
    }



  render() {
    return (
      <div className="App clearfix background-color">
        <Userinput />
      </div>
    );
  }
}

export default App;

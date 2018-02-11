import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Userinput from './components/userinput.js';
import GoogleApiWrapper from './components/googlemaps.js';
import './maps.css';
import jquery from 'jquery';

class App extends Component {
  render() {
    return (
      <div className="App">

        <GoogleApiWrapper/>

        <Userinput />
      </div>
    );
  }
}

export default App;

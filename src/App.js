import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Userinput from './components/userinput.js';
import YelpApiService from './components/yelpApiService.js'

class App extends Component {

  render() {
    return (
      <div className="App">
        <header className="App-header">

        </header>
        <Userinput />
        
      </div>
    );
  }
}

export default App;

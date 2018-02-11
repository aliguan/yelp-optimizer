import React, { Component } from 'react';
import PropTypes from 'prop-types'
import logo from './logo.svg';
import './App.css';
import Userinput from './components/userinput.js';
import GoogleApiWrapper from './components/googlemaps.js';
import './maps.css';
import jquery from 'jquery';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            itinLocations: []
        }

    this.handleLocations = this.handleLocations.bind(this);
    }

    handleLocations(locations) {
        this.setState({
            itinLocations: locations
        })
console.log(locations);
    }

  render() {
    return (
      <div className="App">

        <GoogleApiWrapper/>
        <Userinput getLocations={this.handleLocations} />
      </div>
    );
  }
}

export default App;

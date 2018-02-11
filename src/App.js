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
            itinLocations: [],
            itinUrls: []
        }

    this.handleData = this.handleData.bind(this);
    }

    handleData(locations, urls) {
        this.setState({
            itinLocations: locations,
            itinUrls: urls
        })
        console.log(this.state);
    }

  render() {
    return (
      <div className="App">

        <GoogleApiWrapper locations={this.state.itinLocations} urls={this.state.itinUrls}/>
        <Userinput getData={this.handleData} />
      </div>
    );
  }
}

export default App;

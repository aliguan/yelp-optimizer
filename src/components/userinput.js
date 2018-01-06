import React, { Component } from 'react'
import PropTypes from 'prop-types'
import YelpApiService from './yelpApiService.js'

class Userinput extends Component {
  constructor(props) {    
    super(props)
    this.state = {
        term: 'Chinese',
        budgetmax: '40',
        budgetmin: '35',
        location: 'Orlando',
        resultsArray: ['','','','','','','']
    };
    this.yelpApi = new YelpApiService(this.state.resultsArray);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    const state = this.state
    state[e.target.name] = e.target.value;
    this.setState(state);
  }

  handleSubmit(e) {
    e.preventDefault();

    // Geocoding to convert user location input into lat/lon
    var geocoder = require('../../node_modules/geocoder');
    geocoder.geocode(this.state.location, function (err, data) {
      // Check that there is data and results before constructing location lat long string
      if (data) {
        if (data.results) {
          // Construct lat/long string from geocoder from user input
          var locationLatLong = data.results[0].geometry.location.lat + ',' + data.results[0].geometry.location.lng;

          // Do API requests and return a promise object to display results
          // Probably need to change the yelpApi object name because this will end up being all the API requests (not just yelp)    
          var promiseObj = this.yelpApi.getRestaurantData(this.state.term, this.state.budgetmax, this.state.budgetmin, locationLatLong);
          promiseObj.then(function (data) {

            // Set the state in this component and re-render
            this.setState({ resultsArray: data.data });
          }.bind(this), function (err) {
            return err;
          }).catch(function (e) {
            console.log(e)
          });
        }
      }
    }.bind(this));



  }

  render() {
    var ITINERARY_LENGTH = 7;
    const { term, budgetmax, budgetmin, location } = this.state;
    var indents = [];
    for (var i = 0; i < ITINERARY_LENGTH; i++) {        
        indents.push(<div> {this.state.resultsArray[i]} <br/><br/></div>);
    }

    return (
      <div className="Userinput">
        <form onSubmit={this.handleSubmit}>
            <input type="text" name="term" style={{width: 90}} value={term} onChange={this.handleChange} />
            <input type="text" name="budgetmax" style={{width: 30}} value={budgetmax} onChange={this.handleChange} />
            <input type="text" name="budgetmin" style={{width: 30}} value={budgetmin} onChange={this.handleChange} />
            <input type="text" name="location" value={location} onChange={this.handleChange}/>
            <input type="submit" value="Submit" />            
        </form>
        <div><br/>
            {indents}
        </div>
      </div>

    )
  }
}

Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput

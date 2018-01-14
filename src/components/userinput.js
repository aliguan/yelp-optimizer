import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ApiService from './ApiService.js'
import DatePicker from 'react-datepicker';
import moment from 'moment';

import 'react-datepicker/dist/react-datepicker.css';

class Userinput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      term: 'Chinese',
      budgetmax: '40',
      budgetmin: '35',
      location: 'Orlando',
      resultsArray: ['', '', '', '', '', '', ''],
      startDate: moment()
    };
    this.apiService = new ApiService(this.state.resultsArray);
    this.handleChange = this.handleChange.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    const state = this.state
    state[e.target.name] = e.target.value;
    this.setState(state);
  }

  handleDateChange(e) {
    this.setState({
      startDate: e
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    // Check if state startDate is defined
    if (this.state.startDate) {
      // Convert the moment obj from the user input into a date object in javascript
      var date = this.state.startDate.toDate();
      var geocoder = require('../../node_modules/geocoder');
      if (isDate(date)) {
        console.log(date)

        // Geocoding to convert user location input into lat/lon
        geocoder.geocode(this.state.location, function (err, data_latlon) {
          // Check that there is data and results before constructing location lat long string
          if (data_latlon) {
            if (data_latlon.results) {
              // Construct lat/long string from geocoder from user input
              var lat = data_latlon.results[0].geometry.location.lat;
              var lon = data_latlon.results[0].geometry.location.lng;
              var locationLatLong = lat + ',' + lon;

              // Do reverse geocode to get the city from the lat long (for seat geek api call)
              // this offers robustness to the user input for the location
              geocoder.reverseGeocode(lat, lon, function (err, data_city) {
                if (data_city) {
                  if (data_city.results) {

                    var dataLength = data_city.results.length;
                    var city = this.state.location;

                    for (var i = 0; i < dataLength; i++) {
                      if (data_city.results[i].types) {
                        if (data_city.results[i].types[0] === "locality") {
                          if (data_city.results[i].address_components) {
                            city = data_city.results[i].address_components[0].long_name;
                            break;
                          }
                        }
                      }
                    }

                    // Do API requests and return a promise object to display results
                    var promiseObj = this.apiService.getData(this.state.term,
                      this.state.budgetmax,
                      this.state.budgetmin,
                      locationLatLong,
                      city,
                      date);
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
              }.bind(this))

            }
          }
        }.bind(this))

      }
    }


  }

  render() {
    var ITINERARY_LENGTH = 7;
    const { term, budgetmax, budgetmin, location } = this.state;
    var indents = [];
    for (var i = 0; i < ITINERARY_LENGTH; i++) {
      indents.push(<div> {this.state.resultsArray[i]} <br /><br /></div>);
    }

    return (
      <div className="Userinput">
        <form onSubmit={this.handleSubmit}>
          <DatePicker selected={this.state.startDate} onChange={this.handleDateChange} />
          <input type="text" name="term" style={{ width: 90 }} value={term} onChange={this.handleChange} />
          <input type="text" name="budgetmax" style={{ width: 30 }} value={budgetmax} onChange={this.handleChange} />
          <input type="text" name="budgetmin" style={{ width: 30 }} value={budgetmin} onChange={this.handleChange} />
          <input type="text" name="location" value={location} onChange={this.handleChange} />
          <input type="submit" value="Submit" />
        </form>
        <div><br />
          {indents}
        </div>
      </div>

    )
  }
}

// Check for a valid date from the user input
function isDate(d) {
  if (Object.prototype.toString.call(d) === "[object Date]") {
    // it is a date
    if (isNaN(d.getTime())) {  // d.valueOf() could also work
      // date is not valid
      return 0;
    }
    else {
      // date is valid
      return 1;
    }
  }
  else {
    // not a date
    return 0;
  }
}

Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ApiService from './ApiService.js'
import DatePicker from 'react-datepicker';
import moment from 'moment';
import genAlgo from '../GA.js'
import idb_keyval from 'idb-keyval'

import 'react-datepicker/dist/react-datepicker.css';

class Userinput extends Component {
  constructor(props) {
    super(props)

    this.state = {
      term: 'Chinese',
      budgetmax: '140',
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
    console.clear();
    var myStorage = window.localStorage;
    var doAPICallsFlag = true;
    var indexDBcompat = window.indexedDB;

    // Check if state startDate is defined
    if (this.state.startDate) {

      // Convert the moment obj from the user input into a date object in javascript
      var date = this.state.startDate.toDate(); // This does not change if the date selected in the UI does change
      // It is fixed to the timestamp at the first time the date is selected in the UI.
      var today = moment();

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

                    // find the city portion of the data
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

                    // Determine whether or not API calls need to be made
                    doAPICallsFlag = determineAPICallBool(myStorage, this.state.startDate, today, locationLatLong, indexDBcompat);

                    if (doAPICallsFlag) {
                      console.log("Do API calls!!!")
                      // Do API requests and return a promise object to display results
                      var promiseObj = this.apiService.getData(this.state.term,
                        locationLatLong,
                        city,
                        date);
                      promiseObj.then(function (data) {

                        // Do optimization to find locally "best" itinerary
                        var optimItinerary = genAlgo.doGA(data.data, this.state.budgetmax, this.state.budgetmin);

                        // Set the state in this component and re-render
                        this.setState({ resultsArray: optimItinerary });

                        // Put the data returned from API calls (yelp, meetup, etc) into the client's browser
                        // for persistent storage
                        if (indexDBcompat) {
                          idb_keyval.set('apiData', data.data)
                            .then(function (e) {
                              idb_keyval.get('apiData').then(val => console.log(val));
                            })
                            .catch(err => console.log('It failed!', err));
                        }

                      }.bind(this), function (err) {
                        return err;
                      }).catch(function (e) {
                        console.log(e)
                      }); //end then

                    }
                    // No need to do the API calls from yelp, meetup, etc because inputs (date and location)
                    // have not changed. The 
                    else {
                      console.log("No need to do API calls!!!")
                      if (indexDBcompat) {
                        idb_keyval.get('apiData').then(val => {
                          // Do optimization to find locally "best" itinerary
                          var optimItinerary = genAlgo.doGA(val, this.state.budgetmax, this.state.budgetmin);

                          // Set the state in this component and re-render
                          this.setState({ resultsArray: optimItinerary });
                        }
                        );
                    }
                    }


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

// Returns true if locally stored data is "stale" or at a different location therefore new API calls 
// need to be made
function determineAPICallBool(myStorage_in, date_in, today_in, latLon_in, indexDBcompat_in) {
  if (myStorage_in && indexDBcompat_in) {

    var isToday;
    if (date_in.toDate().getDate() === today_in.toDate().getDate()) {
      if (date_in.toDate().getMonth() === today_in.toDate().getMonth()) {
        if (date_in.toDate().getFullYear() === today_in.toDate().getFullYear()) {
          isToday = true;
          console.log("Today is the same date as input")
        }
      }
    }
    else {
      console.log("Today is NOT the same date as input")
      isToday = false;
    }

    //Check Date and time
    var dateTimeIsStale = false;
    if (isToday) {
      // If the field localStoredDateTime is NOT null, check if it's old
      if (null !== myStorage_in.getItem('localStoredDateTime')) {
        var locStoredDateTimeStr = myStorage_in.getItem('localStoredDateTime');
        var localStoredTimeMoment = moment(locStoredDateTimeStr);
        if (xHoursPassed(today_in, locStoredDateTimeStr, 2)) {
          // Yes, 2 hours have passed. Reset the localStoredDateTime to the current time
          myStorage_in.setItem('localStoredDateTime', today_in.format());
          dateTimeIsStale = true;
        }
        else if ((today_in.toDate().getDate() !== localStoredTimeMoment.toDate().getDate()) ||
          (today_in.toDate().getMonth() !== localStoredTimeMoment.toDate().getMonth()) ||
          (today_in.toDate().getFullYear() !== localStoredTimeMoment.toDate().getFullYear())) {

          myStorage_in.setItem('localStoredDateTime', today_in.format());
          dateTimeIsStale = true;
        }
      }
      // If the field localStoredDateTime is null, set it equal to current time
      else {
        myStorage_in.setItem('localStoredDateTime', today_in.format());
        dateTimeIsStale = true;
      }
    }
    else {
      if (null !== myStorage_in.getItem('localStoredDateTime')) {
        var localStoredTimeMoment = moment(myStorage_in.getItem('localStoredDateTime'));
        if ((date_in.toDate().getDate() !== localStoredTimeMoment.toDate().getDate()) ||
          (date_in.toDate().getMonth() !== localStoredTimeMoment.toDate().getMonth()) ||
          (date_in.toDate().getFullYear() !== localStoredTimeMoment.toDate().getFullYear())) {

            console.log("date: " + date_in.toDate().getDate()+"/" + date_in.toDate().getMonth()+"/" + date_in.toDate().getFullYear())
            console.log("loca: " + localStoredTimeMoment.toDate().getDate()+"/" + localStoredTimeMoment.toDate().getMonth()+"/" + localStoredTimeMoment.toDate().getFullYear())
            myStorage_in.setItem('localStoredDateTime', date_in.format());
          dateTimeIsStale = true;
        }
      }
      else {
        myStorage_in.setItem('localStoredDateTime', date_in.format());
        dateTimeIsStale = true;
      }
    }


    //Check lat lon
    var latLonIsDifferent = false;
    // If the field localStoredLatLon is NOT null, check if it's different from the current lat lon input from user
    if (null !== myStorage_in.getItem('localStoredLatLon')) {
      if ((myStorage_in.getItem('localStoredLatLon')).localeCompare(latLon_in) !== 0) { // 0 indicates the strings are exact matches
        myStorage_in.setItem('localStoredLatLon', latLon_in);
        latLonIsDifferent = true;
      }
    }
    // If the field localStoredLatLon is null, set it equal to current lat lon location
    else {
      myStorage_in.setItem('localStoredLatLon', latLon_in);
      latLonIsDifferent = true;
    }

    // Return the proper flag
    if (dateTimeIsStale || latLonIsDifferent) {
      return true; // do the API calls!
    }
    else {
      return false; // don't the API calls because data is already stored locally and a previous 
                    // API call was made
    }
  }
  else {
    return true; // do the API calls!
  }
}


// Determine if the locally stored time stamp (which is a string produced by a moment using the format() method)
// is older than X amount of hours compared to the current time. If so, return true. Else false
function xHoursPassed(currentDateTimeMoment, locallyStoredDateTimeStr, elapsedHours) {
  var locStoredDateTimePlusXHours = moment(locallyStoredDateTimeStr).add(elapsedHours, 'hours');
  return currentDateTimeMoment.isAfter(locStoredDateTimePlusXHours.format());
}


Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput

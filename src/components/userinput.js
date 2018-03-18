import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ApiService from './ApiService.js'
import DatePicker from 'react-datepicker';
import moment from 'moment';
import genAlgo from '../GA.js'
import idb_keyval from 'idb-keyval'
import globalStyles from '../App.css'
import GoogleApiWrapper from './googlemaps.js';
import '../maps.css';

import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import misc from '../miscfuncs/misc.js'


class Userinput extends Component {
  constructor(props) {
    super(props)

    this.state = {
      term: '',
      budgetmax: 600,
      budgetmin: 0,
      location: 'San Francisco, CA',
      resultsArray: [],
      startDate: moment(),
      savedEvents: [], // acutal indices of the user saved events
      eliminatedEvents: [], // indices of the user eliminated itinerary slots (0-6)
      checked: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in user saved events
      eliminated: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in eliminating itinerary slots
      eventFilterFlags: [1, 1, 1, 1], // ordered left to right: meetup, eventbrite, seatgeek, google places
      totalCost: 0,
      expanded: true,
      options: false,
      itinLocations: [],
      itinUrls: [],
      center: {},
    };
    this.apiService = new ApiService();
    this.handleChange = this.handleChange.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleEliminate = this.handleEliminate.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
    this.handleMoreOptions = this.handleMoreOptions.bind(this);
    this.handleData = this.handleData.bind(this);

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

  handleFilter(e) {
    // If the checkbox is checked, add the checkbox index to the states
    let eventFilterFlags = this.state.eventFilterFlags.slice();
    if (e.target.checked) {
      eventFilterFlags[e.target.value] = 1;
      this.setState({ eventFilterFlags: eventFilterFlags });
    }
    // If the checkbox is unchecked, find and remove the checkbox index from the states
    else {
      eventFilterFlags[e.target.value] = 0;
      this.setState({ eventFilterFlags: eventFilterFlags });
    }
  }

  handleCheckbox(e) {
    // If the checkbox is checked, add the checkbox index to the states
    let checked = this.state.checked.slice();
    if (e.target.checked) {
      this.state.savedEvents.push(e.target.value);   // e.target.value should be an integer value
      // from 0 to 6 inclusive
      checked[e.target.value] = 1;
      this.setState({ checked: checked });
    }
    // If the checkbox is NOT checked, find and remove the checkbox index from the states
    else {
      var index = this.state.savedEvents.indexOf(e.target.value); // e.target.value should be an integer value
      // from 0 to 6 inclusive
      if (index > -1) {
        this.state.savedEvents.splice(index, 1);
        checked[e.target.value] = 0;
        this.setState({ checked: checked });
      }
    }
  }

  handleEliminate(e) {
    // If the checkbox is checked, add the checkbox index to the states
    let eliminated = this.state.eliminated.slice();
    if (e.target.checked) {
      this.state.eliminatedEvents.push(e.target.value);   // e.target.value should be an integer value
      // from 0 to 6 inclusive
      eliminated[e.target.value] = 1;
      this.setState({ eliminated: eliminated });
    }
    // If the checkbox is unchecked, find and remove the checkbox index from the states
    else {
      var index = this.state.eliminatedEvents.indexOf(e.target.value); // e.target.value should be an integer value
      // from 0 to 6 inclusive
      if (index > -1) {
        this.state.eliminatedEvents.splice(index, 1);
        eliminated[e.target.value] = 0;
        this.setState({ eliminated: eliminated });
      }
    }
  }

  handleExpand(e) {
    this.setState(prevState => ({
      expanded: !prevState.expanded
    }));
  }

  handleMoreOptions(e) {
    this.setState(prevState => ({
      options: !prevState.options
    }));
  }

  handleData(locations, urls, center) {
      this.setState({
          itinLocations: locations,
          itinUrls: urls,
          center: center
      })
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

      var geocoder = require('geocoder');
      if (isDate(date)) {
        //console.log(date)

        // Geocoding to convert user location input into lat/lon
        geocoder.geocode(this.state.location, function (err, data_latlon) {
          // Check that there is data and results before constructing location lat long string
          if (data_latlon) {
            if (data_latlon.results) {
              // Construct lat/long string from geocoder from user input
              var lat = data_latlon.results[0].geometry.location.lat;
              var lon = data_latlon.results[0].geometry.location.lng;
              var locationLatLong = lat + ',' + lon;
              var mapCenter = {
                lat: data_latlon.results[0].geometry.location.lat,
                lng: data_latlon.results[0].geometry.location.lng
              };

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
                        date,
                        date.toString());
                      promiseObj.then(function (data) {

                        // Set saved events to empty because if an API call is needed, this means
                        // the event data has changed. It doesn't make sense to use the previously
                        // saved events selected by the user.
                        var savedEvents = [];
                        var eliminatedEvents = [];
                        var bestItineraryIndicesParsed = [];
                        var bestItineraryObjsParsed = [];

                        // Preprocess data for genetic algo
                        var dataForGA = processAPIDataForGA(data.data, this.state.eventFilterFlags, savedEvents, bestItineraryObjsParsed);

                        // Do optimization to find locally "best" itinerary
                        var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, eliminatedEvents);

                        // Construct output for display (aray of objects in correct itinerary order)
                        var resultsArrayOutput = [dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]], //Event 1
                          dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]], //Breakfast
                          dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],//Event 2
                          dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]], //Lunch
                          dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],//Event 3
                          dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]], //Dinner
                          dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]] ];//Event 4

                        resultsArrayOutput = convertTimeToAMPM(resultsArrayOutput);

                        // Output data to map
                        this.handleData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);

                        // Set the state in this component and re-render
                        this.setState({
                          resultsArray: resultsArrayOutput,
                          savedEvents: savedEvents,
                          checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                          eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                          eliminatedEvents: eliminatedEvents,
                          totalCost: optimItinerary.totalCost,
                        });

                        this.setState(prevState => ({
                          expanded: !prevState.expanded
                        }));

                        // Save the user saved events into persistent memory client side
                        var prevBestItineraryObjs = JSON.stringify({
                          Event1: dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]],
                          Breakfast: dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]],
                          Event2: dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],
                          Lunch: dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]],
                          Event3: dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],
                          Dinner: dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]],
                          Event4: dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]],
                        });

                        var prevBestItineraryStr = JSON.stringify(optimItinerary.bestItineraryIndices);
                        myStorage.setItem("prevBestItinerarySavedIndices", prevBestItineraryStr);
                        myStorage.setItem("prevBestItinerarySavedObjects", prevBestItineraryObjs);

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
                    // have not changed.
                    else {
                      console.log("No need to do API calls!!!")
                      if (indexDBcompat) {
                        idb_keyval.get('apiData').then(val => {

                          // Save the previously saved events by the user as persistent data in
                          // client side as a string
                          var savedEvents = [];
                          if (this.state.savedEvents.length > 0 && null !== myStorage.getItem('prevBestItinerarySavedIndices') && null !== myStorage.getItem('prevBestItinerarySavedObjects')) {
                            var bestItineraryIndicesParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedIndices"));
                            var bestItineraryObjsParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedObjects"));
                            savedEvents = this.state.savedEvents.map(Number);
                          }

                          // Get which itinerary items/events are eliminated and not used in the GA (ie the user wants the
                          // item/event set to "none/free itinerary item")
                          var eliminatedEvents = this.state.eliminatedEvents.map(Number);

                          // Preprocess data for genetic algo
                          var dataForGA = processAPIDataForGA(val, this.state.eventFilterFlags, savedEvents, bestItineraryObjsParsed);

                          // Do optimization to find locally "best" itinerary
                          var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, eliminatedEvents);

                          // Construct output for display (aray of objects in correct itinerary order)
                          var resultsArrayOutput = [dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]], //Event 1
                          dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]], //Breakfast
                          dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],//Event 2
                          dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]], //Lunch
                          dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],//Event 3
                          dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]], //Dinner
                          dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]] ];//Event 4

                          resultsArrayOutput = convertTimeToAMPM(resultsArrayOutput);

                          if (optimItinerary.bestItineraryIndices[0] === -1) { // No itinerary was found/ error occurred
                            // reset stuff
                            this.setState({
                              resultsArray: [],
                              checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                              eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                              totalCost: optimItinerary.totalCost,
                              savedEvents: [],
                              eliminatedEvents: [],
                              totalCost: 0,
                            });
                          }
                          else { // An itinerary was found and presumably no errors occured
                            // Save the user saved events into persistent memory client side
                            var prevBestItineraryObjs = JSON.stringify({
                              Event1: dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]],
                              Breakfast: dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]],
                              Event2: dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],
                              Lunch: dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]],
                              Event3: dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],
                              Dinner: dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]],
                              Event4: dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]],
                            });

                            var prevBestItineraryStr = JSON.stringify(optimItinerary.bestItineraryIndices);
                            myStorage.setItem("prevBestItinerarySavedIndices", prevBestItineraryStr);
                            myStorage.setItem("prevBestItinerarySavedObjects", prevBestItineraryObjs);

                            console.log(optimItinerary.bestLocations)
                            this.handleData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);

                            // Set the state in this component and re-render
                            this.setState({
                              resultsArray: resultsArrayOutput,
                              totalCost: optimItinerary.totalCost,
                            });
                          }

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
    var formStyles = ['form-body'];
    var optionStyles = ['more-options'];

    if (this.state.resultsArray.length > 0 || this.state.expanded == false) {
      formStyles.push('hidden');
    }

    if (this.state.resultsArray.length > 0 && this.state.expanded == true) {
      formStyles = ['form-body'];
    }

    if (this.state.options == false) {
      optionStyles.push('hidden');
    } else {
      optionStyles = ['more-options'];
    }


    var ITINERARY_LENGTH = this.state.resultsArray.length;
    const { term, budgetmax, budgetmin, location } = this.state;
    var indents = [];
    // Only allow check boxes to show up if data can be saved client side
    if (window.indexedDB) {
        for (var i = 0; i < ITINERARY_LENGTH; i++) {
            indents.push(
                <tr className="itinContainer">
                    <td><input checked={this.state.checked[i]} onChange={this.handleCheckbox} type='checkbox' value={i} /></td>
                    <td><strong>{this.state.resultsArray[i].time ? this.state.resultsArray[i].time : ''}</strong></td>
                    <td><a href={this.state.resultsArray[i].url}>{this.state.resultsArray[i].name} </a></td>
                    <td className="text-success"><strong>${this.state.resultsArray[i].cost}</strong>  </td>
                    <td><input checked={this.state.eliminated[i]} onChange={this.handleEliminate} type='checkbox' value={i} /></td>
                    <hr></hr>
                </tr>
            );
        }
    }
    else {
      for (var i = 0; i < ITINERARY_LENGTH; i++) {
          indents.push(
              <tr className="itinContainer">
                  <td><input checked={this.state.checked[i]} onChange={this.handleCheckbox} type='checkbox' value={i} /></td>
                  <td><strong>{this.state.resultsArray[i].time ? this.state.resultsArray[i].time : ''}</strong></td>
                  <td><a href={this.state.resultsArray[i].url}>{this.state.resultsArray[i].name} </a></td>
                  <td className="text-success"><strong>${this.state.resultsArray[i].cost}</strong>  </td>
                  <td><input checked={this.state.eliminated[i]} onChange={this.handleEliminate} type='checkbox' value={i} /></td>
                  <hr></hr>
              </tr>
          );
      }
    }

    var total = [];
    total.push(<div><b>Total Cost: ${this.state.totalCost} </b></div>)

    var options = [];
    const NUM_EVENT_APIS = 4;
    var filters = [];
    var filterNames = ["Meetup", "Eventbrite", "Seatgeek","Local Parks"];
    for (var i = 0; i < NUM_EVENT_APIS; i++) {
      options.push(<li>
        <input checked={this.state.eventFilterFlags[i]} onChange={this.handleFilter} type='checkbox' value={i} />{filterNames[i]}
      </li>);
    }


    return (
      <div className="Userinput">
        <form className="form-card" onSubmit={this.handleSubmit}>
          <h4 className="form-header">Plan Your Trip</h4>
          <div className={formStyles.join(' ')}>
              <div className="row">
                  <div className="col-md-5 form-group mb-2">
                    <span class="plane-icon fas fa-plane"></span>
                    <input required id="location" className="textInput" type="text" name="location" value={location} onChange={this.handleChange} autocomplete="address-level2" placeholder="Where are you going?" />
                  </div>

                  <div className="col-md-3 form-group mb-2 datePickerWrapper">
                    <label htmlFor="datePicker"></label>
                    <DatePicker required id="datePicker" className="textInput" selected={this.state.startDate} onChange={this.handleDateChange} />
                  </div>
              {/*<input type="text" name="term" style={{ width: 90 }} value={term} onChange={this.handleChange} />*/}
                <div className="col-md-2 form-group mb-2">
                    <input required className="textInput" type="number" min="0" name="budgetmin" value={budgetmin} onChange={this.handleChange} placeholder="$ Min" />
                </div>
                <div className="col-md-2 form-group mb-2">
                    <input required className="textInput" min="0" type="number" name="budgetmax" value={budgetmax} onChange={this.handleChange} placeholder="$ Max" />
                </div>
              </div>



            <div className="results">
              <a href="javascript:void(0)" onClick={this.handleMoreOptions}> {this.state.options == false ? 'More Options' : 'Less Options'} <i className="fas fa-sort-down"></i></a>
            </div>

            <div className={optionStyles.join(' ')}>

              <h5>Include results from: </h5>
              <ul className="options">
                {options}
              </ul>
            </div>
          </div>

          <input className="btn btn-danger btn-md go-btn" type="submit" value={this.state.expanded == true ? 'GO!' : 'Find Again'} />
          <div className="results">
            <p>
              <a href="javascript:void(0)" onClick={this.handleExpand}> {this.state.expanded == true ? '' : 'Change Search'}
              </a>
            </p>
          </div>
        </form>
        <div className="container-fluid">
            <div className="row">
                <div class="col-md-6">

                    <table >
                        {indents}
                    </table>

                    <div class="totalCost">
                        {total}
                    </div>
                </div>
                <div class="mapsfix col-md-6">
                    <GoogleApiWrapper locations={this.state.itinLocations} urls={this.state.itinUrls} center={this.state.center}/>
                </div>
            </div>
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
  if (myStorage_in) { //} && indexDBcompat_in) {

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

          console.log("date: " + date_in.toDate().getDate() + "/" + date_in.toDate().getMonth() + "/" + date_in.toDate().getFullYear())
          console.log("loca: " + localStoredTimeMoment.toDate().getDate() + "/" + localStoredTimeMoment.toDate().getMonth() + "/" + localStoredTimeMoment.toDate().getFullYear())
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


function processAPIDataForGA(events_in, eventFilterFlags_in, savedEvents_in, savedEventsObjs_in) {

  // Define whether or not user choose to save an event or restaurant to eat at
  // savedEvents_in is the indices of the saved events [0-6]
  // savedEventsObj_in is that actual data of the event/restaurant (name, url, cost, etc)
  var savedUserInputs = false;
  if (savedEvents_in.length > 0 && savedEventsObjs_in) {
    savedUserInputs = true;
  }

  // Assigning to some variables
  var meetupItemsGlobal = events_in.meetupItemsGlobal;
  var yelpEventsGlobal = events_in.yelpEventsGlobal;
  var eventbriteGlobal = events_in.eventbriteGlobal;
  var seatgeekItemsGlobal = events_in.seatgeekItemsGlobal;
  var googlePlacesGlobal = events_in.googlePlacesGlobal;
  var yelpBreakfastItemsGlobal = events_in.yelpBreakfastItemsGlobal;
  var yelpLunchItemsGlobal = events_in.yelpLunchItemsGlobal;
  var yelpDinnerItemsGlobal = events_in.yelpDinnerItemsGlobal;

  // Determine how many data points there are
  var numMeetupEvents = meetupItemsGlobal.Event1.length +
    meetupItemsGlobal.Event2.length +
    meetupItemsGlobal.Event3.length +
    meetupItemsGlobal.Event4.length;

  var numYelpEvents = yelpEventsGlobal.Event1.length +
    yelpEventsGlobal.Event2.length +
    yelpEventsGlobal.Event3.length +
    yelpEventsGlobal.Event4.length;

  var numEventbriteEvents = eventbriteGlobal.Event1.length +
    eventbriteGlobal.Event2.length +
    eventbriteGlobal.Event3.length +
    eventbriteGlobal.Event4.length;

  var numSeatgeekEvents = seatgeekItemsGlobal.Event1.length +
    seatgeekItemsGlobal.Event2.length +
    seatgeekItemsGlobal.Event3.length +
    seatgeekItemsGlobal.Event4.length;

  var numGooglePlaces = googlePlacesGlobal.Event1.length +
    googlePlacesGlobal.Event2.length +
    googlePlacesGlobal.Event3.length +
    googlePlacesGlobal.Event4.length;

  console.log("num meetup events: " + numMeetupEvents);
  console.log("num yelp events: " + numYelpEvents);
  console.log("num eb events: " + numEventbriteEvents);
  console.log("num sg events: " + numSeatgeekEvents);
  console.log("num goog places: " + numGooglePlaces);

  // Flags to include certain API data in the GA. Currently yelpEvents is hard-coded to false and google
  // places is to true and the rest is selected by the user (default for be true)
  var includeMeetupEvents = eventFilterFlags_in[0];
  var includeYelpEvents = false;
  var includeEventbriteEvents = eventFilterFlags_in[1];
  var includeSeatgeekEvents = eventFilterFlags_in[2];
  var includeGooglePlaces = eventFilterFlags_in[3];

  // Constants. These are filler itinerary items
  const NONE_ITEM = {
    name: "None/Free Itinerary Slot",
    cost: 0,
    rating: 4.4,
    time: "9999",
    location: {},
  }
  const NONE_ITEM_EVENT = {
    name: "None/Free Itinerary Slot",
    cost: 0,
    rating: 10.5,
    time: "9999",
    location: {},
  }

  // Initialize array that will be returned and formatted for the GA
  var itineraries = [ //array of objects with one key per object. the key holds another array of objects
    { Event1: [] }, // 0
    { Breakfast: [] }, //1
    { Event2: [] }, //2
    { Lunch: [] }, //3
    { Event3: [] }, //4
    { Dinner: [] }, //5
    { Event4: [] }, //6
  ];

  // Begin formatting and preprocess data
  try {
    itineraries[1].Breakfast = yelpBreakfastItemsGlobal.slice();

    itineraries[3].Lunch = yelpLunchItemsGlobal.slice();

    itineraries[5].Dinner = yelpDinnerItemsGlobal.slice();

    // Concat meetup events to itineraries array
    if (includeMeetupEvents) {
      if (meetupItemsGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(meetupItemsGlobal.Event1);
      }
      if (meetupItemsGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(meetupItemsGlobal.Event2);
      }
      if (meetupItemsGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(meetupItemsGlobal.Event3);
      }
      if (meetupItemsGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(meetupItemsGlobal.Event4);
      }
    }

    // Concat yelp events to itineraries array
    if (includeYelpEvents) {
      if (yelpEventsGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(yelpEventsGlobal.Event1);
      }
      if (yelpEventsGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(yelpEventsGlobal.Event2);
      }
      if (yelpEventsGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(yelpEventsGlobal.Event3);
      }
      if (yelpEventsGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(yelpEventsGlobal.Event4);
      }
    }

    // Concat eventbrite events to itineraries array
    if (includeEventbriteEvents) {
      if (eventbriteGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(eventbriteGlobal.Event1);
      }
      if (eventbriteGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(eventbriteGlobal.Event2);
      }
      if (eventbriteGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(eventbriteGlobal.Event3);
      }
      if (eventbriteGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(eventbriteGlobal.Event4);
      }
    }

    // Concat seatgeek events to itineraries array
    if (includeSeatgeekEvents) {
      if (seatgeekItemsGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(seatgeekItemsGlobal.Event1);
      }
      if (seatgeekItemsGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(seatgeekItemsGlobal.Event2);
      }
      if (seatgeekItemsGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(seatgeekItemsGlobal.Event3);
      }
      if (seatgeekItemsGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(seatgeekItemsGlobal.Event4);
      }
    }

    // Concat google places to itineraries array
    if (includeGooglePlaces) {
      if (googlePlacesGlobal.Event1.length >= 1) {
        itineraries[0].Event1 = itineraries[0].Event1.concat(googlePlacesGlobal.Event1);
      }
      if (googlePlacesGlobal.Event2.length >= 1) {
        itineraries[2].Event2 = itineraries[2].Event2.concat(googlePlacesGlobal.Event2);
      }
      if (googlePlacesGlobal.Event3.length >= 1) {
        itineraries[4].Event3 = itineraries[4].Event3.concat(googlePlacesGlobal.Event3);
      }
      if (googlePlacesGlobal.Event4.length >= 1) {
        itineraries[6].Event4 = itineraries[6].Event4.concat(googlePlacesGlobal.Event4);
      }
    }

    // Append a "none" itinerary item at the end of each key array
    itineraries[1].Breakfast.push(NONE_ITEM);
    itineraries[3].Lunch.push(NONE_ITEM);
    itineraries[5].Dinner.push(NONE_ITEM);

    itineraries[0].Event1.push(NONE_ITEM_EVENT);
    itineraries[2].Event2.push(NONE_ITEM_EVENT);
    itineraries[4].Event3.push(NONE_ITEM_EVENT);
    itineraries[6].Event4.push(NONE_ITEM_EVENT);

    // Save certain itinerary events/items based on user input by overwriting previous assignments
    console.log("saved events array:")
    console.log(savedEvents_in)
    if (savedUserInputs) {
      for (var isaved = 0; isaved < savedEvents_in.length; isaved++) {
        if (savedEvents_in[isaved] === 0) {
          delete itineraries[0].Event1;
          itineraries[0].Event1 = [];
          itineraries[0].Event1[0] = savedEventsObjs_in.Event1;
        }
        else if (savedEvents_in[isaved] === 1) {
          delete itineraries[1].Breakfast;
          itineraries[1].Breakfast = [];
          itineraries[1].Breakfast[0] = savedEventsObjs_in.Breakfast;
        }
        else if (savedEvents_in[isaved] === 2) {
          delete itineraries[2].Event2;
          itineraries[2].Event2 = [];
          itineraries[2].Event2[0] = savedEventsObjs_in.Event2;
        }
        else if (savedEvents_in[isaved] === 3) {
          delete itineraries[3].Lunch;
          itineraries[3].Lunch = [];
          itineraries[3].Lunch[0] = savedEventsObjs_in.Lunch;
        }
        else if (savedEvents_in[isaved] === 4) {
          delete itineraries[4].Event3;
          itineraries[4].Event3 = [];
          itineraries[4].Event3[0] = savedEventsObjs_in.Event3;
        }
        else if (savedEvents_in[isaved] === 5) {
          delete itineraries[5].Dinner;
          itineraries[5].Dinner = [];
          itineraries[5].Dinner[0] = savedEventsObjs_in.Dinner;
        }
        else {
          delete itineraries[6].Event4;
          itineraries[6].Event4 = [];
          itineraries[6].Event4[0] = savedEventsObjs_in.Event4;
        }
      }
    }
    return itineraries;
  }
  catch (e) {
    console.log('error in processAPIDataForGA')
    console.log(e)
    return [ //array of objects with one key per object. the key holds another array of objects
      { Event1: [] }, // 0
      { Breakfast: [] }, //1
      { Event2: [] }, //2
      { Lunch: [] }, //3
      { Event3: [] }, //4
      { Dinner: [] }, //5
      { Event4: [] }, //6
    ];;
  }
}

function convertTimeToAMPM(resultsArray_in) {
  var resultsArray_out = resultsArray_in.slice();
  var time;
  for (var i = 0; i < resultsArray_in.length; i++) {
    time = misc.convertMilTime(resultsArray_out[i].time);
    if (time != -1) {
      resultsArray_out[i].time = misc.convertMilTime(resultsArray_out[i].time);
    }
  }
  return resultsArray_out;
}


Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput

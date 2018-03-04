import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ApiService from './ApiService.js'
import DatePicker from 'react-datepicker';
import moment from 'moment';
import genAlgo from '../GA.js'
import idb_keyval from 'idb-keyval'
import globalStyles from '../App.css'

import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';



class Userinput extends Component {
  constructor(props) {
    super(props)

    this.state = {
      term: '',
      budgetmax: '',
      budgetmin: '',
      location: '',
      resultsArray: [],
      startDate: moment(),
      savedEvents: [], // acutal indices of the user saved events
      eliminatedEvents: [], // indices of the user eliminated itinerary slots (0-6)
      checked: [0,0,0,0,0,0,0], // for displaying checked or unchecked in user saved events
      eliminated: [0,0,0,0,0,0,0], // for displaying checked or unchecked in eliminating itinerary slots
      eventFilterFlags: [1,1,1], // ordered left to right: meetup, eventbrite, seatgeek
      totalCost: 0,
      expanded: true,
      options: false
    };
    this.apiService = new ApiService(this.state.resultsArray);
    this.handleChange = this.handleChange.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleEliminate = this.handleEliminate.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
    this.handleMoreOptions= this.handleMoreOptions.bind(this);

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

  handleSubmit(e) {
    e.preventDefault();

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

                        // Preprocess data for genetic algo
                        var dataForGA = processAPIDataForGA(data.data, this.state.eventFilterFlags);

                        // Do optimization to find locally "best" itinerary
                        var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, savedEvents, eliminatedEvents, bestItineraryIndicesParsed);

                        console.log(optimItinerary.bestUrls);
                        console.log(optimItinerary.bestLocations)
                        this.props.getData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);

                        // Set the state in this component and re-render
                        this.setState({
                          resultsArray: optimItinerary.bestItinerary,
                          savedEvents: savedEvents,
                          checked: [0,0,0,0,0,0,0], //reset the checkboxes to being unchecked
                          eliminated: [0,0,0,0,0,0,0], //reset the checkboxes for the eliminated slots
                          eliminatedEvents: eliminatedEvents,
                          totalCost: optimItinerary.totalCost,

                        });

                        this.setState(prevState => ({
                            expanded: !prevState.expanded
                        }));

                        // Save the user saved events into persistent memory client side
                        var prevBestItineraryStr = JSON.stringify(optimItinerary.bestItineraryIndices);
                        myStorage.setItem("prevBestItinerarySavedIndices", prevBestItineraryStr);

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

                          // Save the previously saved events by the user as persistent data in
                          // client side as a string
                          var savedEvents = [];
                          if (this.state.savedEvents.length > 0 && null !== myStorage.getItem('prevBestItinerarySavedIndices')) {
                            var bestItineraryIndicesParsed = JSON.parse(myStorage.getItem("prevBestItinerarySavedIndices"));
                            savedEvents = this.state.savedEvents.map(Number);
                          }

                          // Get which itinerary items/events are eliminated and not used in the GA (ie the user wants the
                          // item/event set to "none/free itinerary item")
                          var eliminatedEvents = this.state.eliminatedEvents.map(Number);

                          // Preprocess data for genetic algo
                          var dataForGA = processAPIDataForGA(val, this.state.eventFilterFlags);

                          // Do optimization to find locally "best" itinerary
                          var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, savedEvents, eliminatedEvents,  bestItineraryIndicesParsed);

                          // Save the user saved events into persistent memory client side
                          var prevBestItineraryStr = JSON.stringify(optimItinerary.bestItineraryIndices);
                          myStorage.setItem("prevBestItinerarySavedIndices", prevBestItineraryStr);

                          console.log(optimItinerary.bestUrls)
                          console.log(optimItinerary.bestLocations)
                          this.props.getData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);

                          // Set the state in this component and re-render
                          this.setState({
                            resultsArray: optimItinerary.bestItinerary,
                            totalCost: optimItinerary.totalCost,
                          });

                          this.setState(prevState => ({
                              expanded: !prevState.expanded
                          }));

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

    if(this.state.resultsArray.length > 0 || this.state.expanded == false) {
        formStyles.push('hidden');
    }

    if(this.state.resultsArray.length > 0 && this.state.expanded == true) {
         formStyles = ['form-body'];
    }

    if(this.state.options == false) {
        optionStyles.push('hidden');
    }  else {
        optionStyles = ['more-options'];
    }


    var ITINERARY_LENGTH = this.state.resultsArray.length;
    const { term, budgetmax, budgetmin, location } = this.state;
    var indents = [];
    // Only allow check boxes to show up if data can be saved client side
    if (window.indexedDB) {
      for (var i = 0; i < ITINERARY_LENGTH; i++) {
        indents.push(<div>
          <input checked={this.state.checked[i]} onChange={this.handleCheckbox} type='checkbox' value={i} />
          {this.state.resultsArray[i]}
          <input checked={this.state.eliminated[i]} onChange={this.handleEliminate} type='checkbox' value={i} />
          <hr></hr>
          </div>);
      }
    }
    else {
      for (var i = 0; i < ITINERARY_LENGTH; i++) {
        indents.push(<div>{this.state.resultsArray[i]}</div>);
      }
    }
    indents.push(<div><b>Total Cost: ${this.state.totalCost} </b></div>)

    var options = [];
    const NUM_EVENT_APIS = 3;
    var filters = [];
    var filterNames =["Meetup","Eventbrite","Seatgeek"];
    for (var i = 0; i < NUM_EVENT_APIS; i++) {
      options.push(<li>
        <input checked={this.state.eventFilterFlags[i]} onChange={this.handleFilter} type='checkbox' value={i} />{filterNames[i]}
        </li>);
    }


    return (
      <div className="Userinput col-md-6">
        <form className="form-card" onSubmit={this.handleSubmit}>
            <h4 className="background-color form-header">Plan Your Trip</h4>
            <div className={ formStyles.join(' ') }>
                <div className="form-group mb-2">
                    <label htmlFor="datePicker"><i className="far fa-calendar-alt fa-2x"></i></label>
                    <DatePicker required id="datePicker" className="textInput" selected={this.state.startDate} onChange={this.handleDateChange} />
                </div>
              {/*<input type="text" name="term" style={{ width: 90 }} value={term} onChange={this.handleChange} />*/}
              <div className="form-group mb-2">
                  <label htmlFor="budget"><i className="far fa-money-bill-alt fa-2x"></i> </label>
                  <input required className="max-width textInput" type="number" name="budgetmin" value={budgetmin} onChange={this.handleChange} placeholder="Min" />
                  <input required className="max-width textInput" type="number" name="budgetmax" value={budgetmax} onChange={this.handleChange} placeholder="Max" />
              </div>
              <div className="form-group mb-2">
                  <label htmlFor="location"><i className="far fa-paper-plane fa-2x"></i> </label>
                  <input required id="location" className="textInput" type="text" name="location" value={location} onChange={this.handleChange} placeholder="Location" />
              </div>

              <div className="results">
                  <a href="javascript:void(0)" onClick={this.handleMoreOptions}> { this.state.options == false ? 'More Options' : 'Less Options' } <i className="fas fa-sort-down"></i></a>
              </div>

              <div className={ optionStyles.join(' ')}>

                  <h5>Include results from: </h5>
                  <ul className="options">
                      {options}
                  </ul>
              </div>
            </div>



            <input className="btn btn-primary btn-md go-btn" type="submit" value={ this.state.expanded == true ? 'GO!' : 'Find Again' } />
                <div className="results">
                    <p>
                        <a href="javascript:void(0)" onClick={this.handleExpand}> { this.state.expanded == true ? '' : 'Change Search' }
                    </a>
                </p>
              </div>
        </form>

        <div><br />

            {indents}

        </div>

        <div>

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


function processAPIDataForGA(events_in, eventFilterFlags_in) {
  var meetupItemsGlobal = events_in.meetupItemsGlobal;
  var yelpEventsGlobal = events_in.yelpEventsGlobal;
  var eventbriteGlobal = events_in.eventbriteGlobal;
  var seatgeekItemsGlobal = events_in.seatgeekItemsGlobal;
  var yelpBreakfastItemsGlobal = events_in.yelpBreakfastItemsGlobal;
  var yelpLunchItemsGlobal = events_in.yelpLunchItemsGlobal;
  var yelpDinnerItemsGlobal = events_in.yelpDinnerItemsGlobal;

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

  console.log("num meetup events: " + numMeetupEvents);
  console.log("num yelp events: " + numYelpEvents);
  console.log("num eb events: " + numEventbriteEvents);
  console.log("num sg events: " + numSeatgeekEvents);

  var doMeetupCalls = eventFilterFlags_in[0];
  var doYelpEventCalls = false;
  var doEventbriteCalls = eventFilterFlags_in[1];
  var doSeatgeekCalls = eventFilterFlags_in[2];

  var events= {
    Event1: [],
    Event2: [],
    Event3: [],
    Event4: [],
  }

  if (doMeetupCalls) {
    if (meetupItemsGlobal.Event1.length > 1) {
      events.Event1 = events.Event1.concat(meetupItemsGlobal.Event1);
    }
    if (meetupItemsGlobal.Event2.length > 1) {
      events.Event2 = events.Event2.concat(meetupItemsGlobal.Event2);
    }
    if (meetupItemsGlobal.Event3.length > 1) {
      events.Event3 = events.Event3.concat(meetupItemsGlobal.Event3);
    }
    if (meetupItemsGlobal.Event4.length > 1) {
      events.Event4 = events.Event4.concat(meetupItemsGlobal.Event4);
    }
  }
  if (doYelpEventCalls) {
    if (yelpEventsGlobal.Event1.length > 1) {
      events.Event1 = events.Event1.concat(yelpEventsGlobal.Event1);
    }
    if (yelpEventsGlobal.Event2.length > 1) {
      events.Event2 = events.Event2.concat(yelpEventsGlobal.Event2);
    }
    if (yelpEventsGlobal.Event3.length > 1) {
      events.Event3 = events.Event3.concat(yelpEventsGlobal.Event3);
    }
    if (yelpEventsGlobal.Event4.length > 1) {
      events.Event4 = events.Event4.concat(yelpEventsGlobal.Event4);
    }

  }
  if (doEventbriteCalls) {
    if (eventbriteGlobal.Event1.length > 1) {
      events.Event1 = events.Event1.concat(eventbriteGlobal.Event1);
    }
    if (eventbriteGlobal.Event2.length > 1) {
      events.Event2 = events.Event2.concat(eventbriteGlobal.Event2);
    }
    if (eventbriteGlobal.Event3.length > 1) {
      events.Event3 = events.Event3.concat(eventbriteGlobal.Event3);
    }
    if (eventbriteGlobal.Event4.length > 1) {
      events.Event4 = events.Event4.concat(eventbriteGlobal.Event4);
    }
  }
  if (doSeatgeekCalls) {
    if (seatgeekItemsGlobal.Event1.length > 1) {
      events.Event1 = events.Event1.concat(seatgeekItemsGlobal.Event1);
    }
    if (seatgeekItemsGlobal.Event2.length > 1) {
      events.Event2 = events.Event2.concat(seatgeekItemsGlobal.Event2);
    }
    if (seatgeekItemsGlobal.Event3.length > 1) {
      events.Event3 = events.Event3.concat(seatgeekItemsGlobal.Event3);
    }
    if (seatgeekItemsGlobal.Event4.length > 1) {
      events.Event4 = events.Event4.concat(seatgeekItemsGlobal.Event4);
    }
  }

  var itineraries = formatAllData(yelpBreakfastItemsGlobal,
    yelpLunchItemsGlobal,
    yelpDinnerItemsGlobal,
    events);

    return itineraries;
}


// Format all data
function formatAllData(yelpBreakfastItems, yelpLunchItems, yelpDinnerItems, events) {
  const noneItem = {
    name: "None/Free Itinerary Slot",
    cost: 0,
    rating: 4.4,
    time: "9999",
    location: {},
  }
  const noneItemEvent = {
    name: "None/Free Itinerary Slot",
    cost: 0,
    rating: 10.5,
    time: "9999",
    location: {},
  }

  try {
      var numYelpBreakfastItems = yelpBreakfastItems.length;
      var numYelpLunchItems = yelpLunchItems.length;
      var numYelpDinnerItems = yelpDinnerItems.length;
      var numEvent1 = events.Event1.length;
      var numEvent2 = events.Event2.length;
      var numEvent3 = events.Event3.length;
      var numEvent4 = events.Event4.length;
      console.log("numYelpBreakfastItems: " + numYelpBreakfastItems)
      console.log("numYelpLunchItems: " + numYelpLunchItems)
      console.log("numYelpDinnerItems: " + numYelpDinnerItems)
      console.log("events1: " + numEvent1)
      console.log("events2: " + numEvent2)
      console.log("events3: " + numEvent3)
      console.log("events4: " + numEvent4)
      var itineraries = [];

      if (numYelpBreakfastItems >= 0 &&
          numYelpLunchItems >= 0 &&
          numYelpDinnerItems >= 0 &&
          numEvent1 >= 0 &&
          numEvent2 >= 0 &&
          numEvent3 >= 0 &&
          numEvent4 >= 0) {
          var items;
          var key;
          for (var i = 0; i < 7; i++) {
              if (i === 0) {
                  key = 'Event1';
                  items = events.Event1;
                  items.push(noneItemEvent);
              } else if (i === 2) {
                  key = 'Event2';
                  items = events.Event2;
                  items.push(noneItemEvent);
              } else if (i === 4) {
                  key = 'Event3';
                  items = events.Event3;
                  items.push(noneItemEvent);
              } else if (i === 6) {
                  key = 'Event4';
                  items = events.Event4;
                  items.push(noneItemEvent);
              } else if (i === 1) {
                  key = 'Breakfast';
                  var tempYelpItems = yelpBreakfastItems;
                  // Add a none itinerary item at the end
                  tempYelpItems.push(noneItem);
                  items = tempYelpItems;
              } else if (i === 3) {
                  key = 'Lunch';
                  var tempYelpItems = yelpLunchItems;
                  // Add a none itinerary item at the end
                  tempYelpItems.push(noneItem);
                  items = tempYelpItems;
              } else {
                  key = 'Dinner';
                  var tempYelpItems = yelpDinnerItems;
                  // Add a none itinerary item at the end
                  tempYelpItems.push(noneItem);
                  items = tempYelpItems;
              }
              var itemObj = {};
              itemObj[key] = items;
              itineraries.push(itemObj);
          }
          return itineraries;
      } else {
          console.log("Not enough items")
          return -1;
      }
  }
  catch (e) {
      console.log('error in formatAllData')
      console.log(e)
  }
}



Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput

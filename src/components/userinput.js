import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ApiService from './ApiService.js'
import DatePicker from 'react-datepicker';
import moment from 'moment';
import genAlgo from '../GA.js'
import idb_keyval from 'idb-keyval'
import globalStyles from '../App.css'
import GoogleApiWrapper from './googlemaps.js';
import Loader from './reactloading.js';
import DeleteUserEvent from './deleteUserEvent.js';
import AddUserEvent from './addUserEvent.js';
import MoreInfoButton from './moreInfoButton.js';
import MoreInfoView from './moreInfoView.js';

import '../maps.css';

import yelp_logo from '../images/yelp_burst.png';
import google_logo from '../images/google_places.png';
import meetup_logo from '../images/meetup_logo.png';
import eventbrite_logo from '../images/eventbrite_logo.png';
import seatgeek_logo from '../images/seatgeek_logo.png';
import globe from '../images/globe.png';


import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import misc from '../miscfuncs/misc.js'


class Userinput extends Component {
  constructor(props) {
    super(props)

    this.state = {
      term: '',
      budgetmax: 150,
      budgetmin: 90,
      location: 'San Francisco, CA',
      resultsArray: [],
      startDate: moment(),
      savedEvents: [], // acutal indices of the user saved events
      eliminatedEvents: [], // indices of the user eliminated itinerary slots (0-6)
      checked: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in user saved events
      eliminated: [0, 0, 0, 0, 0, 0, 0], // for displaying checked or unchecked in eliminating itinerary slots
      eventFilterFlags: [1, 1, 1, 1, 1], // ordered left to right: meetup, eventbrite, seatgeek, google places, select/unselect all options
      totalCost: 0,
      itinTimes: [], // time string in AM/PM format for display
      userAddedEvents: [],
      center: {},
      loading: false,
      showMoreInfo: [false, false, false, false, false, false, false]
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
    this.handleAddUserEvent = this.handleAddUserEvent.bind(this);
    this.handleDeleteUserEvent = this.handleDeleteUserEvent.bind(this);
    this.handleClearUserEvents = this.handleClearUserEvents.bind(this);
    this.handleMoreInfo = this.handleMoreInfo.bind(this);
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
    if (e.target.value === "selectAllOption") {
      if (e.target.checked) {
        this.setState({ eventFilterFlags: [1,1,1,1,1] });
      }
      else {
        this.setState({ eventFilterFlags: [0,0,0,0,0] });
      }
    }
    else {
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

  handleAddUserEvent(userItinSlot, userEventCost, userEventName, render) {
    const EVENT1_TIME = "0900";
    const EVENT2_TIME = "1200";
    const EVENT3_TIME = "1800";
    const EVENT4_TIME = "2200";
    const USERADDED_EVENT_RATING = 1000.0; // arbitrarily high
    var itinSlot = 1;
    if (userItinSlot){
      itinSlot = parseInt(userItinSlot);
    }
    var cost = 0.0;
    if (userEventCost) {
      cost = parseFloat(userEventCost);
    }
    var time = EVENT4_TIME;
    if (itinSlot == 1) {
      time = EVENT1_TIME; // event 1
    }
    else if (itinSlot == 2) {
      time = ""; // breakfast
    }
    else if (itinSlot == 3) {
      time = EVENT2_TIME; // event 2
    }
    else if (itinSlot == 4) {
      time = ""; // lunch
    }
    else if (itinSlot == 5) {
      time = EVENT3_TIME; // event 3
    }
    else if (itinSlot == 6) {
      time = ""; // dinner
    }
    else if (itinSlot == 7) {
      time = EVENT4_TIME; // event 4
    }
    var userAddedEventObj = {
      name: userEventName,
      url: "",
      rating: USERADDED_EVENT_RATING,
      time: time,
      location: {},
      cost: cost,
      slot: itinSlot,
      description: "",
      origin: 'userevent'
    }

    this.state.userAddedEvents.push(userAddedEventObj);
    let userAddedEventsArray = this.state.userAddedEvents.slice();
    this.setState({
      userAddedEvents: userAddedEventsArray,
    })

    console.log("User Added: " + userAddedEventObj.name);
    console.log('user state ---->');
    console.log(this.state.userAddedEvents);

  }

  handleDeleteUserEvent(userItinSlot, userEventCost, userEventName) {
      var userAddedEvents = this.state.userAddedEvents;
      var userAddedEventsArray = this.state.userAddedEvents.slice();
      userAddedEvents.find( (event, i) => {
          if(event.name === userEventName) {
              userAddedEventsArray.splice(i, 1);
              this.setState({
                  userAddedEvents: userAddedEventsArray
             })
          }
      });

      console.log('user state (delete) ---->');
      console.log(this.state.userAddedEvents);
  }

  handleClearUserEvents(e) {
    this.setState({
      userAddedEvents: [],
    })
    console.log("All user added events cleared.")
  }

  handleMoreInfo(e) {
    var tempShowMoreInfo = (this.state.showMoreInfo).slice();
    tempShowMoreInfo[e] = !tempShowMoreInfo[e];
    this.setState({
      showMoreInfo: tempShowMoreInfo,
    })
  }

  handleSubmit(e) {
    e.preventDefault();

    console.clear();
    this.setState({
        loading: true
    });
    var myStorage = window.localStorage;
    var doAPICallsFlag = true;
    var indexDBcompat = window.indexedDB;

    // Determine if the API data needs to be cleared locally (every 24 hours)
    var clearApiData = clearLocallyStoredAPIData(myStorage);
    if (clearApiData) {
      idb_keyval.delete('apiData');
      console.log('Clearing API Data!!')
    }

    const EMPTY_ITINERARY = {
      name: "No itinerary found. Try changing the inputs.",
      url: "",
      rating: 0,
      time: "",
      location: {},
      cost: 0,
    }
    const EMPTY_ITINERARY_NONAME = {
      name: "",
      url: "",
      rating: 0,
      time: "",
      location: {},
      cost: 0,
    }

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

          if (data_latlon) {
            if (data_latlon.results && data_latlon.results.length > 0) {

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

                    if (doAPICallsFlag || clearApiData || !indexDBcompat) {
                      // Reset API data cached timestamp
                      resetAPIDataTimeStampToNow(myStorage);

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

                        var userAddedEvents = [];

                        // Preprocess data for genetic algo
                        var dataForGA = processAPIDataForGA(data.data,
                          this.state.eventFilterFlags,
                          savedEvents,
                          bestItineraryObjsParsed,
                          this.state.userAddedEvents);

                        // Do optimization to find locally "best" itinerary
                        var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, eliminatedEvents);

                        // Construct output for display (array of objects in correct itinerary order)
                        var resultsArrayOutput = [dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]], //Event 1
                        dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]], //Breakfast
                        dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],//Event 2
                        dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]], //Lunch
                        dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],//Event 3
                        dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]], //Dinner
                        dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]]];//Event 4

                        if (optimItinerary.bestItineraryIndices[0] === -1) { // No itinerary was found/ error occurred

                          // reset stuff
                          resultsArrayOutput[0] = EMPTY_ITINERARY;
                          resultsArrayOutput[1] = EMPTY_ITINERARY_NONAME;
                          resultsArrayOutput[2] = EMPTY_ITINERARY_NONAME;
                          resultsArrayOutput[3] = EMPTY_ITINERARY_NONAME;
                          resultsArrayOutput[4] = EMPTY_ITINERARY_NONAME;
                          resultsArrayOutput[5] = EMPTY_ITINERARY_NONAME;
                          resultsArrayOutput[6] = EMPTY_ITINERARY_NONAME;

                          this.setState({
                            resultsArray: resultsArrayOutput,
                            checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                            eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                            totalCost: optimItinerary.totalCost,
                            savedEvents: [],
                            eliminatedEvents: [],
                            itinTimes: [],
                            totalCost: 0,
                            loading: false,
                            showMoreInfo: [false, false, false, false, false, false, false],
                          });
                        }
                        else { // GA produced an optimal itinerary. Display results
                          // create array for the time to be displayed for each itinerary item
                          var timesOutput = [misc.convertMilTime(resultsArrayOutput[0].time),
                          misc.convertMilTime(resultsArrayOutput[1].time),
                          misc.convertMilTime(resultsArrayOutput[2].time),
                          misc.convertMilTime(resultsArrayOutput[3].time),
                          misc.convertMilTime(resultsArrayOutput[4].time),
                          misc.convertMilTime(resultsArrayOutput[5].time),
                          misc.convertMilTime(resultsArrayOutput[6].time)];

                          // Output data to map
                          this.handleData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);

                          // Set the state in this component and re-render
                          this.setState({
                            resultsArray: resultsArrayOutput,
                            itinTimes: timesOutput,
                            savedEvents: savedEvents,
                            checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                            eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                            eliminatedEvents: eliminatedEvents,
                            totalCost: optimItinerary.totalCost,
                            loading: false,
                            showMoreInfo: [false, false, false, false, false, false, false],
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
                        }
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
                          var dataForGA = processAPIDataForGA(val,
                            this.state.eventFilterFlags,
                            savedEvents,
                            bestItineraryObjsParsed,
                            this.state.userAddedEvents);

                          // Do optimization to find locally "best" itinerary
                          var optimItinerary = genAlgo.doGA(dataForGA, this.state.budgetmax, this.state.budgetmin, eliminatedEvents);

                          // Construct output for display (aray of objects in correct itinerary order)
                          var resultsArrayOutput = [dataForGA[0].Event1[optimItinerary.bestItineraryIndices[0]], //Event 1
                          dataForGA[1].Breakfast[optimItinerary.bestItineraryIndices[1]], //Breakfast
                          dataForGA[2].Event2[optimItinerary.bestItineraryIndices[2]],//Event 2
                          dataForGA[3].Lunch[optimItinerary.bestItineraryIndices[3]], //Lunch
                          dataForGA[4].Event3[optimItinerary.bestItineraryIndices[4]],//Event 3
                          dataForGA[5].Dinner[optimItinerary.bestItineraryIndices[5]], //Dinner
                          dataForGA[6].Event4[optimItinerary.bestItineraryIndices[6]]];//Event 4

                          if (optimItinerary.bestItineraryIndices[0] === -1) { // No itinerary was found/ error occurred

                            // reset stuff
                            resultsArrayOutput[0] = EMPTY_ITINERARY;
                            resultsArrayOutput[1] = EMPTY_ITINERARY_NONAME;
                            resultsArrayOutput[2] = EMPTY_ITINERARY_NONAME;
                            resultsArrayOutput[3] = EMPTY_ITINERARY_NONAME;
                            resultsArrayOutput[4] = EMPTY_ITINERARY_NONAME;
                            resultsArrayOutput[5] = EMPTY_ITINERARY_NONAME;
                            resultsArrayOutput[6] = EMPTY_ITINERARY_NONAME;

                            this.setState({
                              resultsArray: resultsArrayOutput,
                              checked: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes to being unchecked
                              eliminated: [0, 0, 0, 0, 0, 0, 0], //reset the checkboxes for the eliminated slots
                              totalCost: optimItinerary.totalCost,
                              savedEvents: [],
                              eliminatedEvents: [],
                              itinTimes: [],
                              totalCost: 0,
                              loading: false,
                              showMoreInfo: [false, false, false, false, false, false, false],
                            });
                          }
                          else { // GA produced an optimal itinerary. Display results
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

                            // create array for the time to be displayed for each itinerary item
                            var timesOutput = [misc.convertMilTime(resultsArrayOutput[0].time),
                            misc.convertMilTime(resultsArrayOutput[1].time),
                            misc.convertMilTime(resultsArrayOutput[2].time),
                            misc.convertMilTime(resultsArrayOutput[3].time),
                            misc.convertMilTime(resultsArrayOutput[4].time),
                            misc.convertMilTime(resultsArrayOutput[5].time),
                            misc.convertMilTime(resultsArrayOutput[6].time)];

                            var prevBestItineraryStr = JSON.stringify(optimItinerary.bestItineraryIndices);
                            myStorage.setItem("prevBestItinerarySavedIndices", prevBestItineraryStr);
                            myStorage.setItem("prevBestItinerarySavedObjects", prevBestItineraryObjs);

                            this.handleData(optimItinerary.bestLocations, optimItinerary.bestUrls, mapCenter);

                            // Set the state in this component and re-render
                            this.setState({
                              resultsArray: resultsArrayOutput,
                              itinTimes: timesOutput,
                              totalCost: optimItinerary.totalCost,
                              loading: false,
                              showMoreInfo: [false, false, false, false, false, false, false],
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
            else {
              this.setState({
                loading: false,
              });
              console.log(data_latlon)
              console.log("invalid location input!")
            } // end if (data_latlon.results)
          }
          else {
            this.setState({
              loading: false,
            });
          }
        }.bind(this))
      }
    }
  }

  render() {
    var formStyles = ['form-body'];
    var optionStyles = ['more-options', 'form-body'];
    const ITINCONTAINER_STYLE = 'itinContainer';
    const HIDDEN = 'hidden';
    const OPEN = 'open';

    var origins = {
         yelp: yelp_logo,
         places: google_logo,
         meetup: meetup_logo,
         eventbrite: eventbrite_logo,
         seatgeek: seatgeek_logo
    }
    var ITINERARY_LENGTH = this.state.resultsArray.length;
    const { term, budgetmax, budgetmin, location } = this.state;
    var indents = [];

    if(this.state.resultsArray.length > 0) {
        indents.push(<thead key="tablehead"><tr><th colSpan="7"><h4>Your Itinerary</h4></th></tr></thead>);
        // Form the itinerary results display
        for (var i = 0; i < ITINERARY_LENGTH; i++) {
          var origin = this.state.resultsArray[i].origin;
          var moreInfoStyles = [];
          moreInfoStyles.push(ITINCONTAINER_STYLE);

          if (!this.state.showMoreInfo[i]) {
            moreInfoStyles.push(HIDDEN);
          }

          var key = 'tbody-' + i;
          indents.push(
            <tbody key={key}>
              <tr>
                <td><input checked={this.state.checked[i]} onChange={this.handleCheckbox} type='checkbox' value={i} /></td>
                <td><input checked={this.state.eliminated[i]} onChange={this.handleEliminate} type='checkbox' value={i} /></td>
                <td><img className="origin-logo" src={origins[origin]} /></td>
                <td><strong>{this.state.itinTimes[i] ? this.state.itinTimes[i] : ''}</strong></td>
                <td className="resultsName">
                {this.state.resultsArray[i].url=="" ? this.state.resultsArray[i].name :
                    <a href={this.state.resultsArray[i].url} target='_blank'>{this.state.resultsArray[i].name} </a>}
                    {this.state.resultsArray[i].origin === 'noneitem' || this.state.resultsArray[i].origin === 'userevent' ? '' : <MoreInfoButton value={i} onButtonClick={this.handleMoreInfo} />}
                </td>
                <td className="text-success"><strong>${this.state.resultsArray[i].cost}</strong>  </td>
              </tr>
              <tr className={moreInfoStyles.join(' ')}>
                <td colSpan="7"><MoreInfoView desc={this.state.resultsArray[i].description}
                phone={this.state.resultsArray[i].phone}
                address={this.state.resultsArray[i].address}
                duration={this.state.resultsArray[i].duration}
                otherInfo={this.state.resultsArray[i].other}
                origin={this.state.resultsArray[i].origin}
                thumbnail={this.state.resultsArray[i].thumbnail}
                url={this.state.resultsArray[i].url}
                approxFeeFlag={this.state.resultsArray[i].approximateFee}
                defaultDurationFlag={this.state.resultsArray[i].defaultDuration}/></td>
              </tr>
            </tbody>
          );
        }

        // The Total cost display
        var total = [];
        total.push(<div key="totalCostDiv"><b>Approx. Total Cost: ${this.state.totalCost} </b></div>)
    }



    // More options display
    var options = [];
    const NUM_EVENT_APIS = 4;
    var filters = [];
    var filterNames = ["Meetup", "Eventbrite", "Seatgeek", "Local Parks"];
    var filterDesc = [
            "Meetup brings people together to create thriving communities.",
            "Eventbrite brings people together through live experiences. Discover events that match your passions, or create your own with online ticketing tools.",
            "SeatGeek is the Web's largest event ticket search engine. Discover events you love, search all ticket sites, see seat locations and get the best deals on tickets.",
            "Local Parks and Places are grabbed from Google Places API, a service to  connect people to places with the power of location awareness."
        ]
    options.push(<li className="filter" key="eventFilterFlags">
      <input checked={this.state.eventFilterFlags[NUM_EVENT_APIS]} onChange={this.handleFilter} type='checkbox' value='selectAllOption'/> Select All</li>)
    options.push(<li key="alleventsdesc">Use events from all services.</li>);
    for (var i = 0; i < NUM_EVENT_APIS; i++) {
        var event = 'event-' + i;
        var desc = 'desc-' + i;
      options.push(<li className="filter" key={event}>
          <input checked={this.state.eventFilterFlags[i]} onChange={this.handleFilter} type='checkbox' value={i} /> {filterNames[i]}</li>
        );
        options.push(<li key={desc}><p>{filterDesc[i]}</p></li>);
     }

    var userevents = [];
    for (var i = 0; i < this.state.userAddedEvents.length; i++) {
        userevents.unshift(<DeleteUserEvent key={key} userevent={this.state.userAddedEvents[i]} handleDelete={this.handleDeleteUserEvent}/> );
    }


    return (
      <div className="Userinput">
        <div className="form-header">
                <nav>
                  <div className="nav nav-tabs" id="nav-tab" role="tablist">
                    <a className="nav-item nav-link active" id="nav-plan-tab" data-toggle="tab" href="#nav-plan" role="tab" aria-controls="nav-plan" aria-selected="true"><i className="plane-icon fas fa-map-marker-alt"></i>Plan Your Trip</a>
                    <a className="nav-item nav-link" id="nav-add-tab" data-toggle="tab" href="#nav-add" role="tab" aria-controls="nav-add" aria-selected="false"><i className="fas fa-list-ul"></i> Add Event</a>
                    <a className="nav-item nav-link" id="nav-options-tab" data-toggle="tab" href="#nav-options" role="tab" aria-controls="nav-options" aria-selected="false">More Options</a>
                  </div>
                </nav>
                <div className="tab-content" id="nav-tabContent">
                  <div className="tab-pane fade show active" id="nav-plan" role="tabpanel" aria-labelledby="nav-plan-tab">
                      <form className="form-card" onSubmit={this.handleSubmit}>
                        <div className={formStyles.join(' ')}>
                          <div className="row inputsRow">
                                  <div className="col-md-4 form-group mb-2">
                                    <input required id="location" className="textInput" type="text" name="location" value={location} onChange={this.handleChange} autoComplete="address-level2" placeholder="Where are you going?" />
                                  </div>

                                  <div className="col-md-2 form-group mb-2 datePickerWrapper">
                                    <DatePicker required id="datePicker" className="textInput" selected={this.state.startDate} onChange={this.handleDateChange} />
                                  </div>
                                  {/*<input type="text" name="term" style={{ width: 90 }} value={term} onChange={this.handleChange} />*/}
                                  <div className="col-md-2 form-group mb-2">
                                    <input required className="textInput" type="number" min="0" name="budgetmin" value={budgetmin} onChange={this.handleChange} placeholder="$ Min" />
                                  </div>
                                  <div className="col-md-2 form-group mb-2">
                                    <input required className="textInput" min="0" type="number" name="budgetmax" value={budgetmax} onChange={this.handleChange} placeholder="$ Max" />
                                  </div>
                                  <div className="col-md-2 search-btn">
                                      <input className="btn btn-sm go-btn" type="submit" value="GO!" />
                                  </div>
                              </div>
                          </div>
                      </form>
                  </div>
                  <div className="tab-pane fade" id="nav-add" role="tabpanel" aria-labelledby="nav-add-tab">
                      <div className={optionStyles.join(' ')}>
                           <h5>Add Your Own Event:</h5>
                           <p>Include your own events and we will calculate your optimized itinerary based on events you've added!</p>
                           <AddUserEvent handleAdd={this.handleAddUserEvent}/>
                           {userevents}

                          {/* clear all user added events*/}

                          <a href="javascript:void(0)" onClick={this.handleClearUserEvents}> Clear All User Added Events
                          </a>

                      </div>
                  </div>
                  <div className="tab-pane fade" id="nav-options" role="tabpanel" aria-labelledby="nav-options-tab">
                      <div className={optionStyles.join(' ')}>
                          <h5>Include results from: </h5>
                          <ul className="options">
                              {options}
                          </ul>
                      </div>
                  </div>
                </div>


        </div>
        <div className="row eventsCont">
            <div className="col-md-6 itinerary">
            {this.state.resultsArray.length === 0 && this.state.loading === false ? <div className="greeting"><h4>Get Started Planning Your Trip Above!</h4><img src={globe}></img></div> : ' '}
            {this.state.loading == true ? <div className="loader"><Loader type="spinningBubbles" color="#6c757d"></Loader><h5>Searching...</h5></div> :

                <table>
                  {indents}
                </table>}

                {this.state.loading == false ? <div className="totalCost">
                    {total}
                </div> : ''}

            </div>

            <div className="mapsfix col-md-6">
              <GoogleApiWrapper results={this.state.resultsArray} center={this.state.center} />
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

// Returns true if locally stored data is "stale" or user input a different location therefore new API calls
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


function processAPIDataForGA(events_in, eventFilterFlags_in, savedEvents_in, savedEventsObjs_in, userAddedEventsObjs_in) {
  try {
    // Define whether or not user choose to save an event or restaurant to eat at
    // savedEvents_in is the indices of the saved events [0-6]
    // savedEventsObj_in is that actual data of the event/restaurant (name, url, cost, etc)
    var savedUserInputs = false;
    if (savedEvents_in.length > 0 && savedEventsObjs_in) {
      savedUserInputs = true;
    }

    var userAddedEventsFlag = false;
    if (userAddedEventsObjs_in.length>0 && userAddedEventsObjs_in) {
      userAddedEventsFlag = true;
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
      rating: 4.0,
      time: "9999",
      location: {},
      origin: 'noneitem',
    }
    const NONE_ITEM_EVENT = {
      name: "None/Free Itinerary Slot",
      cost: 0,
      rating: 10.4,
      time: "9999",
      location: {},
      origin: 'noneitem',
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

    // Save certain itinerary events/items (from API calls) based on user input by overwriting previous assignments
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

    // Save user added event by overwriting previous assignments
    console.log("user added events array:")
    console.log(userAddedEventsObjs_in)
    if (userAddedEventsFlag) {
      var doOnceSlot1 = true;
      var doOnceSlot2 = true;
      var doOnceSlot3 = true;
      var doOnceSlot4 = true;
      var doOnceSlot5 = true;
      var doOnceSlot6 = true;
      var doOnceSlot7 = true;

      for (var iadded = 0; iadded < userAddedEventsObjs_in.length; iadded++) {
        if (userAddedEventsObjs_in[iadded].slot === 1) {
          if (doOnceSlot1) {
            doOnceSlot1 = false;
            delete itineraries[0].Event1;
            itineraries[0].Event1 = [];
          }
          itineraries[0].Event1.push(userAddedEventsObjs_in[iadded]);
        }
        else if (userAddedEventsObjs_in[iadded].slot === 2) {
          if (doOnceSlot2) {
            doOnceSlot2 = false;
            delete itineraries[1].Breakfast;
            itineraries[1].Breakfast = [];
          }
          itineraries[1].Breakfast.push(userAddedEventsObjs_in[iadded]);
        }
        else if (userAddedEventsObjs_in[iadded].slot === 3) {
          if (doOnceSlot3) {
            doOnceSlot3 = false;
            delete itineraries[2].Event2;
            itineraries[2].Event2 = [];
          }
          itineraries[2].Event2.push(userAddedEventsObjs_in[iadded]);
        }
        else if (userAddedEventsObjs_in[iadded].slot === 4) {
          if (doOnceSlot4) {
            doOnceSlot4 = false;
            delete itineraries[3].Lunch;
            itineraries[3].Lunch = [];
          }
          itineraries[3].Lunch.push(userAddedEventsObjs_in[iadded]);
        }
        else if (userAddedEventsObjs_in[iadded].slot === 5) {
          if (doOnceSlot5) {
            doOnceSlot5 = false;
            delete itineraries[4].Event3;
            itineraries[4].Event3 = [];
          }
          itineraries[4].Event3.push(userAddedEventsObjs_in[iadded]);
        }
        else if (userAddedEventsObjs_in[iadded].slot === 6) {
          if (doOnceSlot6) {
            doOnceSlot6 = false;
            delete itineraries[5].Dinner;
            itineraries[5].Dinner = [];
          }
          itineraries[5].Dinner.push(userAddedEventsObjs_in[iadded]);
        }
        else {
          if (doOnceSlot7) {
            doOnceSlot7 = false;
            delete itineraries[6].Event4;
            itineraries[6].Event4 = [];
          }
          itineraries[6].Event4.push(userAddedEventsObjs_in[iadded]);
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
  var timeConverted;
  for (var i = 0; i < resultsArray_out.length; i++) {
    timeConverted = misc.convertMilTime(resultsArray_out[i].time);
    if (timeConverted != -1) {
      resultsArray_out[i].time = timeConverted;
    }
  }
  return resultsArray_out;
}

// This function returns a flag to clear or not to clear the locally stored API data depending on if the data has been
// stored for 24 hours or not. This is for API terms and conditions compliance to ensure data is not cached longer
// than 24 hours.
function clearLocallyStoredAPIData(myStorage_in) {
  var TWENTYFOUR_HOURS = 24 * 60 * 60 * 1000; /* ms */
  var currentTimeStamp = new Date();
  var currentTimeStampStr = currentTimeStamp.getTime().toString(); // ms
  var currentTimeStampMilSec = currentTimeStamp.getTime();

  var clearApiData = false;
  if (myStorage_in) {
    var lastLocalTimeStampForAPIDataDeletion = myStorage_in.getItem('timestamp');
    // There is no timestamp key in local storage, create it and set it to the current time
    if (lastLocalTimeStampForAPIDataDeletion === null || !lastLocalTimeStampForAPIDataDeletion) {
      myStorage_in.setItem('timestamp', currentTimeStampStr);
    }
    // If there is the timestamp key in local storage, compare it to the current time and calculate
    // if the difference is greater than 24 hours ago
    else {
      var prevTimeStamp = parseInt(lastLocalTimeStampForAPIDataDeletion);
      if (currentTimeStampMilSec - prevTimeStamp >= TWENTYFOUR_HOURS) {
        clearApiData = true;
        myStorage_in.setItem('timestamp', currentTimeStampStr);
      }
    }
  }
  return clearApiData;
}

function resetAPIDataTimeStampToNow(myStorage_in) {
  var currentTimeStamp = new Date();
  var currentTimeStampStr = currentTimeStamp.getTime().toString(); // ms
  myStorage_in.setItem('timestamp', currentTimeStampStr);
}

Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput;

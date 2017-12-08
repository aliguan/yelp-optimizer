import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

class yelpApiService extends Component {

  getRestaurantData(term, location) {
      axios.post('http://localhost:4200/' + 'api', {
          term: term,
          location: location
      })
      .then( response => {
          console.log(response.data);
      })
      .catch(err => console.log(err));
  };

}

export default yelpApiService

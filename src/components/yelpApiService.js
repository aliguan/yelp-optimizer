import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

class YelpApiService extends Component {

  getRestaurantData(term, budgetmax, budgetmin, location) {
      return axios.post('http://localhost:4200/' + 'api', {
          term: term,
          budgetmax: budgetmax,
          budgetmin: budgetmin,
          location: location
      })
      .catch(err => console.log(err));
  };
}

export default YelpApiService

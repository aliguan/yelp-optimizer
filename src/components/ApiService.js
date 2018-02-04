import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

class ApiService extends Component {

  getData(term, latlon, city, date) {
      return axios.post('http://localhost:4200/' + 'api', {
          term: term,
          latlon: latlon,
          city: city,
          date: date,
      })
      .catch(err => console.log(err));
  };
}

export default ApiService

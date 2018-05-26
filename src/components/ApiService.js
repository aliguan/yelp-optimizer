import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

class ApiService extends Component {

  getData(term, latlon, city, date, string_date) {
      return axios.post('http://matchasensei.com/api', {
          term: term,
          latlon: latlon,
          city: city,
          date: date,
          string_date: string_date
      })
      .catch(err => console.log(err));
  };
}

export default ApiService

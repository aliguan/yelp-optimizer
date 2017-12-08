import React, { Component } from 'react'
import PropTypes from 'prop-types'
import yelpApiService from './yelpApiService.js'

class Userinput extends Component {
  constructor(props) {
    super(props)
    this.state = {
        term: 'Chinese',
        location: 'Orlando'
    };
    this.yelpApi = new yelpApiService();
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    const state = this.state
    state[e.target.name] = e.target.value;
    this.setState(state);
  }

  handleSubmit(e) {
      this.yelpApi.getRestaurantData(this.state.term, this.state.location)
      e.preventDefault();
  }

  render() {
    const { term, location } = this.state;
    return (
      <div className="Userinput">
        <form onSubmit={this.handleSubmit}>

            <input type="text" name="term" value={term} onChange={this.handleChange} />
            <input type="text" name="location" value={location} onChange={this.handleChange}/>

            <input type="submit" value="Submit" />
        </form>

      </div>

    )
  }
}

Userinput.propTypes = {}

Userinput.defaultProps = {}

export default Userinput

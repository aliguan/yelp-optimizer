import React, { Component } from 'react'

class MoreInfoButton extends Component {
    handleClick = () => {
      this.props.onButtonClick(this.props.value);
    }

    render() {
      return (
        <input type="button" value="v" onClick={this.handleClick}/>
      );
    }
  }

  export default MoreInfoButton;

import React, { Component } from 'react'

class MoreInfoButton extends Component {
    handleClick = () => {
      this.props.onButtonClick(this.props.value);
    }

    render() {
      return (
        <input className="block btn btn-sm btn-primary moreInfoButton" type="button" value="More Info" onClick={this.handleClick}/>
      );
    }
  }

  export default MoreInfoButton;

import React, { Component } from 'react'

class MoreInfoButton extends Component {
    handleClick = () => {
      this.props.onButtonClick(this.props.value);
    }

    render() {
      return (
        <input className="block" type="button" value="More Info" onClick={this.handleClick}/>
      );
    }
  }

  export default MoreInfoButton;

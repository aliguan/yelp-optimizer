import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';

export class UserEvent extends Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);

    }

    handleClick() {
        var userEventName = this.refs.userEventName.value;
        var userEventCost = this.refs.userEventCost.value;
        var userItinSlot = this.refs.userItinSlot.value;

        this.props.handleAdd(userItinSlot, userEventCost, userEventName);
    }



    render() {
        return(
            <form className="form-inline addEventForm">
                {/* User added event slot  */}
                <div className="optionInputs">
                    <div className="optionSelect form-group">
                      <select id="slots" ref="userItinSlot">
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option>5</option>
                        <option>6</option>
                        <option>7</option>
                      </select>
                    </div>

                    {/* User added event name */}
                    <div className="form-group col-md-7 eventName">
                      <input type="text" className="textInput" id="eventName" placeholder="Event Name" ref="userEventName"/>
                    </div>

                    {/* User added event cost */}
                    <div className="form-group col-md-3">
                      <input type="number" className="textInput" id="cost" placeholder="$ Cost" min="0" ref="userEventCost"/>
                    </div>

                    <div className="addIcon textInput col-md-1">
                        <button onClick={this.handleClick} type="button">+</button>
                    </div>
                </div>

            </form>
        )
    }
}

export default UserEvent;

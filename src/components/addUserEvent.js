import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';

export class AddUserEvent extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        var userEventName = this.refs.userEventName.value;
        var userEventCost = this.refs.userEventCost.value;
        var userItinSlot = this.refs.userItinSlot.value;
        var userEventTime = this.refs.userEventTime.value;

        this.props.handleAdd(userItinSlot, userEventCost, userEventName, userEventTime);

        this.refs.userEventName.value = '';
        this.refs.userEventCost.value = '';
        this.refs.userItinSlot.value = 1;
        this.refs.userEventTime.value = "09:00";
    }

    // handleDelete() {
    //     var userEventName = this.refs.userEventName.value;
    //     var userEventCost = this.refs.userEventCost.value;
    //     var userItinSlot = this.refs.userItinSlot.value;
    //
    //     this.props.handleDelete(userItinSlot, userEventCost, userEventName);
    // }

    render() {
        var action = [];

        action.push(<div key='add-action' className="addIcon">
            <button onClick={this.handleClick} type="button">+</button>
        </div>);


        var formStyle = ['form-inline', 'addEventForm'];

        return(
            <form className={formStyle.join(' ')}>
                {/* User added event slot  */}

                    <div className="optionSelect form-group"> 
                       <select className="slot" id="addslot" ref="userItinSlot">
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option>5</option>
                        <option>6</option>
                        <option>7</option>
                      </select>
                      </div>
                    <div className="form-group">
                      <input type="time" id="addTime" ref="userEventTime" className="timeInput" step="300" defaultValue="09:00"/>
                    </div>

                    {/* User added event name */}
                    <div className="form-group">
                      <input type="text" className="textInput" id="eventName" placeholder="Event Name" ref="userEventName" />
                    </div>

                    {/* User added event cost */}
                    <div className="form-group">
                      <input type="number" className="textInput" id="cost" placeholder="$ Cost" min="0" ref="userEventCost"/>
                    </div>

                    {action}


            </form>
        )
    }
}

export default AddUserEvent;

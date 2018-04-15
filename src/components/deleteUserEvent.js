import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';

export class DeleteUserEvent extends Component {
    constructor(props) {
        super(props);

        this.handleDelete = this.handleDelete.bind(this);
    }


    handleDelete() {
        var userEventName = this.refs.userEventName.value;
        var userEventCost = this.refs.userEventCost.value;
        var userItinSlot = this.refs.userItinSlot.value;

        this.props.handleDelete(userItinSlot, userEventCost, userEventName);
    }

    render() {
        var action = [];

        action.push(<div key='delete-action' className="addIcon textInput col-md-1">
            <button onClick={this.handleDelete} type="button">-</button>
        </div>);


        var formStyle = ['form-inline', 'addEventForm'];

        return(
            <form className={formStyle.join(' ')}>
                {/* User added event slot  */}
                <div className="optionInputs">
                    <div className="optionSelect form-group">
                      <select className="slot" ref="userItinSlot" value={this.props.userevent.slot}>
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
                      <input type="text" className="textInput" id="eventName" placeholder="Event Name" value={this.props.userevent.name} ref="userEventName" />
                    </div>

                    {/* User added event cost */}
                    <div className="form-group col-md-3">
                      <input type="number" className="textInput" id="cost" placeholder="$ Cost" min="0" value={this.props.userevent.cost} ref="userEventCost"/>
                    </div>

                    {action}
                </div>

            </form>
        )
    }
}

export default DeleteUserEvent;

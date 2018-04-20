import React, { Component } from 'react'

export class EditCostComponent extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        var formStyle = ['form-inline', 'addEventForm'];
        return (
            <form className={formStyle.join(' ')}>
            <div className="form-group">
                <input type="number" className="editCostStyle" min="0" value={this.props.cost} />
            </div>
            </form>
        );
    }
}

export default EditCostComponent;

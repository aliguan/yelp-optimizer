// results.js

import React, { Component } from 'react';
class Results extends Component {

    constructor(props) {
        super(props);
    }


    render() {
        var indents = [];
        for (var i = 0; i < 7; i++) {
            indents.push(<div> {this.props.results[i]} </div>);
        }
        return (
            <div>
                {indents}
            </div>
        );
    }
}

export default Results;

import '../maps.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Map, InfoWindow, Marker, GoogleApiWrapper, google} from 'google-maps-react';
import React, { Component } from 'react';

export class MapContainer extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        var markers = [];
        if(this.props.locations.length > 0) {
            for(var i = 0; i < this.props.locations.length; i++) {
                markers.push(<Marker onClick={this.onMarkerClick}
                   name={'Current location'}
                   position={this.props.locations[i]}/>)

            }

        }
        return (
          <Map google={this.props.google}
               zoom={12}
               center={this.props.center}
               className="maps col-md-6"
               style={maps}
            >

            {markers}
          </Map>

        );
      }
}

const maps = {
    position: 'relative',
    height: '100vh',
}

export default GoogleApiWrapper({
  apiKey: (process.env.REACT_GOOGLE_API_KEY)
})(MapContainer)

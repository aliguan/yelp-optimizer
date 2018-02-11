import '../maps.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Map, InfoWindow, Marker, GoogleApiWrapper, google} from 'google-maps-react';
import React, { Component } from 'react';

export class MapContainer extends Component {

render() {
    return (
      <Map google={this.props.google}
           zoom={14}
           initialCenter={{
               lat: 28.538336,
               lng: -81.379234
           }}
           className="maps col-md-6"
           style={maps}
        >

        <Marker onClick={this.onMarkerClick}
                name={'Current location'} />
      </Map>

    );
  }
}

const maps = {
    position: 'relative',
    height: '100vh',
}

export default GoogleApiWrapper({
  apiKey: (process.env.REACT_APP_MAPS_KEY)
})(MapContainer)

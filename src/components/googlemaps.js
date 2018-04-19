import '../maps.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Map, InfoWindow, Marker, GoogleApiWrapper, google} from 'google-maps-react';
import React, { Component } from 'react';

export class MapContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showingInfoWindow: false,
            activeMarker: {},
            selectedPlace: {},
        }

      // binding this to event-handler functions
      this.onMarkerClick = this.onMarkerClick.bind(this);
      this.onMapClicked = this.onMapClicked.bind(this);
      this.windowHasClosed = this.windowHasClosed.bind(this);
    }

    onMarkerClick(props, marker, e) {
        this.setState({
            selectedPlace: props,
            activeMarker: marker,
            showingInfoWindow: true
        });
    }

    onMapClicked(props) {
        if (this.state.showingInfoWindow) {
            this.setState({
                showingInfoWindow: false,
                activeMarker: null
            });
        }
    }

    windowHasClosed() {
        this.setState({
            showingInfoWindow: false,
            activeMarker: null
        });
    }

    render() {
        //console.log(this.props);
        var markers = [];
        if(this.props.results.length > 0) {
            for(var i = 0; i < this.props.results.length; i++) {
                var key = 'marker' + i;
                var info_key = 'info' + i;
                markers.push(
                    <Marker key={key} onClick={this.onMarkerClick}
                        name={this.props.results[i].name}
                        position={this.props.results[i].location}
                    />
                );
                markers.push(
                    <InfoWindow key={info_key}
                        onClose={this.windowHasClosed}
                        marker={this.state.activeMarker}
                        visible={this.state.showingInfoWindow}>
                        <div>
                         <h6>{this.state.selectedPlace.name}</h6>
                       </div>
                   </InfoWindow>
                )
            }

        }
        return (
          <Map google={this.props.google}
               zoom={12}
               center={this.props.center}
               className="maps"
               style={maps}
            >

            {markers}
          </Map>

        );
      }
}

const maps = {
    height: '100vh',
}

export default GoogleApiWrapper({
  apiKey: 'AIzaSyAGiAZR3bZqHg3ji4ahdjoGG5Vm-yuoCL0'
})(MapContainer)

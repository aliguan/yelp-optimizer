import React, { Component } from 'react'
import renderHTML from 'react-render-html';
const ORIGINS_YELP = 'yelp';
const ORIGINS_EB = 'eventbrite';
const ORIGINS_GP = 'places';
const ORIGINS_MU = 'meetup';
const ORIGINS_SG = 'seatgeek';
const ORIGINS_NONE = 'noneitem';
const ORIGINS_USER = 'useradded';
const MULTI_DAY_EVENT_MSG = "Multiple day event";
const HOURS_TEXT = " hour(s)";
const APPROX_DURATION_MSG = "No end time data found.";
const YELP_LINK_TEXT = "Check out the Yelp page!";
const EB_LINK_TEXT = "Check out the Eventbrite page!";
const MU_LINK_TEXT = "Check out the Meetup page!";
const GP_LINK_TEXT = "More information!";
const SG_LINK_TEXT = "Buy Tickets Now!";

class MoreInfoView extends Component {
    constructor(props) {
        super(props);

    }

    renderCTAElement() {
        if (this.props.origin === ORIGINS_YELP) {
            return <tr><td><a href={this.props.url} target="_blank">{YELP_LINK_TEXT}</a></td></tr>;
        }
        else if (this.props.origin === ORIGINS_EB) {
            return <tr><td><a href={this.props.url} target="_blank">{EB_LINK_TEXT}</a></td></tr>;
        }
        else if (this.props.origin === ORIGINS_MU) {
            return <tr><td><a href={this.props.url} target="_blank">{MU_LINK_TEXT}</a></td></tr>;
        }
        else if (this.props.origin === ORIGINS_GP) {
            return <tr><td><a href={this.props.url} target="_blank">{GP_LINK_TEXT}</a></td></tr>;
        }
        else if (this.props.origin === ORIGINS_SG) {
            return <tr><td>
                <a href={this.props.url} target="_blank">{SG_LINK_TEXT}</a>
                <p>Lowest Priced Ticket: <b>${this.props.otherInfo[1]}</b></p>
                <p>Highest Priced Ticket: <b>${this.props.otherInfo[2]}</b></p>
                </td></tr>;
        }
        else if (this.props.origin === ORIGINS_NONE) {
            return;
        }
        return;
    }

    renderDescElement() {
        var desc = this.props.desc;
        if (desc === undefined) {
            desc = "";
        }
        if (this.props.origin === ORIGINS_YELP) {
            return (
                <td>
                    <p><b>Description: </b></p>
                    {renderHTML(desc)}
                    <a href={this.props.thumbnail} target="_blank">
                        <img className="moreInfoThumbnail" src={this.props.thumbnail} />
                    </a>
                </td>
            );
        }
        else {
            return (
                <td>
                    <p><b>Description: </b></p>                    
                    <a href={this.props.thumbnail} target="_blank">
                        <img className="moreInfoThumbnail" src={this.props.thumbnail} />
                    </a>
                    {renderHTML(desc)}
                </td>
            );
        }

    }

    render() {
        var eventDuration = this.props.duration;
        if (eventDuration === undefined) {
            eventDuration = "";
        }
        else {
            eventDuration += HOURS_TEXT;
        }
        
        if (this.props.origin !== ORIGINS_NONE || this.props.origin !== ORIGINS_USER) {
            if (this.props.duration > 24) {
                eventDuration = MULTI_DAY_EVENT_MSG;
            }
            if (this.props.defaultDurationFlag) {
                eventDuration = APPROX_DURATION_MSG;
            }
        }
        else {
            eventDuration = "";
        }

        return (
            <table className="moreInfoTable">
                <tbody>
                {this.renderCTAElement()}
                <tr>
                  <td><b>Phone Number: </b>{this.props.phone}</td>
              </tr>
              <tr>
                  <td><b>Address: </b>{this.props.address}</td>
              </tr>
              <tr>
                  <td><b>Duration: </b>{eventDuration}</td>
              </tr>
              <tr>
                  {this.renderDescElement()}
              </tr>
              </tbody>
          </table>
      );
    }
  }

  export default MoreInfoView;

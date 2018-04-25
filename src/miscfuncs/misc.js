module.exports = {
    include: function(arr,obj) {
        return (arr.indexOf(obj) !== -1);
    },

    // Returns the index of an object in an array of objects that matches the "name" field
    findEventObjectByName: function(arr,name) {
        // note: the "name" field is hardcoded here (ie an array of objects that contain a key/field called "name"
        // is required!)
        if (arr.length > 0) {
            return arr.map(function (x) { return x.name; }).indexOf(name);
        }
        else return -1;        
    },

    convertMilTime: function (milTime) {
        if (milTime.localeCompare("9999")===0){ //None item is populated with 999 military time
            return "";
        }
        else if (milTime.localeCompare("Food")===0) {
            return "Food"
        }
        if (milTime.length > 0) {            
            if (milTime.length === 3) {
                milTime = "0" + milTime;
            }

            // fetch
            var hours = Number(milTime.substring(0, 2));
            var minutes = Number(milTime.substring(2, 4));
            // var seconds = 0;

            // calculate
            var timeValue;

            if (hours > 0 && hours <= 12) {
                timeValue = "" + hours;
            } else if (hours > 12) {
                timeValue = "" + (hours - 12);
            }
            else if (hours === 0) {
                timeValue = "12";
            }

            timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;  // get minutes
            timeValue += (hours >= 12) ? " P.M." : " A.M.";  // get AM/PM
            return timeValue;
        } else {
            return "";
        }
    },

    round2NearestHundredth: function (number) {
        return Math.round(100*number)/100;
    },

    convertTimeToAMPM: function(resultsArray_in) {
        var resultsArray_out = resultsArray_in.slice();
        var timeConverted;
        for (var i = 0; i < resultsArray_out.length; i++) {
          timeConverted = this.convertMilTime(resultsArray_out[i].time);
          if (timeConverted !== -1) {
            resultsArray_out[i].time = timeConverted;
          }
        }
        return resultsArray_out;
      },
}
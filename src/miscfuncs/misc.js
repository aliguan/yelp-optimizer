module.exports = {
    convertMilTime: function (milTime) {
        if (milTime.localeCompare("9999")===0){ //None item is populated with 999 military time
            return "";
        }        
        if (milTime.length > 0) {            
            if (milTime.length == 3) {
                milTime = "0" + milTime;
            }

            // fetch
            var hours = Number(milTime.substring(0, 2));
            var minutes = Number(milTime.substring(2, 4));
            var seconds = 0;

            // calculate
            var timeValue;

            if (hours > 0 && hours <= 12) {
                timeValue = "" + hours;
            } else if (hours > 12) {
                timeValue = "" + (hours - 12);
            }
            else if (hours == 0) {
                timeValue = "12";
            }

            timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;  // get minutes
            timeValue += (hours >= 12) ? " P.M." : " A.M.";  // get AM/PM
            return timeValue;
        } else {
            return "";
        }
    }
}
Home = {

    init: function() {
        this._setMapSettings();
    },

    _setMapSettings: function() {
        let accessToken = 'pk.eyJ1IjoicmJybnMiLCJhIjoiY2tpNTIwcGJhMDJsZzJxbnF0YXhmMDY1NSJ9._cIg-xSzGD06aLiY3Ggsxg';
        this.map = L.map("map", {
            center: [51.163361, 10.447683],
            zoom: 7
        });
        var sMap = 'https://api.mapbox.com/styles/v1/rbrns/cki68nmns9c6819qu9z6bakwr/';
        L.tileLayer(sMap + 'tiles/{z}/{x}/{y}?access_token=' + accessToken, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            zoom: 18,
        }).addTo(this.map);
    },

    setMapMarker: function(dLat, dLng, sColor) {

        L.circleMarker(L.latLng(dLat, dLng), {
            radius: 2,
            fillOpacity: 1,
            fillColor: sColor,
            fill: true,
            color: sColor
        }).addTo(this.map);

    },

    setBirdLocations: function(aLocations) {
        this._aLocations = aLocations;
    },

    getColorBasedOnHeight: function(dAlt) {

        var aColors = {
            "color1": "#42FF00",
            "color2": "#A1FF0F",
            "color3": "#D8FF00",
            "color4": "#EDFF00",
            "color5": "#FFE207",
            "color6": "#FFBF00",
            "color7": "#FF8900",
            "color8": "#FF3802",
            "color9": "#FF003D",
            "color10": "#FF03B9",
        };

        if (dAlt < 1000) {
            return aColors["color1"];
        } else if (dAlt < 3000) {
            return aColors["color2"];
        } else if (dAlt < 5000) {
            return aColors["color3"];
        } else if (dAlt < 10000) {
            return aColors["color4"];
        } else if (dAlt < 15000) {
            return aColors["color5"];
        } else if (dAlt < 20000) {
            return aColors["color6"];
        } else if (dAlt < 25000) {
            return aColors["color7"];
        } else if (dAlt < 30000) {
            return aColors["color8"];
        } else if (dAlt < 35000) {
            return aColors["color9"];
        } else if (dAlt > 35000) {
            return aColors["color10 "];
        }

    }
}
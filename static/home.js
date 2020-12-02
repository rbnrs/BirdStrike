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

    setMapMarker: function(dLat, dLng) {

        L.circleMarker(L.latLng(dLat, dLng), {
            radius: 4,
            fillOpacity: 1,
            fillColor: 'blue',
            fill: true,
            color: 'blue'
        }).addTo(this.map);

    },

    setBirdLocations: function(aLocations) {
        this._aLocations = aLocations;
    }
}
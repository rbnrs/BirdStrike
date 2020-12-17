Home = {

    _aColors: {
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
    },

    iHighestBird: 0,
    iBirdStrikeCount: 0,


    aGeoArray: {
        aGeoArray1: [],
        aGeoArray2: [],
        aGeoArray3: [],
        aGeoArray4: [],
        aGeoArray5: [],
        aGeoArray6: [],
        aGeoArray7: [],
        aGeoArray8: [],
        aGeoArray9: [],
        aGeoArray10: [],
    },

    aTimeArray: {},


    init: function() {
        this._setMapSettings();
        this.aBirds = [];
    },

    /** 
     * Shows Birdstrike on map based on selected height level
     * Layout will be setted to map after selected
     * @param {int} iHeight height level of Birdstrike
     * @param {Event} oEvent clickevent of Checkbox
     */
    changeMapView: function(iHeight, oEvent) {
        var bChecked = oEvent.target.checked;

        //hide if unselected
        if (bChecked) {
            this.map.setLayoutProperty("kft" + iHeight, 'visibility', 'visible');
        } else {
            this.map.setLayoutProperty("kft" + iHeight, 'visibility', 'none');
        }

    },

    /**
     * Setted Time for time lapse
     * @param {Event} oEvent click event of time lapse dropdown
     */
    changeTime: function(oEvent) {
        var sTimeSelect = oEvent.target.innerText;
        this.iTimeMs = parseInt(sTimeSelect.replace(" ms", ""));
        document.getElementById("timeRef").innerHTML = sTimeSelect;

    },

    /**
     * gets Birdstrike Data via json. 
     * setted items to arrays based on time or height
     * shows info view, if item were loaded
     */
    _readMapData: async function() {

        $.getJSON("../data/", function(data) {
            this.aBirds = data;
            for (var b in this.aBirds) {
                var bird = this.aBirds[b].fields;
                bird.alt = parseFloat(bird.alt);
                bird.lat = parseFloat(bird.lat);
                bird.lng = parseFloat(bird.lng);
                var iMinutes = parseInt(bird.time.split(":")[1]);
                this.setMarkerBasedOnTime(iMinutes, bird);
                this.setMarkerBasedOnHeight(bird.alt, bird);
            }
        }.bind(this)).then(function() {

            this.setGeoJsonMarkers();
            var dCurrentDate = new Date(Date.now());
            var sLocalDate = dCurrentDate.toLocaleDateString();
            var aTimes = dCurrentDate.toLocaleTimeString().split(":", 2);
            var sLocalTime = aTimes[0] + ":" + aTimes[1];

            document.getElementById("count-birdstrike").innerHTML = this.iBirdStrikeCount;
            document.getElementById("highest-birdstrike").innerHTML = "Höchster Vogelschlag: " + Math.round(this.iHighestBird) + " ft";
            document.getElementById("info-update").innerHTML = sLocalDate + "<br>" + sLocalTime + " Uhr";

        }.bind(this));


        //AUTOREFRESH
        /* setTimeout(function() {
        
            }.bind(this), 2000); */
    },

    /**
     * set settings and config for mapview
     */
    _setMapSettings: function() {
        let accessToken = 'pk.eyJ1IjoicmJybnMiLCJhIjoiY2tpNTIwcGJhMDJsZzJxbnF0YXhmMDY1NSJ9._cIg-xSzGD06aLiY3Ggsxg';
        this.map = new mapboxgl.Map({
            accessToken: accessToken,
            container: 'map',
            style: 'mapbox://styles/rbrns/cki68nmns9c6819qu9z6bakwr',
            center: [10.447683, 51.163361],
            zoom: 6
        });

        this.map.on('load', function() {
            console.log("load");
            this._readMapData();
        }.bind(this));

        this.map.on('click', function(oEvent) {
            var oLatLng = oEvent.lngLat;
            if (this.oCurrentMarker) {
                this.oCurrentMarker.remove();
            }
            document.getElementById("info-card").style.visibility = "visible";
            this.setInfoData(oLatLng);
            this.setMapMarker(oLatLng.lat, oLatLng.lng, "#3F9B93");
        }.bind(this));
        //s  var sMap = 'https://api.mapbox.com/styles/v1/rbrns/cki68nmns9c6819qu9z6bakwr/';
    },

    /**
     * set info data to info view based on LatLng
     * @param {Object} oLatLng Object with lat and lng of Location
     */
    setInfoData: function(oLatLng) {

        document.getElementById("info-lat").innerHTML = oLatLng.lat;
        document.getElementById("info-lng").innerHTML = oLatLng.lng;
        document.getElementById("info-bird-dir").style.display = "block";
        document.getElementById("info-risk-con").style.display = "block";
        document.getElementById("info-risk-nosc").style.display = "none";
    },


    /**
     * added Layer to map view based on height level
     * @param {int} iHeight height level
     */
    addLayerToMap: async function(iHeight) {

        this.map.addSource('kft' + iHeight, {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': this.aGeoArray["aGeoArray" + iHeight]
            }
        });

        // Add a symbol layer
        this.map.addLayer({
            'id': 'kft' + iHeight,
            'type': 'circle',
            'layout': {
                'visibility': 'none'
            },
            'source': 'kft' + iHeight,
            'paint': {
                'circle-radius': 2,
                'circle-color': this._aColors["color" + iHeight]
            },
        });
    },

    /**
     * added Layer to map view based on current minute in time lapse
     * @param {int} iMinute minute of time lapse
     */
    addTimeLayerToMap: async function(iMinute) {

        for (var i = 1; i <= 10; i++) {
            if (this.aTimeArray[iMinute][this._aColors["color" + i]] !== undefined && this.aTimeArray[iMinute][this._aColors["color" + i]].length !== 0) {

                var layerId = 'minutes' + iMinute + this._aColors["color" + i];
                this.map.addSource(layerId, {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': this.aTimeArray[iMinute][this._aColors["color" + i]]
                    }
                });

                this.map.addLayer({
                    'id': layerId,
                    'type': 'circle',
                    'layout': {
                        'visibility': 'visible'
                    },
                    'source': layerId,
                    'paint': {
                        'circle-radius': 2,
                        'circle-color': this._aColors["color" + i]
                    },
                });
            }
        }

    },

    /**
     * set geoJson to Map and create Marker for Height Level
     */
    setGeoJsonMarkers: async function() {
        // 10 = count of height level
        for (var i = 1; i <= 10; i++) {
            this.addLayerToMap(i);
        }
    },

    clearMapView: function() {
        this.removeLayers("minutes");
    },

    /**
     * pause Time Lapse
     */
    pauseTimeLapse: function() {
        clearInterval(this._timeLapseInterval);
    },

    /**
     * start Time Lapse
     */
    startTimeLapse: function() {
        this.setGeoJsonTimeMarkers();
    },

    /**
     * set geoJson to Map and create Marker for time lapse
     */
    setGeoJsonTimeMarkers: async function() {

        //return if no ms is selected
        if (!this.iTimeMs) {
            alert("Bitte erst Zeitraffer auswählen");
            return;
        }

        if (!this._currentMinute) {
            this._currentMinute = 0;
        }

        //interval based on timelapse ms
        this._timeLapseInterval = setInterval(function() {
            this.addTimeLayerToMap(this._currentMinute);
            //repeat if minutes = 59
            if (this._currentMinute === 59) {
                this._currentMinute = 0;
                this.removeLayers("minutes");
            } else {
                this._currentMinute++;
            }

        }.bind(this), this.iTimeMs)
    },

    /**
     * remove Layers of Map
     * @param {String} sId substring of id for remove
     */
    removeLayers: function(sId) {
        var aLayers = this.map.getStyle().layers;

        for (var iLayer in aLayers) {
            var oLayer = aLayers[iLayer];
            if (oLayer.id.includes(sId)) {
                this.map.removeLayer(oLayer.id);
                this.map.removeSource(oLayer.id);
            }
        }
    },

    /**
     * set marker to Map
     * @param {float} dLat latitude
     * @param {float} dLng longitude
     * @param {sColor} sColor color 
     */
    setMapMarker: async function(dLat, dLng, sColor) {

        this.oCurrentMarker = new mapboxgl.Marker({
                color: sColor,
            })
            .setLngLat([dLng, dLat])
            .addTo(this.map);
    },


    /**
     * @param {int} iMinutes minute of items time
     * @param {Object} oBird Birdstrike Object
     */
    setMarkerBasedOnTime: function(iMinutes, oBird) {

        if (this.aTimeArray[iMinutes] === undefined) {
            this.aTimeArray[iMinutes] = [];
        }

        var sColor = this.getColorBasedOnHeight(oBird.alt);

        if (this.aTimeArray[iMinutes][sColor] === undefined) {
            this.aTimeArray[iMinutes][sColor] = [];
        }

        this.aTimeArray[iMinutes][sColor].push({
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [oBird.lng, oBird.lat]
            },
        });
    },

    /**
     * get Color based on height level
     * @returns {String} color based on Height
     */
    getColorBasedOnHeight: function(dAlt) {

        if (dAlt < 1000) {
            return this._aColors.color1;
        } else if (dAlt < 3000) {
            return this._aColors.color2;
        } else if (dAlt < 5000) {
            return this._aColors.color3;
        } else if (dAlt < 10000) {
            return this._aColors.color4;
        } else if (dAlt < 15000) {
            return this._aColors.color5;
        } else if (dAlt < 20000) {
            return this._aColors.color6;
        } else if (dAlt < 25000) {
            return this._aColors.color7;
        } else if (dAlt < 30000) {
            return this._aColors.color8;
        } else if (dAlt < 35000) {
            return this._aColors.color9;
        } else if (dAlt > 35000) {
            return this._aColors.color1;
        }
    },

    /**
     * pushs Marker to array for geojson
     * based on height level
     * create geojson feature object
     * @param {float} dAlt height of bird
     * @param {Object} oBird Item of Birdstrike collection
     */
    setMarkerBasedOnHeight: function(dAlt, oBird) {

        if (dAlt < 1000) {
            this.aGeoArray.aGeoArray1.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 3000) {
            this.aGeoArray.aGeoArray2.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 5000) {
            this.aGeoArray.aGeoArray3.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 10000) {
            this.aGeoArray.aGeoArray4.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 15000) {
            this.aGeoArray.aGeoArray5.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 20000) {
            this.aGeoArray.aGeoArray6.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 25000) {
            this.aGeoArray.aGeoArray7.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 30000) {
            this.aGeoArray.aGeoArray8.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 35000) {
            this.aGeoArray.aGeoArray9.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt > 35000) {
            this.aGeoArray.aGeoArray10.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });


        }

        //check if bird is the highest
        if (this.iHighestBird < dAlt) {
            //set highest bird
            this.iHighestBird = dAlt;
        }

        //birdcount
        this.iBirdStrikeCount++;

    }
}
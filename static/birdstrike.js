Birdstrike = {

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
    _aGeoRef: [],

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
        this.bStarted = true;
    },

    /** 
     * Shows Birdstrike on map based on selected height level
     * Layout will be setted to map after selected
     * @param {int} iHeight height level of Birdstrike
     * @param {Event} oEvent clickevent of Checkbox
     */
    changeMapView: function(iHeight, oEvent) {

        var bChecked = oEvent.target.checked;

        if (this._timeLapseInterval !== null) {
            this.clearMapView();
        }
        var oSpan = oEvent.target.parentElement.children[1]; //Checkbox label
        //hide if unselected
        if (bChecked) {
            if (this.map.getLayer("kft" + iHeight)) {
                this.map.setLayoutProperty("kft" + iHeight, 'visibility', 'visible');
                oSpan.style.color = this._aColors["color" + iHeight];
            }

        } else {
            if (this.map.getLayer("kft" + iHeight)) {
                this.map.setLayoutProperty("kft" + iHeight, 'visibility', 'none');
                oSpan.style.color = "white";
            }
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
     * returns Promise with ajax request of birds data
     * set Data to local arrays
     * @param {String} sStartTime Starttime for Request
     * @param {String} sEndTime Endtime for Request
     * @returns {Promise} Promise with ajax request
     */
    _readDataUrlWithTime: async function(sEndTime, sStartTime) {

        return new Promise(function(resolve, reject) {
            //split to get H and min of Time string
            var aStartTime = sStartTime.split(":");
            var aEndTime = sEndTime.split(":");

            //get MS of TimeString
            var iStartTime = (aStartTime[0] * 3600 + aStartTime[1] * 60) * 1000;
            var iEndTime = (aEndTime[0] * 3600 + aEndTime[1] * 60) * 1000;

            $.ajax({
                crossOrigin: true,
                url: "http://localhost:4200/data/birds/" + iStartTime + "/" + iEndTime,
                success: function(oData) {
                    if (this.aBirds === undefined) {
                        this.aBirds = [];
                    }
                    this.aBirds = this.aBirds.concat(oData);
                    for (var b in oData) {
                        var oBird = oData[b];
                        if (oBird.time !== undefined) {
                            oBird.alt = parseFloat(oBird.alt);
                            oBird.lat = parseFloat(oBird.lat);
                            oBird.lng = parseFloat(oBird.lng);
                            oBird.time = this.getTimeString(oBird.time);
                            var iMinutes = parseInt(oBird.time.split(":")[1]);
                            this.setMarkerBasedOnTime(iMinutes, oBird);
                            this.setMarkerBasedOnHeight(oBird.alt, oBird);
                        }

                    }
                    resolve();
                }.bind(this),
                error: function(oError) {
                    console.log(oError);
                    reject();
                }
            });
        }.bind(this));
    },


    /**
     * creates Time String
     * @param {*} iTime time in milliseconds
     * @returns {String} Time String
     */
    getTimeString: function(iTime) {
        var dDate = new Date(iTime);
        var sTimeString = dDate.toLocaleTimeString();
        var aTimeSplit = sTimeString.split(":");
        return aTimeSplit[0] + ":" + aTimeSplit[1];
    },


    /**
     * gets Birdstrike Data via json. 
     * setted items to arrays based on time or height
     * shows info view, if item were loaded
     */
    _readMapData: async function() {

        this.resetMapData();
        var dStartTime = new Date(Date.now());
        var aRequests = [];
        var iQueries = 60;
        for (var iQuery = 0; iQuery < iQueries; iQuery++) {
            var dEndTime = new Date(dStartTime);
            dEndTime = new Date(dEndTime.setMinutes(dEndTime.getMinutes() - 60 / iQueries));
            var aStartTimes = dStartTime.toLocaleTimeString().split(":", 2);
            var sStartTime = aStartTimes[0] + ":" + aStartTimes[1];
            var aEndTimes = dEndTime.toLocaleTimeString().split(":", 2);
            var sEndTime = aEndTimes[0] + ":" + aEndTimes[1];

            aRequests.push({
                "start": sStartTime,
                "end": sEndTime
            });
            dStartTime = dEndTime;
        }


        var aPromises = [];

        for (var i = 0; i < 60; i++) {
            aPromises.push(this._readDataUrlWithTime(aRequests[i].start, aRequests[i].end));
        }

        //split requests for better performance
        Promise.all(
            aPromises
        ).then(function() {

            this.setGeoJsonMarkers();
            this.addTimeLayerToMap();
            var dCurrentDate = new Date(Date.now());
            var sLocalDate = dCurrentDate.toLocaleDateString();
            var aTimes = dCurrentDate.toLocaleTimeString().split(":", 2);
            var sLocalTime = aTimes[0] + ":" + aTimes[1];

            document.getElementById("count-birdstrike").innerHTML = this.iBirdStrikeCount;
            document.getElementById("highest-birdstrike").innerHTML = "Höchste Meldung: " + Math.round(this.iHighestBird) + " ft";
            document.getElementById("info-update").innerHTML = sLocalDate + "<br>" + sLocalTime + " Uhr";
            if (this.bStarted) {
                document.getElementById("loading-panel").style.display = "none";
                document.getElementById("control-panel").style.display = "";
                document.getElementById("map").style.visibility = "visible";
                this.bStarted = false;
            }
        }.bind(this)).catch(function(e) {
            console.log("REST Server error. Lost connection");
            document.getElementById("loading-panel").style.display = "none";
            document.getElementById("control-panel").style.display = "none";
            document.getElementById("smww-panel").style.display = "";
            document.getElementById("map").style.visibility = "none";
            this.oRefreshInterval = null;
        }.bind(this));
    },

    /**
     * reset Map Data for new Requests
     */
    resetMapData: function() {
        this.aGeoArray = {
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
        };

        this.aTimeArray = {};
        this.iHighestBird = 0;
        this.iBirdStrikeCount = 0;
    },

    /**
     * set settings and config for mapview
     */
    _setMapSettings: function() {
        //Set GeoRef
        this.createGeoRefSquares("NK", "E", 4, "B", 46, "QL");
        this.createGeoRefSquares("PK", "A", 15, "B", 46, "BL");
        let accessToken = 'pk.eyJ1IjoicmJybnMiLCJhIjoiY2tpNTIwcGJhMDJsZzJxbnF0YXhmMDY1NSJ9._cIg-xSzGD06aLiY3Ggsxg';
        this.map = new mapboxgl.Map({
            accessToken: accessToken,
            container: 'map',
            style: 'mapbox://styles/rbrns/cki68nmns9c6819qu9z6bakwr?optimize=true',
            center: [10.447683, 51.163361],
            minZoom: 5,
            zoom: 6
        });

        this.map.on('load', function() {
            this._readMapData();
            this.createGeoRefGeoJson();
            this.createGeoZoneInner(4, 46, 17, 56);

            this.map.on('click', function(oEvent) {
                this.oLatLng = oEvent.lngLat;
                if (this.oCurrentMarker) {
                    this.oCurrentMarker.remove();
                }
                document.getElementById("info-card").style.visibility = "visible";
                document.getElementById("crosssecbtn").style.visibility = "visible";
                this.setMapMarker(this.oLatLng.lat, this.oLatLng.lng, "#3F9B93");
            }.bind(this));

            this.map.on('zoom', function() {

                fCurrentZoom = this.map.getZoom();
                //Zoom In
                if (fCurrentZoom > 7.5) {
                    this.changePointRadiusOnLayers("minutes", 3);
                    this.changePointRadiusOnLayers("kft", 3);

                } else if (fCurrentZoom > 5.5 && fCurrentZoom < 7.5) {

                    this.changePointRadiusOnLayers("minutes", 2);
                    this.changePointRadiusOnLayers("kft", 2);

                } else if (fCurrentZoom < 5.5) {
                    this.changePointRadiusOnLayers("minutes", 1);
                    this.changePointRadiusOnLayers("kft", 1);
                }

            }.bind(this));

            this.oRefreshInterval = setInterval(async function() {
                this.removeLayers("kft");
                this.removeLayers("minutes");
                this._readMapData();
            }.bind(this), 1000 * 60 * 5)
        }.bind(this));
    },


    /**
     * set info data to info view based on LatLng
     * @param {Object} oLatLng Object with lat and lng of Location
     */
    setInfoData: function(sAdress) {

        document.getElementById("info-address").innerHTML = sAdress;
        document.getElementById("info-latlng").innerHTML = this.oLatLng.lat + "<br>" + this.oLatLng.lng;
        document.getElementById("info-bird-dir").style.display = "block";
        document.getElementById("info-risk-con").style.display = "block";
        document.getElementById("info-risk-nosc").style.display = "none";
    },

    /**
     * returns next char in alphabet
     * @param {String} cChar char get next one  
     */
    nextChar: function(cChar) {

        var cCharNext = String.fromCharCode(cChar.charCodeAt(0) + 1);

        if (cCharNext !== "I" && cCharNext !== "O") {
            return cCharNext;
        }
        return String.fromCharCode(cCharNext.charCodeAt(0) + 1);;
    },

    /**
     * added Layer to map view based on height level
     * @param {int} iHeight height level
     */
    addLayerToMap: async function(iHeight) {


        if (this.map.getLayer('kft' + iHeight)) {
            this.map.removeLayer('kft' + iHeight);
        }
        if (this.map.getSource('kft' + iHeight)) {
            this.map.removeSource('kft' + iHeight);
        }

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

        //popup for  birdstrike alert
        this.mappopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        this.map.on('mouseenter', 'kft' + iHeight, function(oLayer) {
            this.map.getCanvas().style.cursor = 'pointer';
            var coordinates = oLayer.features[0].geometry.coordinates.slice();
            var description = oLayer.features[0].properties.description;
            this.mappopup.setLngLat(coordinates).setHTML(description).addTo(this.map);
        }.bind(this));

        this.map.on('mouseleave', 'kft' + iHeight, function() {
            this.map.getCanvas().style.cursor = '';
            this.mappopup.remove();
        }.bind(this));
    },

    /**
     * added Layer to map view based on current minute in time lapse
     * @param {int} iMinute minute of time lapse
     */
    addTimeLayerToMap: async function() {

        for (var iMinute = 1; iMinute < 60; iMinute++) {
            for (var iColor = 1; iColor <= 10; iColor++) {
                if (this.aTimeArray[iMinute] !== undefined && this.aTimeArray[iMinute][this._aColors["color" + iColor]] !== undefined && this.aTimeArray[iMinute][this._aColors["color" + iColor]].length !== 0) {

                    var layerId = 'minutes' + iMinute + this._aColors["color" + iColor];
                    if (this.map.getLayer(layerId)) {
                        this.map.removeLayer(layerId);
                    }
                    if (this.map.getSource(layerId)) {
                        this.map.removeSource(layerId);
                    }
                    this.map.addSource(layerId, {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': this.aTimeArray[iMinute][this._aColors["color" + iColor]]
                        }
                    });

                    this.map.addLayer({
                        'id': layerId,
                        'type': 'circle',
                        'layout': {
                            'visibility': 'none'
                        },
                        'source': layerId,
                        'paint': {
                            'circle-radius': 2,
                            'circle-color': this._aColors["color" + iColor]
                        },
                    });


                }
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
        clearInterval(this._timeLapseInterval);
        this.noneVisibleLayers("minutes");
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

        for (var i = 1; i <= 10; i++) {
            document.getElementById("cbheight" + i).checked = false;
            var oEvent = {
                "target": {
                    "checked": false,
                    "parentElement": {
                        "children": [null, document.getElementById("spanheight" + i)]
                    }
                },

            };
            this.changeMapView(i, oEvent);
        }

        if (!this._currentMinute) {
            this._currentMinute = 0;
        }

        //interval based on timelapse ms
        this._timeLapseInterval = setInterval(async function() {
            for (var iColor = 1; iColor <= 10; iColor++) {
                var layerId = 'minutes' + this._currentMinute + this._aColors["color" + iColor];
                if (this.map.getLayer(layerId)) {
                    this.map.setLayoutProperty(layerId, 'visibility', 'visible');
                }

            }
            //repeat if minutes = 59
            if (this._currentMinute === 59) {
                this._currentMinute = 0;
                this.noneVisibleLayers("minutes");
            } else {
                this._currentMinute++;
            }

        }.bind(this), this.iTimeMs)
    },

    /**
     * hide Layers in Time Lapse
     * @param {String} sId id of Layer for none visibility
     */
    noneVisibleLayers: function(sId) {

        var aLayers = this.map.getStyle().layers;
        var oLayerGeoRef;

        for (var iLayer in aLayers) {
            var oLayer = aLayers[iLayer];
            if (oLayer.id.includes(sId)) {
                this.map.setLayoutProperty(oLayer.id, 'visibility', 'none', {
                    "validate": true
                });
                if (sId === "georef") {
                    oLayerGeoRef = oLayer;
                }
            }
        }
        return oLayerGeoRef;
    },

    /**
     * hide Layers in Time Lapse
     * @param {String} sId id of Layer for none visibility
     * @returns {Object} layer of map
     */
    visibleLayers: function(sId) {

        var aLayers = this.map.getStyle().layers;
        var oLayerGeoRef;
        for (var iLayer in aLayers) {
            var oLayer = aLayers[iLayer];
            if (oLayer.id.includes(sId)) {
                this.map.setLayoutProperty(oLayer.id, 'visibility', 'visible', {
                    "validate": true
                });
                if (sId === "georef") {
                    oLayerGeoRef = oLayer;
                }
            }
        }

        return oLayerGeoRef;
    },

    /**
     * changes Radius of Birdstrike point
     * @param {*} sId substring of layer id
     */
    changePointRadiusOnLayers: function(sId, iRadius) {
        var aLayers = this.map.getStyle().layers;
        for (var iLayer in aLayers) {
            var oLayer = aLayers[iLayer];
            if (oLayer.id.includes(sId)) {
                this.map.setPaintProperty(oLayer.id, 'circle-radius', iRadius);
            }
        }
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

        var sAccessToken = "pk.eyJ1IjoicmJybnMiLCJhIjoiY2tpNTIwcGJhMDJsZzJxbnF0YXhmMDY1NSJ9._cIg-xSzGD06aLiY3Ggsxg"
        this.oCurrentMarker = new mapboxgl.Marker({
                color: sColor,
            })
            .setLngLat([dLng, dLat])
            .addTo(this.map);
        //update address to info view    
        var sQuery = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + dLng + "," + dLat + ".json?access_token=" + sAccessToken;
        $.get(sQuery, function(oData) {
            try {
                var sAddress = oData["features"][0]["place_name"];
                this.setInfoData(sAddress);
            } catch (oError) {
                this.setInfoData("Keine Adresse verfügbar");
            }
        }.bind(this));
    },


    /**
     * creates GeoJson for markers based on time
     * @param {int} iMinutes minute of items time
     * @param {Object} oBird Birdstrike Object
     */
    setMarkerBasedOnTime: function(iMinutes, oBird) {

        if (this.aTimeArray[iMinutes] === undefined) {
            this.aTimeArray[iMinutes] = [];
        }

        var sColor = this._aColors["color" + this.getHeightLevelBasedOnHeight(oBird.alt)];

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
     * get Level based on Birds Height
     * @param {float} dAlt Height
     */
    getHeightLevelBasedOnHeight: function(dAlt) {
        if (dAlt < 1000) {
            return 1;
        } else if (dAlt < 3000) {
            return 2;
        } else if (dAlt < 5000) {
            return 3;
        } else if (dAlt < 10000) {
            return 4;
        } else if (dAlt < 15000) {
            return 5;
        } else if (dAlt < 20000) {
            return 6;
        } else if (dAlt < 25000) {
            return 7;
        } else if (dAlt < 30000) {
            return 8;
        } else if (dAlt < 35000) {
            return 9;
        } else if (dAlt > 35000) {
            return 10;
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

        var sGeoRef;
        for (var i = 0; i < this._aGeoRef.length; i++) {
            var oGeoRef = this._aGeoRef[i];
            if (oBird.lat > oGeoRef.latStart && oBird.lat < oGeoRef.latEnd && oBird.lng > oGeoRef.lngStart && oBird.lng < oGeoRef.lngEnd) {
                sGeoRef = "GeoRef: " + oGeoRef.zone + oGeoRef.letter + "<br>Lat: " + oBird.lat + "<br>Lng: " + oBird.lng + "<br>Höhe: " + dAlt + " ft";
                break;
            }
        }

        if (dAlt < 1000) {
            this.aGeoArray.aGeoArray1.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 3000) {
            this.aGeoArray.aGeoArray2.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 5000) {
            this.aGeoArray.aGeoArray3.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 10000) {
            this.aGeoArray.aGeoArray4.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 15000) {
            this.aGeoArray.aGeoArray5.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 20000) {
            this.aGeoArray.aGeoArray6.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 25000) {
            this.aGeoArray.aGeoArray7.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 30000) {
            this.aGeoArray.aGeoArray8.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt < 35000) {
            this.aGeoArray.aGeoArray9.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [oBird.lng, oBird.lat]
                },
            });
        } else if (dAlt > 35000) {
            this.aGeoArray.aGeoArray10.push({
                // feature for Mapbox DC
                'type': 'Feature',
                'properties': {
                    'description': sGeoRef
                },
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

    },


    /**
     * set grid view of geo squares
     */
    setGeoRefSquares: async function(oEvent) {
        var bChecked = oEvent.target.checked;
        if (bChecked) {
            this.oLoadingModal.open();
            var oLayer = this.visibleLayers("georef");
            this.map.on('render', oLayer.id, function() {
                this.oLoadingModal.close();
            }.bind(this));

        } else {
            var oLayer = this.noneVisibleLayers("georef");
        }
    },


    /**
     * 
     * creates Array with GeoRef squares 
     * @param {String} sZone zone of georef grid. Square with 15 x 15
     * @param {String} sStartLetter First Letter of GeoRef grid 
     * @param {int} iStartLength Length of GeoRef grid
     * @param {String} sLastLetter Last Letter of GeoRef grid
     * @param {int} iStartHeight start height of GeoRef grid
     * @param {String} sEndPoint Last square in GeoRef Grid -> example: Draw AA - CL, then CL ist the last square
     */
    createGeoRefSquares: async function(sZone, sStartLetter, iStartLength, sLastLetter, iStartHeight, sEndPoint) {

        bGeoRef = false;
        iHeight = iStartHeight;

        while (!bGeoRef) {
            sFirstLetter = sStartLetter;
            iLength = iStartLength;
            iBegin = this.getStartPosition(sStartLetter);
            iStopPos = this.getStartPosition(sEndPoint[0]) + 2;
            for (var i = 0; i < iStopPos - iBegin - 1; i++) {
                this._aGeoRef.push({
                    'lngStart': iLength + i,
                    'latStart': iHeight,
                    'lngEnd': iLength + i + 1,
                    'latEnd': iHeight + 1,
                    'letter': sFirstLetter + sLastLetter,
                    'zone': sZone
                });
                sFirstLetter = this.nextChar(sFirstLetter);
            }

            iHeight++;
            sLastLetter = this.nextChar(sLastLetter);

            var oLastGeoRef = this._aGeoRef[this._aGeoRef.length - 1];

            if (oLastGeoRef.letter === sEndPoint) {

                bGeoRef = true;
            }

        }
    },

    /**
     * creates GeoRef Zones and draw them to map
     * @param {Array} aGeoZone Array with GeoRef Zones 
     */
    createGeoRefZones: async function(aGeoZone) {
        this.bGeoZone = true;
        var sId;
        for (var i = 0; i < aGeoZone.length - 1; i++) {
            var oGeoFirstRef = aGeoZone[i];
            var oGeoSecondRef = aGeoZone[i + 1];

            sId = oGeoFirstRef + oGeoSecondRef + "georef";

            this.map.addSource(sId, {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [oGeoFirstRef[1], oGeoFirstRef[2]],
                            [oGeoSecondRef[1], oGeoSecondRef[2]]
                        ]
                    }
                }
            });

            this.map.addLayer({
                'id': sId,
                'type': 'line',
                'source': sId,
                'layout': {
                    'visibility': 'none',
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#3F9B93',
                    'line-width': 1
                }
            });
        }


    },

    /**
     * draws georef square lines within georef grid (1 degress lines)
     * @param {int} iStartLength Startpoint for line latitude
     * @param {int} iStartHeight Startpoint for line longitude
     * @param {int} iEndLength Endpoint for line latitude
     * @param {int} iEndHeight Endpoint for line longitude
     */
    createGeoZoneInner: async function(iStartLength, iStartHeight, iEndLength, iEndHeight) {

        var sId,
            iHeigth = iStartHeight;

        for (var i = 1; i < iEndLength - iStartLength; i++) {
            sId = iStartLength + i + iHeigth;

            this.map.addSource(sId + 'vLinegeoref', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [iStartLength + i, iHeigth],
                            [iStartLength + i, iEndHeight]
                        ]
                    }
                }
            });

            this.map.addLayer({
                'id': sId + 'vLinegeoref',
                'type': 'line',
                'source': sId + 'vLinegeoref',
                'layout': {
                    'visibility': 'none',
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#3F9B93',
                    'line-width': 1
                }
            });
        }

        for (var i = 1; i < iEndHeight - iStartHeight; i++) {
            sId = iStartHeight + i + iStartLength;

            this.map.addSource(sId + 'hLinegeoref', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [iStartLength, iStartHeight + i],
                            [iEndLength, iStartHeight + i]
                        ]
                    }
                }
            });

            this.map.addLayer({
                'id': sId + 'hLinegeoref',
                'type': 'line',
                'source': sId + 'hLinegeoref',
                'layout': {
                    'visibility': 'none',
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#3F9B93',
                    'line-width': 1
                }
            });
        }


        this.createGeoRefZones([
            ['EN', 4, 56],
            ['EB', 4, 46],
            ['QB', 17, 46],
            ['NKRT', 17, 56],
            ['EN', 4, 56],
            ['AK', 15, 56],
            ['AK', 15, 46],
        ]);

    },

    /**
     * create Geo Json Zones for GeoRefSystem grid
     */
    createGeoRefGeoJson: async function() {

        for (var i = 0; i < this._aGeoRef.length; i++) {
            var oGeoRef = this._aGeoRef[i];

            var sId = oGeoRef.letter + oGeoRef.zone + 'areageoref';
            this.map.addSource(sId, {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [
                            oGeoRef.lngStart + 0.5, oGeoRef.latStart + 0.5
                        ]
                    }
                }
            });

            this.map.addLayer({
                "id": sId,
                "type": "symbol",
                "source": sId,
                "layout": {
                    "visibility": "none",
                    "text-field": oGeoRef.zone + oGeoRef.letter,
                    "text-size": 13,
                },
                "paint": {
                    "text-color": "#3F9B93"
                }
            });
        }

    },

    /**
     * returns the position of the char coordinate
     * @param {String} cChar char get next one  
     */
    getStartPosition: function(cChar) {
        var sCoordinates = 'ABCDEFGHJKLMNPQ';

        for (var i = 0; i < 15; i++) {
            var cRes = sCoordinates.charAt(i);
            if (cRes == cChar) {
                return i + 1;
            }
        }

    },

    /**
     * open Cross-Section Dialog
     */
    openCrossSectionDialog: function() {
        this.iRadius = 50;
        this.setDataToCrossSectionDialog();
        this.oCrossSectionModal.open();
    },


    /**
     * handles change of Range in Cross-Section Dialog
     * @param {Event} oEvent change Event of Range in Cross-Section Dialog
     */
    changeDialogRadius: function(oEvent) {

        this.iRadius = parseInt(oEvent.target.value);
        this.oCrossSectionChart.data = this.createCharData();
        this.oCrossSectionChart.update();
    },


    /**
     * creates Dataset for Cross-Section Chart
     * @returns {Object} Object with dataset for birdstrike chart
     */
    createCharData: function() {
        var oDataSet = {
            aDataSetColor1: [],
            aDataSetColor2: [],
            aDataSetColor3: [],
            aDataSetColor4: [],
            aDataSetColor5: [],
            aDataSetColor6: [],
            aDataSetColor7: [],
            aDataSetColor8: [],
            aDataSetColor9: [],
            aDataSetColor10: []
        };

        for (var iPos = 0; iPos < this.aBirds.length; iPos++) {
            var oBird = this.aBirds[iPos];
            var oOptions = {
                units: 'kilometers'
            }
            var fDistance = turf.distance([this.oLatLng.lat, this.oLatLng.lng], [oBird.lat, oBird.lng], oOptions)
            if (fDistance <= this.iRadius) {
                var oData = {
                    x: oBird.lat,
                    y: oBird.alt,
                    r: 2
                };
                oDataSet["aDataSetColor" + this.getHeightLevelBasedOnHeight(oData.y)].push(oData);
            }
        }

        return {
            datasets: [{
                    label: "< 1 kft",
                    backgroundColor: this._aColors["color1"],
                    borderColor: this._aColors["color1"],
                    data: oDataSet["aDataSetColor" + 1]
                },
                {
                    label: "1 - 3 kft",
                    backgroundColor: this._aColors["color2"],
                    borderColor: this._aColors["color2"],
                    data: oDataSet["aDataSetColor" + 2]
                },
                {
                    label: "3 - 5 kft",
                    backgroundColor: this._aColors["color3"],
                    borderColor: this._aColors["color3"],
                    data: oDataSet["aDataSetColor" + 3]
                },
                {
                    label: "5 - 10 kft",
                    backgroundColor: this._aColors["color4"],
                    borderColor: this._aColors["color4"],
                    data: oDataSet["aDataSetColor" + 4]
                },
                {
                    label: "10 - 15 kft",
                    backgroundColor: this._aColors["color5"],
                    borderColor: this._aColors["color5"],
                    data: oDataSet["aDataSetColor" + 5]
                },
                {
                    label: "15 - 20 kft",
                    backgroundColor: this._aColors["color6"],
                    borderColor: this._aColors["color6"],
                    data: oDataSet["aDataSetColor" + 6]
                },
                {
                    label: "20 - 25 kft",
                    backgroundColor: this._aColors["color7"],
                    borderColor: this._aColors["color7"],
                    data: oDataSet["aDataSetColor" + 7]
                },
                {
                    label: "25 - 30 kft",
                    backgroundColor: this._aColors["color8"],
                    borderColor: this._aColors["color8"],
                    data: oDataSet["aDataSetColor" + 8]
                },
                {

                    label: "30 - 35 kft",
                    backgroundColor: this._aColors["color9"],
                    borderColor: this._aColors["color9"],
                    data: oDataSet["aDataSetColor" + 9]
                },
                {
                    label: "> 35 kft",
                    backgroundColor: this._aColors["color10"],
                    borderColor: this._aColors["color10"],
                    data: oDataSet["aDataSetColor" + 10]
                },


            ]
        };
    },

    /**
     * creates Cross-Section Chart and Dialog
     */
    setDataToCrossSectionDialog: function() {

        var oCrossSectionCanvas = document.getElementById('crosssectionchart');

        this.oCrossSectionChart = new Chart(oCrossSectionCanvas, {
            type: 'bubble',
            showTooltips: false,
            data: this.createCharData(),
            options: {
                legend: {
                    position: "top"
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: "Vogelschwarm Höhe"
                        },
                        ticks: {
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: "Standort: " + this.oLatLng.lat + "," + this.oLatLng.lng
                        }
                    }]
                }
            }
        });

    },

    /**
     * Setter for modals
     * @param {Array} oInstancesModals Array with Modal instance
     */
    setModalInstances: function(oInstancesModals) {
        this.oCrossSectionModal = oInstancesModals[0];
        this.oLoadingModal = oInstancesModals[1];
    }

}
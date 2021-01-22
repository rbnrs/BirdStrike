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
    _aGeoRef: [],
    _aGeoZone: [],
    _aGeoZoneZoom: [],
    _aGeoLetterZoom: [],
    bGeoRefSet: false,
    bGeoZone: false,
    bGeoZoneZoom: false,
    bGeoLetterZoom: false,
    bGeoZoneZoomVisible: false,
    bGeoLetterZoomVisible: false,
    sZone: "NK",

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


    init: function () {
        this.iStartTime = Date.now();
        this._setMapSettings();
        this.bStarted = true;
    },

    /** 
     * Shows Birdstrike on map based on selected height level
     * Layout will be setted to map after selected
     * @param {int} iHeight height level of Birdstrike
     * @param {Event} oEvent clickevent of Checkbox
     */
    changeMapView: function (iHeight, oEvent) {
        var bChecked = oEvent.target.checked;
        var oSpan = oEvent.target.parentElement.children[1]; //Checkbox label
        //hide if unselected
        if (bChecked) {
            this.map.setLayoutProperty("kft" + iHeight, 'visibility', 'visible');
            oSpan.style.color = this._aColors["color" + iHeight];
        } else {
            this.map.setLayoutProperty("kft" + iHeight, 'visibility', 'none');
            oSpan.style.color = "white";
        }

    },

    /**
     * Setted Time for time lapse
     * @param {Event} oEvent click event of time lapse dropdown
     */
    changeTime: function (oEvent) {
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
    _readDataUrlWithTime: async function (sStartTime, sEndTime) {

        return new Promise(function (resolve, reject) {
            $.getJSON("../data/birds/" + sStartTime + "/" + sEndTime, function (oData) {
                this.aBirds = oData;
                for (var b in this.aBirds) {
                    var oBird = this.aBirds[b];
                    oBird = {
                        "lat": oBird[1],
                        "lng": oBird[2],
                        "alt": oBird[3],
                        "time": oBird[4]
                    };
                    //var oBird = this.aBirds[b].fields;

                    oBird.alt = parseFloat(oBird.alt);
                    oBird.lat = parseFloat(oBird.lat);
                    oBird.lng = parseFloat(oBird.lng);
                    var iMinutes = parseInt(oBird.time.split(":")[1]);
                    this.setMarkerBasedOnTime(iMinutes, oBird);
                    this.setMarkerBasedOnHeight(oBird.alt, oBird);
                }
                resolve();
            }.bind(this)).catch(function () {
                reject();
            });
        }.bind(this));
    },


    /**
     * gets Birdstrike Data via json. 
     * setted items to arrays based on time or height
     * shows info view, if item were loaded
     */
    _readMapData: async function () {


        var dStartTime = new Date(Date.now());
        var aRequests = [];
        var iQueries = 5;
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

        for (var i = 0; i < 5; i++) {
            aPromises.push(this._readDataUrlWithTime(aRequests[i].start, aRequests[i].end));
        }

        //split requests for better performance
        Promise.all(aPromises).then(function () {

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

        }.bind(this));
    },

    /**
     * set settings and config for mapview
     */
    _setMapSettings: function () {
        let accessToken = 'pk.eyJ1IjoicmJybnMiLCJhIjoiY2tpNTIwcGJhMDJsZzJxbnF0YXhmMDY1NSJ9._cIg-xSzGD06aLiY3Ggsxg';
        this.map = new mapboxgl.Map({
            accessToken: accessToken,
            container: 'map',
            style: 'mapbox://styles/rbrns/cki68nmns9c6819qu9z6bakwr?optimize=true',
            center: [10.447683, 51.163361],
            zoom: 6
        });

        this.map.on('load', function () {
            this._readMapData();

            setInterval(function () {
                this.removeLayers("kft");
                this._readMapData();
            }.bind(this), 1000 * 60 * 5)
        }.bind(this));

        this.map.on('click', function (oEvent) {
            this.oLatLng = oEvent.lngLat;
            if (this.oCurrentMarker) {
                this.oCurrentMarker.remove();
            }
            document.getElementById("info-card").style.visibility = "visible";
            document.getElementById("crosssecbtn").style.visibility = "visible";
            this.setMapMarker(this.oLatLng.lat, this.oLatLng.lng, "#3F9B93");
        }.bind(this));
        //s  var sMap = 'https://api.mapbox.com/styles/v1/rbrns/cki68nmns9c6819qu9z6bakwr/';

        this.map.on('zoom', function () {
            currentZoom = this.map.getZoom();
            if (this.bGeoZoneZoom === false) {
                if (currentZoom > 7.5) {

                    this.bGeoZoneZoom = true;

                    if (this.bGeoZoneZoomVisible === true) {
                        for (var i = 0; i <= this._aGeoZoneZoom.length; i++) {
                            oGeoZoneZoom = this._aGeoZoneZoom[i];
                            this.map.setLayoutProperty(oGeoZoneZoom.id, 'visibility', 'visible');
                        }
                    }

                }
            }

            if (this.bGeoZoneZoom === true) {
                if (currentZoom < 7.5) {

                    this.bGeoZoneZoom = false;
                    for (var i = 0; i <= this._aGeoZoneZoom.length; i++) {
                        oGeoZoneZoom = this._aGeoZoneZoom[i];
                        this.map.setLayoutProperty(oGeoZoneZoom.id, 'visibility', 'none');
                    }
                }
            }


            if (this.bGeoLetterZoom === false) {
                if (currentZoom > 5.5) {

                    this.bGeoLetterZoom = true;

                    if (this.bGeoLetterZoomVisible === true) {
                        for (var i = 0; i <= this._aGeoLetterZoom.length; i++) {
                            oGeoLetterZoom = this._aGeoLetterZoom[i];
                            this.map.setLayoutProperty(oGeoLetterZoom.id, 'visibility', 'visible');
                        }
                    }

                }
            }

            if (this.bGeoLetterZoom === true) {
                if (currentZoom < 5.5) {

                    this.bGeoLetterZoom = false;
                   
                    for (var i = 0; i <= this._aGeoLetterZoom.length; i++) {
                    
                        oGeoLetterZoom = this._aGeoLetterZoom[i];
                        console.log(oGeoLetterZoom);
                        this.map.setLayoutProperty(oGeoLetterZoom.id, 'visibility', 'none');
                    }
                }
            }





        }.bind(this));
    },


    /**
     * set info data to info view based on LatLng
     * @param {Object} oLatLng Object with lat and lng of Location
     */
    setInfoData: function (sAdress) {

        document.getElementById("info-address").innerHTML = sAdress;
        document.getElementById("info-latlng").innerHTML = this.oLatLng.lat + "<br>" + this.oLatLng.lng;
        document.getElementById("info-bird-dir").style.display = "block";
        document.getElementById("info-risk-con").style.display = "block";
        document.getElementById("info-risk-nosc").style.display = "none";
    },


    /**
     * set grid view of geo squares
     */
    setGeoRefSquares: function (oEvent) {
        var bChecked = oEvent.target.checked;


        if (this.bGeoRefSet == false) {

            this.createGeoZoneZoom(4, 46, 17, 56);

            //Teil Deutschland
            this.sZone = "NK";
            this.createGeoRefSquares("E", 4, "B", 46, "QL");

            //Teil Polen
            this.sZone = "PK";
            this.createGeoRefSquares("A", 15, "B", 46, "BL");
        }

        if (this.bGeoRefSet == true) {
            if (bChecked) {
                this.bGeoZoneZoomVisible = true;
                this.bGeoLetterZoomVisible = true;
                for (var i = 0; i <= this._aGeoRef.length; i++) {
                    _oGeoRef = this._aGeoRef[i];
                    this.map.setLayoutProperty(_oGeoRef.letter + _oGeoRef.length + _oGeoRef.heigth, 'visibility', 'visible');
                    this.map.setLayoutProperty(_oGeoRef.letter + 'area', 'visibility', 'visible');
                    if (i < this._aGeoZone.length) {
                        _oGeoRefZone = this._aGeoZone[i];
                        this.map.setLayoutProperty(_oGeoRefZone.id, 'visibility', 'visible');
                    }
                }
            } else {
                this.bGeoZoneZoomVisible = false;
                this.bGeoLetterZoomVisible = false;
                for (var i = 0; i <= this._aGeoRef.length; i++) {
                    _oGeoRef = this._aGeoRef[i];
                    this.map.setLayoutProperty(_oGeoRef.letter + _oGeoRef.length + _oGeoRef.heigth, 'visibility', 'none');
                    this.map.setLayoutProperty(_oGeoRef.letter + 'area', 'visibility', 'none');
                    if (i < this._aGeoZone.length) {
                        _oGeoRefZone = this._aGeoZone[i];
                        this.map.setLayoutProperty(_oGeoRefZone.id, 'visibility', 'none');
                    }
                }
            }
        }
        this.bGeoRefSet = true;
    },




    //TODO TEST IT 
    //global georef system --- OVERWRITE IT
    createGeoRefSquares: async function (startLetter, startLength, lastLetter, startHeight, endPoint) {

        aGeoRef = [];
        geoRef = false;
        heigth = startHeight;

        while (geoRef == false) {
            firstLetter = startLetter;
            length = startLength;
            beginn = this.getStartPosition(startLetter);
            stopPos = this.getStartPosition(endPoint[0]) + 2;

            for (var i = 1; i < stopPos - beginn; i++) {

                if (i === 1) {
                    aGeoRef.push({
                        'length': startLength,
                        'heigth': heigth,
                        'letter': "y",
                    });

                    this._aGeoRef.push({
                        'length': startLength,
                        'heigth': heigth,
                        'letter': "y",
                    });
                }

                aGeoRef.push({
                    'length': length + i,
                    'heigth': heigth,
                    'letter': firstLetter + lastLetter,
                });

                this._aGeoRef.push({
                    'length': length + i,
                    'heigth': heigth,
                    'letter': firstLetter + lastLetter,
                });

                firstLetter = this.nextChar(firstLetter);
            }

            heigth = heigth + 1;
            lastLetter = this.nextChar(lastLetter);

            lastGeoRef = aGeoRef[aGeoRef.length - 1];

            if (lastGeoRef.letter === endPoint) {

                aGeoRef.push({
                    'length': startLength,
                    'heigth': heigth,
                    'letter': "c",
                });

                this._aGeoRef.push({
                    'length': startLength,
                    'heigth': heigth,
                    'letter': "c",
                });

                for (var i = 1; i < stopPos - beginn; i++) {

                    aGeoRef.push({
                        'length': length + i,
                        'heigth': heigth,
                        'letter': "x",
                    });

                    this._aGeoRef.push({
                        'length': length + i,
                        'heigth': heigth,
                        'letter': "x",
                    });
                }

                geoRef = true;

            }

        }

        this.createGeoRefGeoJson();
    },

    createGeoRefZones: async function (aGeoZone) {
        this.bGeoZone = true;
        for (var i = 0; i < aGeoZone.length; i++) {
            var oGeoFirstRef = aGeoZone[i];
            var oGeoSecondRef = aGeoZone[i + 1];

            id = oGeoFirstRef + oGeoSecondRef + "zLine";

            this.map.addSource(id, {
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
                'id': id,
                'type': 'line',
                'source': id,
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#00BFFF',
                    'line-width': 1
                }
            });

            this.map.setLayoutProperty(id, 'visibility', 'none');

            this._aGeoZoneZoom.push({
                'id': id,
            });
        }


    },


    createGeoZoneZoom: async function (startLength, startHeight, endLength, endHeight) {

        aGeoZoneZoom = [];
        this.bGeoZoneZoomVisible = true;
        this.bGeoLetterZoomVisible = true;

        heigth = startHeight;
        //this.createGeoZoneZoom(4, 46, 17, 56);

        for (var i = 1; i < endLength - startLength; i++) {
            id = startLength + i + heigth;

            this.map.addSource(id + 'vLine', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [startLength + i, heigth],
                            [startLength + i, endHeight]
                        ]
                    }
                }
            });

            this.map.addLayer({
                'id': id + 'vLine',
                'type': 'line',
                'source': id + 'vLine',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#00BFFF',
                    'line-width': 1
                }
            });

            this.map.setLayoutProperty(id + 'vLine', 'visibility', 'none');



            this._aGeoZoneZoom.push({
                'id': id + 'vLine',
            });
        }

        for (var i = 1; i < endHeight - startHeight; i++) {
            id = startHeight + i + startLength;

            this.map.addSource(id + 'hLine', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [startLength, startHeight + i],
                            [endLength, startHeight + i]
                        ]
                    }
                }
            });

            this.map.addLayer({
                'id': id + 'hLine',
                'type': 'line',
                'source': id + 'hLine',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#00BFFF',
                    'line-width': 1
                }
            });


            this.map.setLayoutProperty(id + 'hLine', 'visibility', 'none');

            this._aGeoZoneZoom.push({
                'id': id + 'hLine',
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


    //TODO 
    /**
     * low performance logic ?? other way ??? tooooooo long render time
     * create Geo Json for GeoRefSystem Lines
     */
    createGeoRefGeoJson: async function () {

        for (var i = 0; i <= aGeoRef.length; i++) {
            var oGeoRef = aGeoRef[i];

            if (this.bGeoZone == true) {
                // Punkte auf den GeoRef-Linien abschalten
                // if (oGeoRef.length != 15 && oGeoRef.heigth != 46 && oGeoRef.length != 17) {
                this.map.addSource(oGeoRef.letter + oGeoRef.length + oGeoRef.heigth, {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [
                                oGeoRef.length, oGeoRef.heigth
                            ]
                        }
                    }
                })
                //}   
            } else {
                this.map.addSource(oGeoRef.letter + oGeoRef.length + oGeoRef.heigth, {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [
                                oGeoRef.length, oGeoRef.heigth
                            ]
                        }
                    }
                })
            }

            if (oGeoRef.letter !== "x" && oGeoRef.letter !== "c" && oGeoRef.letter !== "y") {
                
                id = oGeoRef.letter + 'area';

                this._aGeoLetterZoom.push({
                    'id': id,
                });

                this.map.addSource(oGeoRef.letter + 'area', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [
                                oGeoRef.length - 0.5, oGeoRef.heigth + 0.5
                            ]
                        }
                    }
                })
            }

            this.map.addLayer({
                'id': oGeoRef.letter + oGeoRef.length + oGeoRef.heigth,
                'type': 'circle',
                'source': oGeoRef.letter + oGeoRef.length + oGeoRef.heigth,
                'paint': {
                    'circle-radius': 3,
                    'circle-color': '#00BFFF'
                },
            });

            if (oGeoRef.letter !== "x" && oGeoRef.letter !== "c" && oGeoRef.letter !== "y") {
                this.map.addLayer({
                    "id": oGeoRef.letter + 'area',
                    "type": "symbol",
                    "source": oGeoRef.letter + 'area',
                    "layout": {
                        "text-field": this.sZone + oGeoRef.letter,
                        "text-size": 13,
                    },
                    paint: {
                        "text-color": "#000000"
                    }
                });

                this.map.setLayoutProperty(id, 'visibility', 'none');
            }
        }
    },


    /**
     * returns next char in alphabet
     * @param {String} cChar char get next one  
     */
    nextChar: function (cChar) {

        var cCharNext = String.fromCharCode(cChar.charCodeAt(0) + 1);

        if (cCharNext !== "I" && cCharNext !== "O") {
            return cCharNext;
        }
        return String.fromCharCode(cCharNext.charCodeAt(0) + 1);;
    },

    /**
     * returns the position of the char coordinate
     * @param {String} cChar char get next one  
     */
    getStartPosition: function (cChar) {
        var coordinates = 'ABCDEFGHJKLMNPQ';

        for (var i = 0; i < 15; i++) {
            var res = coordinates.charAt(i);
            if (res == cChar) {
                return i + 1;
            }
        }

    },

    /**
     * added Layer to map view based on height level
     * @param {int} iHeight height level
     */
    addLayerToMap: async function (iHeight) {

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
    addTimeLayerToMap: async function () {

        for (var iMinute = 1; iMinute < 60; iMinute++) {
            for (var iColor = 1; iColor <= 10; iColor++) {
                if (this.aTimeArray[iMinute][this._aColors["color" + iColor]] !== undefined && this.aTimeArray[iMinute][this._aColors["color" + iColor]].length !== 0) {

                    var layerId = 'minutes' + iMinute + this._aColors["color" + iColor];
                    if (this.map.getLayer(layerId)) {
                        this.map.removeLayer(layerId);
                    } else {

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
        }
    },

    /**
     * set geoJson to Map and create Marker for Height Level
     */
    setGeoJsonMarkers: async function () {
        // 10 = count of height level
        for (var i = 1; i <= 10; i++) {
            this.addLayerToMap(i);
        }
    },

    clearMapView: function () {
        this.removeLayers("minutes");
    },

    /**
     * pause Time Lapse
     */
    pauseTimeLapse: function () {
        clearInterval(this._timeLapseInterval);
    },

    /**
     * start Time Lapse
     */
    startTimeLapse: function () {
        this.setGeoJsonTimeMarkers();
    },

    /**
     * set geoJson to Map and create Marker for time lapse
     */
    setGeoJsonTimeMarkers: async function () {

        //return if no ms is selected
        if (!this.iTimeMs) {
            alert("Bitte erst Zeitraffer auswählen");
            return;
        }

        if (!this._currentMinute) {
            this._currentMinute = 0;
        }

        //interval based on timelapse ms
        this._timeLapseInterval = setInterval(function () {
            for (var iColor = 1; iColor <= 10; iColor++) {
                var layerId = 'minutes' + this._currentMinute + this._aColors["color" + iColor];
                if (this.map.getLayer(layerId)) {
                    this.map.setLayoutProperty(layerId, 'visibility', 'visible');
                }

            }
            //repeat if minutes = 59
            if (this._currentMinute === 20) {
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
    noneVisibleLayers: function (sId) {

        //no better performance than remove and add source/layer -- better way?? 
        //zooom and drawing sync? 
        var aLayers = this.map.getStyle().layers;

        for (var iLayer in aLayers) {
            var oLayer = aLayers[iLayer];
            if (oLayer.id.includes(sId)) {
                this.map.setLayoutProperty(oLayer.id, 'visibility', 'none');
            }
        }
    },

    /**
     * remove Layers of Map
     * @param {String} sId substring of id for remove
     */
    removeLayers: function (sId) {
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
    setMapMarker: async function (dLat, dLng, sColor) {

        var sAccessToken = "pk.eyJ1IjoicmJybnMiLCJhIjoiY2tpNTIwcGJhMDJsZzJxbnF0YXhmMDY1NSJ9._cIg-xSzGD06aLiY3Ggsxg"
        this.oCurrentMarker = new mapboxgl.Marker({
                color: sColor,
            })
            .setLngLat([dLng, dLat])
            .addTo(this.map);
        var sQuery = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + dLng + "," + dLat + ".json?access_token=" + sAccessToken;
        $.get(sQuery, function (oData) {
            try {
                var sAddress = oData["features"][0]["place_name"];
                this.setInfoData(sAddress);
            } catch (oError) {
                this.setInfoData("Keine Adresse verfügbar");
            }
        }.bind(this));
    },


    /**
     * @param {int} iMinutes minute of items time
     * @param {Object} oBird Birdstrike Object
     */
    setMarkerBasedOnTime: function (iMinutes, oBird) {

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
    getColorBasedOnHeight: function (dAlt) {

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
            return this._aColors.color10;
        }
    },

    /**
     * get Level based on Birds Height
     * @param {float} dAlt Höhe
     */
    getHeightLevelBasedOnHeight: function (dAlt) {
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
    setMarkerBasedOnHeight: function (dAlt, oBird) {

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

    },


    /**
     * open Cross-Section Dialog
     */
    openCrossSectionDialog: function () {
        this.iRadius = 50;
        this.setDataToCrossSectionDialog();
        this.aCrossSectionModal.open();
    },


    /**
     * handles change of Range in Cross-Section Dialog
     * @param {Event} oEvent change Event of Range in Cross-Section Dialog
     */
    changeDialogRadius: function (oEvent) {

        this.iRadius = parseInt(oEvent.target.value);
        this.oCrossSectionChart.data = this.createCharData();
        this.oCrossSectionChart.update();
    },


    /**
     * creates Dataset for Cross-Section Chart
     */
    createCharData: function () {
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
            var fDistance = turf.distance([this.oLatLng.lat, this.oLatLng.lng], [oBird.fields.lat, oBird.fields.lng], oOptions)
            if (fDistance <= this.iRadius) {
                var oData = {
                    x: oBird.fields.lat,
                    y: oBird.fields.alt,
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
    setDataToCrossSectionDialog: function () {

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
    setModalInstances: function (oInstancesModals) {
        this.aCrossSectionModal = oInstancesModals[0];
    }

}
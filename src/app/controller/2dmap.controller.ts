import {
  AppModule
} from '../app.module';
import {
  Map,
  Marker,
  Popup
} from 'mapbox-gl';
import {
  Colors
} from '../utils/colors.utils';
import {
  Bird
} from '../utils/bird.utils';
import {
  Georef
} from '../utils/georef.utils';
import * as $ from 'jquery';

export class TwoDMapController {

  // tslint:disable-next-line: variable-name
  static _currentMinute: number;
  static _ACCESS_TOKEN: string;
  static _MAP: Map;
  static _SCREENSHOT_MAP: Map;
  static oCurrentMarker: any;
  static timeLapseInterval: any;
  static bGeoZone: boolean;
  // tslint:disable-next-line: member-ordering
  static iTimeMs: any;
  static oMapPopup: any;
  static iHighestBird: number;
  static iBirdStrikeCount: number;
  static bSnapShot = false;
  static bShowGeoRefCounter: any;
  // tslint:disable-next-line: variable-name
  _timeLapseInterval: any;
  static bShowGeoRefRisk: any;
  static bTopoMapView: any;

  /**
   * set settings and config for mapview
   */
  static setMapSettings(): void {
    // Set GeoRef

    AppModule.bStarted = true;
    // this.createGeoRefSquares('NK', 'E', 4, 'B', 46, 'QL');
    // this.createGeoRefSquares('PK', 'A', 15, 'B', 46, 'BL');
    this._ACCESS_TOKEN = 'pk.eyJ1IjoicmJybnMiLCJhIjoiY2tpNTIwcGJhMDJsZzJxbnF0YXhmMDY1NSJ9._cIg-xSzGD06aLiY3Ggsxg';
    this._MAP = new Map({
      accessToken: this._ACCESS_TOKEN,
      container: 'TwoDMap',
      style: 'mapbox://styles/rbrns/cki68nmns9c6819qu9z6bakwr?optimize=true',
      center: [10.447683, 51.163361],
      // minZoom: 5,
      zoom: 6
    });

    this._MAP.dragRotate.disable();

    this._MAP.once('load', () => {
      this.mapOnLoaded();
    });

    this._MAP.on('zoom', () => {
      this.mapOnZoomed();
    });
  }

  /**
   * handler for Listener Zoom in Map
   */
  static mapOnZoomed(): void {

    const fCurrentZoom = this._MAP.getZoom();
    // Zoom In
    if (fCurrentZoom > 7.5) {
      this.changePointRadiusOnLayers('minutes', 2);
      this.changePointRadiusOnLayers('kft', 2);

    } else if (fCurrentZoom > 5.5 && fCurrentZoom < 7.5) {

      this.changePointRadiusOnLayers('minutes', 1);
      this.changePointRadiusOnLayers('kft', 1);

    } else if (fCurrentZoom < 5.5) {
      this.changePointRadiusOnLayers('minutes', 1);
      this.changePointRadiusOnLayers('kft', 1);
    }
  }

  /**
   * handler for Listener Loaded Map
   */
  static mapOnLoaded(): void {
    this.createGeoRefGeoJson();
    this.createGeoZoneInner(4, 46, 17, 56);

    this._MAP.on('click', (oEvent) => {
      AppModule.oLatLng = oEvent.lngLat;
      if (this.oCurrentMarker) {
        this.oCurrentMarker.remove();
      }
      document.getElementById('info-card').style.visibility = 'visible';
      document.getElementById('crosssecbtn').style.visibility = 'visible';
      document.getElementById('threedviewbtn').style.visibility = ' visible';
      this.setMapMarker(AppModule.oLatLng.lat, AppModule.oLatLng.lng, '#3F9B93');

    });
  }



  /**
   * remove Layers of Map
   * @param sId substring of id for remove
   */
  static removeLayers(sId: string): void {
    const aLayers = this._MAP.getStyle().layers;

    for (const iLayer in aLayers) {
      if (aLayers.hasOwnProperty(iLayer)) {
        const oLayer = aLayers[iLayer];
        if (oLayer.id.includes(sId)) {
          this._MAP.removeLayer(oLayer.id);
          this._MAP.removeSource(oLayer.id);
        }
      }
    }
  }


  /**
   * set geoJson to Map and create Marker for time lapse
   */
  static async setGeoJsonTimeMarkers(iTimeMs: any): Promise < void > {

    // return if no ms is selected
    if (!iTimeMs) {
      alert('Bitte erst Zeitraffer auswählen');
      return;
    }

    this.disableHeightLayers();

    if (!this._currentMinute) {
      this._currentMinute = 0;
    }

    // interval based on timelapse ms
    this.timeLapseInterval = setInterval(() => {
      for (let iColor = 1; iColor <= 10; iColor++) {
        const layerId = 'minutes' + this._currentMinute + Colors.getColorByLevel(iColor);
        if (AppModule.aSelectedLayers.includes(iColor)) {
          if (this._MAP.getLayer(layerId)) {
            this._MAP.setLayoutProperty(layerId, 'visibility', 'visible');
          }
        }
      }
      // repeat if minutes = 59
      if (this._currentMinute === 55) {
        this._currentMinute = 0;
        this.noneVisibleLayers('minutes');
      } else {
        this._currentMinute = this._currentMinute + 5;
      }

      document.getElementById('info-minute').innerHTML = this._currentMinute.toString();

    }, iTimeMs);
  }


  static disableHeightLayers(): void {

    for (let i = 1; i <= 10; i++) {
      const oEvent = {
        target: {
          checked: false,
          parentElement: {
            children: [null, document.getElementById('spanheight' + i)]
          }
        },

      };
      this.setMapHeightLayer(i, oEvent);
    }
  }


  /**
   * set info data to info view based on LatLng
   * @param sGeoRef Object with lat and lng of Location
   */
  static setInfoData(sGeoRef: string): void {

    for(let i = 0; i < AppModule.GEOREF.length; i++){
      const oGeoRef = AppModule.GEOREF[i];
      if(oGeoRef.sZone + oGeoRef.sLetter === sGeoRef){
        document.getElementById('info-risk').innerHTML = oGeoRef.getRiskText();
      }
    }
    document.getElementById('info-address').innerHTML = sGeoRef;
    document.getElementById('info-latlng').innerHTML = AppModule.oLatLng.lat + '<br>' + AppModule.oLatLng.lng;
    document.getElementById('info-bird-dir').style.display = 'block';
    document.getElementById('info-risk-con').style.display = 'block';
    document.getElementById('info-risk-nosc').style.display = 'none';
  }

  static setMarkerBasedOnHeight(dAlt: number, oBird: Bird): void {

    let sGeoRef;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < AppModule.GEOREF.length; i++) {
      const oGeoRef = AppModule.GEOREF[i];
      if (oBird.dLat > oGeoRef.iLatStart &&
        oBird.dLat < oGeoRef.iLatEnd &&
        oBird.dLng > oGeoRef.iLngStart && oBird.dLng < oGeoRef.iLngEnd) {
        sGeoRef = 'GeoRef: ' + oGeoRef.sZone + oGeoRef.sLetter + '<br>Lat: ' + oBird.dLat + '<br>Lng: ' + oBird.dLng + '<br>Höhe: ' + dAlt + ' ft';
        break;
      }
    }


    AppModule.aHeightArrayBirds[oBird.getHeightLevelBasedOnHeight()].push(oBird);

    if (dAlt < 1000) {
      AppModule.aGeoArray.aGeoArray1.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef,
          height: dAlt
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 2000) {
      AppModule.aGeoArray.aGeoArray2.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef,
          height: dAlt
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 3000) {
      AppModule.aGeoArray.aGeoArray3.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 4000) {
      AppModule.aGeoArray.aGeoArray4.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 5000) {
      AppModule.aGeoArray.aGeoArray5.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 6000) {
      AppModule.aGeoArray.aGeoArray6.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 7000) {
      AppModule.aGeoArray.aGeoArray7.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 8000) {
      AppModule.aGeoArray.aGeoArray8.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt < 10000) {
      AppModule.aGeoArray.aGeoArray9.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });
    } else if (dAlt >= 10000) {
      AppModule.aGeoArray.aGeoArray10.push({
        // feature for Mapbox DC
        type: 'Feature',
        properties: {
          description: sGeoRef
        },
        geometry: {
          type: 'Point',
          coordinates: [oBird.dLng, oBird.dLat]
        },
      });

    }

    // check if bird is the highest
    if (this.iHighestBird < dAlt) {
      // set highest bird
      this.iHighestBird = Math.round(dAlt);
    }

    // birdcount
    this.iBirdStrikeCount++;

  }

  /**
   * creates GeoJson for markers based on time
   * @param iMinutes minute of items time
   * @param oBird Birdstrike Object
   */
  static setMarkerBasedOnTime(iMinutes: number, oBird: Bird): void {

    if (AppModule.aTimeArrayGeoJSON[iMinutes] === undefined) {
      AppModule.aTimeArrayGeoJSON[iMinutes] = [];
    }

    if (AppModule.aTimeArrayBirds[iMinutes] === undefined) {
      AppModule.aTimeArrayBirds[iMinutes] = [];
    }

    const sColor = Colors.getColorByLevel(oBird.getHeightLevelBasedOnHeight());

    if (AppModule.aTimeArrayGeoJSON[iMinutes][sColor] === undefined) {
      AppModule.aTimeArrayGeoJSON[iMinutes][sColor] = [];
    }

    if (AppModule.aTimeArrayBirds[iMinutes][sColor] === undefined) {
      AppModule.aTimeArrayBirds[iMinutes][sColor] = [];
    }

    AppModule.aTimeArrayGeoJSON[iMinutes][sColor].push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [oBird.dLng, oBird.dLat]
      },
    });

    AppModule.aTimeArrayBirds[iMinutes][sColor].push(oBird);
  }

  /**
   * hide Layers in Time Lapse
   * @param sId id of Layer for none visibility
   * @returns layer of map
   */
  static visibleLayers(sId: string): object {

    const aLayers = this._MAP.getStyle().layers;
    let oLayerGeoRef;

    for (const iLayer in aLayers) {
      if (aLayers.hasOwnProperty(iLayer)) {
        const oLayer = aLayers[iLayer];
        if (oLayer.id.includes(sId)) {
          debugger;
          this._MAP.setLayoutProperty(oLayer.id, 'visibility', 'visible', {
            validate: false
          });
          oLayerGeoRef = oLayer;
        }
      }

    }
    return oLayerGeoRef;
  }




  /**
   * changes Radius of Birdstrike point
   * @param sId substring of layer id
   */
  static changePointRadiusOnLayers(sId: string, iRadius: number): void {
    const aLayers = this._MAP.getStyle().layers;
    for (const iLayer in aLayers) {
      if (aLayers.hasOwnProperty(iLayer)) {
        const oLayer = aLayers[iLayer];
        if (oLayer.id.includes(sId)) {
          this._MAP.setPaintProperty(oLayer.id, 'circle-radius', iRadius);
        }
      }
    }
  }

  /**
   * set marker to Map
   * @param dLat latitude
   * @param dLng longitude
   * @param  sColor color
   */
  static async setMapMarker(dLat: number, dLng: number, sColor: string): Promise < void > {

    this.oCurrentMarker = new Marker({
      color: sColor,
    })
    .setLngLat([dLng, dLat])
    .addTo(this._MAP);

    // set GEOREF

    for (const oGeoRef of AppModule.GEOREF) {
      if (dLat >= oGeoRef.iLatStart && dLat <= oGeoRef.iLatEnd && dLng >= oGeoRef.iLngStart && dLng <= oGeoRef.iLngEnd) {
        AppModule.sCurrentGeoRef = oGeoRef.sZone + '' + oGeoRef.sLetter;
        this.setInfoData(AppModule.sCurrentGeoRef);
        return;
      }
    }
    // if no georef was founded
    this.setInfoData('-');

  }

  /**
   * clear Layers
   */
  static clearLayers(): void {
    this._currentMinute = 0;
    clearInterval(this.timeLapseInterval);
    document.getElementById('info-minute').innerHTML = '0';
    this.noneVisibleLayers('minutes');
  }

  /**
   * hide Layers in Time Lapse
   * @param sId id of Layer for none visibility
   */
  static noneVisibleLayers(sId: string): object {

    const aLayers = this._MAP.getStyle().layers;
    let oLayerGeoRef;

    for (const iLayer in aLayers) {
      if (aLayers.hasOwnProperty(iLayer)) {
        const oLayer = aLayers[iLayer];
        if (oLayer.id.includes(sId)) {
          this._MAP.setLayoutProperty(oLayer.id, 'visibility', 'none', {
            validate: true
          });
          oLayerGeoRef = oLayer;
        }
      }

    }
    return oLayerGeoRef;
  }



  static setMapHeightLayer(iHeight: number, oEvent: any): void {
    const bChecked = oEvent.target.checked;

    if (this.timeLapseInterval !== null) {
      this.clearMapView();
    }
    const oSpan = oEvent.target.parentElement.children[1]; // Checkbox label
    // hide if unselected
    if (bChecked) {
      if (this._MAP.getLayer('kft' + iHeight)) {
        this._MAP.setLayoutProperty('kft' + iHeight, 'visibility', 'visible');
        oSpan.style.color = Colors.getColorByLevel(iHeight);
      }

    } else {
      if (this._MAP.getLayer('kft' + iHeight)) {
        this._MAP.setLayoutProperty('kft' + iHeight, 'visibility', 'none');
        oSpan.style.color = 'white';
      }
    }
  }

  /**
   * added Layer to map view based on current minute in time lapse
   * @param iMinute minute of time lapse
   */
  static async addTimeLayerToMap(): Promise < void > {

    for (let iMinute = 0; iMinute < 60; iMinute = iMinute + 5) {
      for (let iColor = 1; iColor <= 10; iColor++) {
        // tslint:disable-next-line: max-line-length
        if (AppModule.aTimeArrayGeoJSON[iMinute] !== undefined && AppModule.aTimeArrayGeoJSON[iMinute][Colors.getColorByLevel(iColor)] !== undefined &&
          AppModule.aTimeArrayGeoJSON[iMinute][Colors.getColorByLevel(iColor)].length !== 0) {

          const layerId = 'minutes' + iMinute + Colors.getColorByLevel(iColor);
          if (this._MAP.getLayer(layerId)) {
            this._MAP.removeLayer(layerId);
          }
          if (this._MAP.getSource(layerId)) {
            this._MAP.removeSource(layerId);
          }
          this._MAP.addSource(layerId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: AppModule.aTimeArrayGeoJSON[iMinute][Colors.getColorByLevel(iColor)]
            }
          });

          this._MAP.addLayer({
            id: layerId,
            type: 'circle',
            layout: {
              visibility: 'none'
            },
            source: layerId,
            paint: {
              'circle-radius': 1,
              'circle-color': Colors.getColorByLevel(iColor)
            },
          });
        }
      }
    }
  }

  /**
   * set geoJson to Map and create Marker for Height Level
   */
  static async setGeoJsonMarkers(): Promise < void > {
    // 10 = count of height level
    for (let i = 1; i <= 10; i++) {
      this.addLayerToMap(i);
    }
  }

  /**
   * set grid view of geo squares
   */
  static async setGeoRefSquares(oEvent: any): Promise < void > {
    const bChecked = oEvent.target.checked;
    if (bChecked) {
      // tslint:disable-next-line: no-shadowed-variable
      const oLayer: any = this.visibleLayers('georefzone');
      this._MAP.on('render', oLayer.id, () => {});

    } else {
      this.noneVisibleLayers('georefzone');
    }
  }

  static async setGeoRefCounter(oEvent: any): Promise < void > {
    const bChecked = oEvent.target.checked;
    this.bShowGeoRefCounter = bChecked;
    if (bChecked) {
      const oLayer: any = this.visibleLayers('georefcounter');
      this._MAP.on('render', oLayer.id, () => {});
    } else {
      this.noneVisibleLayers('georefcounter');
    }
  }

  static async setGeoRefRisk(oEvent: any): Promise < void > {
    const bChecked = oEvent.target.checked;
    this.bShowGeoRefRisk = bChecked;
    if (bChecked) {
      const oLayer: any = this.visibleLayers('georefrisk');
      this._MAP.on('render', oLayer.id, () => {});
    } else {
      this.noneVisibleLayers('georefrisk');
    }
  }

  static async setMapStyles(oEvent: any): Promise<void> {

    const bChecked = oEvent.target.checked;
    this.bTopoMapView = bChecked;
    if (bChecked) {
      this._MAP.setStyle('mapbox://styles/rbrns/cknzoq6re08pi17nbiuvtqrsl');
    } else {
      this._MAP.setStyle('mapbox://styles/rbrns/cki68nmns9c6819qu9z6bakwr?optimize=true');
    }
  }

  /**
   * add Layer based on Height Level to Map
   */
  static async addLayerToMap(iHeight: number): Promise < void > {
    if (this._MAP.getLayer('kft' + iHeight)) {
      this._MAP.removeLayer('kft' + iHeight);
    }
    if (this._MAP.getSource('kft' + iHeight)) {
      this._MAP.removeSource('kft' + iHeight);
    }

    this._MAP.addSource('kft' + iHeight, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: AppModule.aGeoArray['aGeoArray' + iHeight]
      }
    });

    // Add a symbol layer
    this._MAP.addLayer({
      id: 'kft' + iHeight,
      type: 'circle',
      layout: {
        visibility: 'none'
      },
      source: 'kft' + iHeight,
      paint: {
        'circle-radius': 1,
        'circle-color': Colors.getColorByLevel(iHeight)
      },
    });

    // popup for  birdstrike alert
    this.oMapPopup = new Popup({
      closeButton: false,
      closeOnClick: false
    });

    this._MAP.on('mouseenter', 'kft' + iHeight, (oLayer) => {
      this._MAP.getCanvas().style.cursor = 'pointer';
      const coordinates = oLayer.features[0].geometry.coordinates.slice();
      const description = oLayer.features[0].properties.description;
      this.oMapPopup.setLngLat(coordinates).setHTML(description).addTo(this._MAP);
    });

    this._MAP.on('mouseleave', 'kft' + iHeight, () => {
      this._MAP.getCanvas().style.cursor = '';
      this.oMapPopup.remove();
    });
  }

  static clearMapView(): void {
    this.clearLayers();
  }

  /**
   * draws georef square lines within georef grid (1 degress lines)
   * @param iStartLength Startpoint for line latitude
   * @param iStartHeight Startpoint for line longitude
   * @param iEndLength Endpoint for line latitude
   * @param iEndHeight Endpoint for line longitude
   */
  static createGeoZoneInner(iStartLength: number, iStartHeight: number, iEndLength: number, iEndHeight: number): void {

    let sId: string | number;
    const iHeigth = iStartHeight;

    for (let iPos = 1; iPos < iEndLength - iStartLength; iPos++) {
      sId = iStartLength + iPos + iHeigth;
      this._MAP.addSource(sId + 'vLinegeorefzone', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [iStartLength + iPos, iHeigth],
              [iStartLength + iPos, iEndHeight]
            ]
          }
        }
      });

      this._MAP.addLayer({
        id: sId + 'vLinegeorefzone',
        type: 'line',
        source: sId + 'vLinegeorefzone',
        layout: {
          visibility: 'none',
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3F9B93',
          'line-width': 1
        }
      });
    }

    for (let i = 1; i < iEndHeight - iStartHeight; i++) {
      sId = iStartHeight + i + iStartLength;

      this._MAP.addSource(sId + 'hLinegeorefzone', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [iStartLength, iStartHeight + i],
              [iEndLength, iStartHeight + i]
            ]
          }
        }
      });

      this._MAP.addLayer({
        id: sId + 'hLinegeorefzone',
        type: 'line',
        source: sId + 'hLinegeorefzone',
        layout: {
          visibility: 'none',
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
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
  }

  /**
   * creates GeoRef Zones and draw them to map
   * @param aGeoZone Array with GeoRef Zones
   */
  static createGeoRefZones(aGeoZone: (string | number)[][]): void {

    this.bGeoZone = true;
    let sId;
    for (let i = 0; i < aGeoZone.length - 1; i++) {
      const oGeoFirstRef = aGeoZone[i];
      const oGeoSecondRef = aGeoZone[i + 1];

      sId = oGeoFirstRef + '' + oGeoSecondRef + 'georefzone';
      this._MAP.addSource(sId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [oGeoFirstRef[1], oGeoFirstRef[2]],
              [oGeoSecondRef[1], oGeoSecondRef[2]]
            ]
          }
        }
      });

      this._MAP.addLayer({
        id: sId,
        type: 'line',
        source: sId,
        layout: {
          visibility: 'none',
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3F9B93',
          'line-width': 1
        }
      });
    }
  }

  /**
   * create Geo Json Zones for GeoRefSystem grid
   */
  static async createGeoRefGeoJson(): Promise < void > {
    for (const oGeoRef of AppModule.GEOREF) {

      console.log(oGeoRef);
      const sId = oGeoRef.sLetter + oGeoRef.sZone + 'areageorefzone';
      if (!this._MAP.getSource(sId)) {
        this._MAP.addSource(sId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                oGeoRef.iLngStart + 0.5, oGeoRef.iLatStart + 0.5
              ]
            }
          }
        });

        this._MAP.addLayer({
          id: sId,
          type: 'symbol',
          source: sId,
          layout: {
            visibility: 'none',
            'text-field': oGeoRef.sZone + oGeoRef.sLetter,
            'text-size': 13,
          },
          paint: {
            'text-color': '#3F9B93'
          }
        });
      }

    }
  }

  static createGeoRefCounterCircles(): void {

    for (const oGeoRef of AppModule.GEOREF) {

      const sId = 'georefcounter' + oGeoRef.sZone + oGeoRef.sLetter;
      if (!this._MAP.getSource(sId)) {
        this._MAP.addSource(sId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                oGeoRef.iLngStart + 0.5, oGeoRef.iLatStart + 0.5
              ]
            }
          }
        });
      }

      if (this._MAP.getLayer(sId + 'circle')) {
        this._MAP.removeLayer(sId + 'circle');
      }

      if (this._MAP.getLayer(sId + 'text')) {
        this._MAP.removeLayer(sId + 'text');
      }

      this._MAP.addLayer({
        id: sId + 'circle',
        type: 'circle',
        source: sId,
        layout: {
          visibility: this.bShowGeoRefCounter ? 'visible' : 'none',
        },
        paint: {
          'circle-color': Georef.counterRiskColor(oGeoRef.iCounter),
          'circle-radius': Georef.counterRiskSize(oGeoRef.iCounter)
        }
      });

      this._MAP.addLayer({
        id: sId + 'text',
        type: 'symbol',
        source: sId,
        paint: {
          'text-color': '#ffffff'
        },
        layout: {
          visibility: this.bShowGeoRefCounter ? 'visible' : 'none',
          'text-field': oGeoRef.iCounter.toString(),
          'text-size': 13,
        }
      });
    }
  }

  static createGeoRefRiskSquares(): void {

    for (const oGeoRef of AppModule.GEOREF) {
      const sId = "georefrisk" + oGeoRef.sZone + oGeoRef.sLetter;
      if (!this._MAP.getSource(sId)) {

        let aCoordinates = [
          [oGeoRef.iLngStart, oGeoRef.iLatStart],
          [oGeoRef.iLngEnd, oGeoRef.iLatStart],
          [oGeoRef.iLngEnd, oGeoRef.iLatEnd],
          [oGeoRef.iLngStart, oGeoRef.iLatEnd],
        ];

        this._MAP.addSource(sId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [aCoordinates]
            }
          }
        });
      }

      if (this._MAP.getLayer(sId)) {
        this._MAP.removeLayer(sId);
      }

      this._MAP.addLayer({
        id: sId,
        type: 'fill',
        source: sId,
        layout: {
          visibility: this.bShowGeoRefRisk ? 'visible' : 'none',
        },
        paint: {
          'fill-color': oGeoRef.getRiskColor(),
          'fill-opacity': oGeoRef.getRiskColor() === "#000000" ? 0.0 : 0.5
        }
      });

    }
  }
}

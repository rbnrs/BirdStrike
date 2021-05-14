import {
  AppModule
} from './../app.module';
import Config from '@arcgis/core/config';
import SceneView from '@arcgis/core/views/SceneView';
import * as WebMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import {
  Colors
} from '../utils/colors.utils';
import Map from '@arcgis/core/Map';
export class ThreeDMapController {
  static oHeightLayer = {};
  static oTimeLayer = {};

  static oMap: Map;
  static _currentMinute: any;
  static timeLapseInterval: any;
  static _oSceneView: SceneView;

  static async initializeMap(): Promise < void > {

  }

  static async loadMap(): Promise < void > {

    return new Promise < void > ((resolve, reject) => {

      try {

        Config.apiKey = 'AAPKa5b7055c839c4368af5cd1247b271199UvMqRYkpezzDZMNCRPjqaqyn9qEFzVgTDy9jqsqBl-SZT6YaYu7kNsBenpVH9tuT';


        this.oMap = new Map({
          basemap: 'dark-gray-vector' // Basemap layer service
        });

        let oCurrentGeoRef;
        let sCurrentGeoRef;


        for (const oGeoRef of AppModule.GEOREF) {
          if (AppModule.sCurrentGeoRef === oGeoRef.sZone + '' + oGeoRef.sLetter) {
            oCurrentGeoRef = oGeoRef;
            sCurrentGeoRef = oCurrentGeoRef.sZone + '' + oCurrentGeoRef.sLetter;
            break;
          }
        }

        for (let i = 1; i <= 10; i++) {
          const oGraphicLayer = new GraphicsLayer();
          for (const oBird of AppModule.aBirds) {

            if (oBird.sGeoRef === AppModule.sCurrentGeoRef) {

              if (oBird.getHeightLevelBasedOnHeight() === i) {

                const point = { // Create a point
                  type: 'point',
                  longitude: oBird.dLng,
                  latitude: oBird.dLat,
                  z: oBird.dAlt
                };

                const simpleMarkerSymbol = {
                  type: 'simple-marker',
                  color: Colors.getColorByLevel(oBird.getHeightLevelBasedOnHeight()),
                  size: 2,
                  outline: {
                    color: Colors.getColorByLevel(oBird.getHeightLevelBasedOnHeight()), // White
                    width: 1
                  }
                };

                const pointGraphic = new Graphic({
                  geometry: point as any,
                  symbol: simpleMarkerSymbol
                });

                oGraphicLayer.add(pointGraphic);
              }

            }
          }

          this.oHeightLayer[i] = oGraphicLayer;

        }

        for (let iMinute = 0; iMinute < 60; iMinute = iMinute + 5) {
          const oGraphicLayer = new GraphicsLayer();
          for (const oBird of AppModule.aBirds) {
            if (oBird.getMinutes() === iMinute) {
              const point = { // Create a point
                type: 'point',
                longitude: oBird.dLng,
                latitude: oBird.dLat,
                z: oBird.dAlt
              };

              const simpleMarkerSymbol = {
                type: 'simple-marker',
                color: Colors.getColorByLevel(oBird.getHeightLevelBasedOnHeight()),
                size: 2,
                outline: {
                  color: Colors.getColorByLevel(oBird.getHeightLevelBasedOnHeight()), // White
                  width: 1
                }
              };

              const pointGraphic = new Graphic({
                geometry: point as any,
                symbol: simpleMarkerSymbol
              });

              oGraphicLayer.add(pointGraphic);
            }
          }
          this.oTimeLayer[iMinute] = oGraphicLayer;
        }


        const clippingMin = WebMercatorUtils.lngLatToXY(oCurrentGeoRef.iLngStart, oCurrentGeoRef.iLatStart);
        const clippingMax = WebMercatorUtils.lngLatToXY(oCurrentGeoRef.iLngEnd, oCurrentGeoRef.iLatEnd);

        const mapExtent = {
          xmin: clippingMin[0],
          ymin: clippingMin[1],
          xmax: clippingMax[0],
          ymax: clippingMax[1],
          spatialReference: { // autocasts as new SpatialReference()
            wkid: 3857
          }
        };

        const aCenter = [
          (oCurrentGeoRef.iLngStart + oCurrentGeoRef.iLngEnd) / 2,
          (oCurrentGeoRef.iLatStart + oCurrentGeoRef.iLatEnd) / 2
        ];

        this._oSceneView = new SceneView({
          container: 'ThreeDMap',
          map: this.oMap,
          // Indicates to create a local scene
          viewingMode: 'local',
          qualityProfile: 'low',
          // Use the exent defined in clippingArea to define the bounds of the scene
          clippingArea: mapExtent,
          extent: mapExtent,
          ui: {
            components: ['attribution']
          },
          zoom: 3,
          center: aCenter,
          // Turns off atmosphere and stars settings
          environment: {
            atmosphere: null,
            starsEnabled: false
          },
          camera: {
            position: {
              longitude: aCenter[0],
              latitude: aCenter[1],
              z: 500000
            },
          }
        });

        resolve();

      } catch (e) {
        console.log(e);
        reject();
      }

    });

  }


  static startTimeLapse(iTimeMs: number): void {
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
      this.setTimeLayer(this._currentMinute);
      // repeat if minutes =
      if (this._currentMinute === 55) {
        this._currentMinute = 0;
        this.removeAllTimeLayers();
      } else {
        this._currentMinute = this._currentMinute + 5;
      }

      document.getElementById('info-minute').innerHTML = this._currentMinute.toString();

    }, iTimeMs);
  }

  static async setTimeLayer(iMinute: number): Promise < void > {
    const oLayer = this.oTimeLayer[iMinute];
    this.oMap.add(oLayer);
  }

  static removeAllTimeLayers(): void {

    for (let iMinute = 0; iMinute < 60; iMinute = iMinute + 5) {
      const oLayer = this.oTimeLayer[iMinute];
      if (this.oMap.layers.includes(oLayer)) {
        this.oMap.remove(oLayer);
      }
    }
    document.getElementById('info-minute').innerHTML = this._currentMinute.toString();

  }

  static disableHeightLayers(): void {

    for (let i = 1; i <= 10; i++) {
      const oInput = document.getElementById('cbheight' + i) as HTMLInputElement;
      oInput.checked = false;
      const oLayer = this.oHeightLayer[i];
      if (this.oMap.layers.includes(oLayer)) {
        this.oMap.remove(oLayer);
      }
    }

  }

  static async setHeightLayer(iHeightLevel: number): Promise < void > {
    const oLayer = this.oHeightLayer[iHeightLevel];
    if (this.oMap.layers.includes(oLayer)) {
      this.oMap.remove(oLayer);
    } else {
      this.oMap.add(oLayer);
    }
  }

  static async createScreenShot() {

    const oScreenShot = await this._oSceneView.takeScreenshot({
      format: "jpg",
      quality: 70
    });
  }

}

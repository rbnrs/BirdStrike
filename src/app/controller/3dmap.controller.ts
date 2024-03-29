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
  // tslint:disable-next-line: variable-name
  static _currentMinute: any;
  static timeLapseInterval: any;
  // tslint:disable-next-line: variable-name
  static _oSceneView: SceneView;

  /**
   * load SceneView for Georef and create Layers
   */
  static async loadMap(): Promise < void > {

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
                z: oBird.dAlt * 3
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
        oGraphicLayer.visible = false;
        oGraphicLayer.id = '3dHeight' + i + sCurrentGeoRef;
        this.oMap.add(oGraphicLayer);
      }

      for (let iMinute = 0; iMinute < 60; iMinute = iMinute + 5) {
        this.createTimeLayer(iMinute);
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
          starsEnabled: false,
          background: {
            type: 'color', // autocasts as new ColorBackground()
            color: [30, 29, 30, 255]
          },
        },
        camera: {
          position: {
            longitude: aCenter[0],
            latitude: aCenter[1],
            z: 500000
          },
        }
      });

      this._oSceneView.on('layerview-create', () => {
        AppModule.oLoadingModal.close();
      });

    } catch (e) {
      console.log(e);
    }
  }

  /**
   * create TimeLayer for TimeLapse View
   * @param iMinute number Minute of TimeLapse View
   */
  static async createTimeLayer(iMinute: number): Promise < void > {
    const oBirdsCollection = AppModule.aTimeArrayBirds[iMinute];
    for (let i = 1; i <= 10; i++) {
      const oGraphicLayer = new GraphicsLayer();
      const sColor = Colors.getColorByLevel(i);
      const aBirds = oBirdsCollection[sColor];
      if (aBirds) {
        for (const oBird of aBirds) {
          if (oBird.sGeoRef === AppModule.sCurrentGeoRef) {
            const point = { // Create a point
              type: 'point',
              longitude: oBird.dLng,
              latitude: oBird.dLat,
              z: oBird.dAlt * 3
            };

            const simpleMarkerSymbol = {
              type: 'simple-marker',
              color: sColor,
              size: 2,
              outline: {
                color: sColor,
                width: 1
              }
            };

            const pointGraphic = new Graphic({
              geometry: point as any,
              symbol: simpleMarkerSymbol,
            });
            oGraphicLayer.add(pointGraphic);
          }
        }
      }

      oGraphicLayer.id = '3dMinute' + iMinute + sColor + AppModule.sCurrentGeoRef;
      oGraphicLayer.visible = false;
      this.oMap.add(oGraphicLayer);
      this.oTimeLayer[iMinute] = oGraphicLayer;
    }
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
        this.removeAllTimeLayers(false);
      } else {
        this._currentMinute = this._currentMinute + 5;
      }

      document.getElementById('info-minute').innerHTML = this._currentMinute.toString();

    }, iTimeMs);
  }

  static async setTimeLayer(iMinute: number): Promise < void > {


    for (let i = 1; i <= 10; i++) {
      // tslint:disable-next-line: no-shadowed-variable
      if (AppModule.aSelectedLayers.includes(i)) {
        let sId = '3dMinute' + iMinute + Colors.getColorByLevel(i) + AppModule.sCurrentGeoRef;
        const oLayer = this.oMap.layers.find((oLayer) => {
          return oLayer.id === sId;
        });

        if (oLayer) {
          oLayer.visible = true;
        }
      }

    }
  }

  static removeAllTimeLayers(bUncheck): void {

    for (let iMinute = 0; iMinute < 60; iMinute = iMinute + 5) {
      for(let iColor = 1; iColor <= 10; iColor++){
        let sId = '3dMinute' + iMinute + Colors.getColorByLevel(iColor) + AppModule.sCurrentGeoRef;
        const oLayer = this.oMap.findLayerById(sId);
        if (oLayer) {
          oLayer.visible = false;
        }
        if(bUncheck){
          const oInput = document.getElementById('cbheight' + iColor) as HTMLInputElement;
          oInput.checked = false;
        }
      }

    }
  }

  static disableHeightLayers(): void {

    for (let i = 1; i <= 10; i++) {
      const oLayer = this.oHeightLayer[i];
      if (this.oMap.layers.includes(oLayer)) {
        this.oMap.remove(oLayer);
      }
    }

  }

  static async setHeightLayer(iHeightLevel: number): Promise < void > {

    // tslint:disable-next-line: no-shadowed-variable
    const oLayer = await this.oMap.layers.find((oLayer) => {
      return oLayer.id === '3dHeight' + iHeightLevel + AppModule.sCurrentGeoRef;
    });

    if(oLayer){
      if (oLayer.visible) {
        oLayer.visible = false;
      } else {
        oLayer.visible = true;
      }
    }else{
      this.oMap.add(this.oHeightLayer[iHeightLevel]);
    }


  }

}

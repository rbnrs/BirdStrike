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


  static oHeightLayer = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null
  };

  static oMap: Map;

  static async loadMap() {

    return new Promise < void > ((resolve, reject) => {

      try {

        Config.apiKey = 'AAPKa5b7055c839c4368af5cd1247b271199UvMqRYkpezzDZMNCRPjqaqyn9qEFzVgTDy9jqsqBl-SZT6YaYu7kNsBenpVH9tuT';

        let oCurrentGeoRef;
        let sCurrentGeoRef;


        for (const oGeoRef of AppModule.GEOREF) {
          if (AppModule.sCurrentGeoRef === oGeoRef.sZone + '' + oGeoRef.sLetter) {
            oCurrentGeoRef = oGeoRef;
            sCurrentGeoRef = oCurrentGeoRef.sZone + '' + oCurrentGeoRef.sLetter;
            break;
          }
        }

        for(let i = 1; i  <= 10; i++){
          const oGraphicLayer = new GraphicsLayer();
          for (const oBird of AppModule.aBirds) {

            if(oBird.sGeoRef === AppModule.sCurrentGeoRef){

              if(oBird.getHeightLevelBasedOnHeight() === i){

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


        this.oMap = new Map({
          basemap: 'dark-gray-vector' // Basemap layer service
        });

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


        // tslint:disable-next-line: no-unused-expression
        const oSceneView = new SceneView({
          container: 'ThreeDMap',
          map: this.oMap,
          // Indicates to create a local scene
          viewingMode: 'local',
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

  static disableHeightLayers(){

    for (let i = 1; i <= 10; i++) {
      const oInput = document.getElementById('cbheight' + i) as HTMLInputElement;
      oInput.checked = false;
      const oLayer = this.oHeightLayer[i];
      this.oMap.remove(oLayer);
    }

  }

  static async setHeightLayer(iHeightLevel: number){
    const oLayer = this.oHeightLayer[iHeightLevel];
    if(this.oMap.layers.includes(oLayer)){
      this.oMap.remove(oLayer);
    }else{
      this.oMap.add(oLayer);
    }
  }

}

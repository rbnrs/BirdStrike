import {
  Georef
}

from './../../utils/georef.utils';

import * as $ from 'jquery';
import * as turf from '@turf/turf';

import {
  Units
}

from '@turf/helpers';

import * as M from 'materialize-css/dist/js/materialize';

import {
  Router,
  ActivatedRoute
}

from '@angular/router';

import {
  Component,
  OnInit
}

from '@angular/core';

import {
  Bird
}

from 'src/app/utils/bird.utils';

import {
  Colors
}

from 'src/app/utils/colors.utils';

import {
  AppModule
}

from 'src/app/app.module';

import {
  TwoDMapController
}

from 'src/app/controller/2dmap.controller';

import {
  CrossSectionController
}

from 'src/app/controller/crossection.controller';

import {
  ThreeDMapController
}

from 'src/app/controller/3dmap.controller';


@Component({
    selector: 'app-map-view',
    templateUrl: './map-view.component.html',
    styleUrls: ['./map-view.component.css']
  }

) export class MapViewComponent implements OnInit {
  oRefreshInterval: any;
  iTimeMs: number;
  sLocalDate = '';
  sLocalTime = '';
  is3D = false;


  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {

    if (AppModule.bStarted === false) {


      TwoDMapController.setMapSettings();
      this.setBirdstrikeRefreshInterval();
      this._readMapData();
      AppModule.bStarted = true;


    } else {
      document.getElementById('loading-panel').style.display = 'none';
      document.getElementById('control-panel').style.display = '';
      document.getElementById('TwoDMap').style.visibility = 'visible';
      TwoDMapController.setMapSettings();
      this.setBirdstrikeRefreshInterval();
    }

  }

  // tslint:disable-next-line: use-lifecycle-interface
  ngAfterViewInit(): void {

    document.addEventListener('DOMContentLoaded', () => {
        const elemsdrop = document.querySelectorAll('.dropdown-trigger');

        const instancesdrop = M.Dropdown.init(elemsdrop, {}

        );

        const elems = document.querySelectorAll('input[type=range]');
        M.Range.init(elems);

        const elemsmodal = document.querySelectorAll('.modal');

        const instancesmodal = M.Modal.init(elemsmodal, {}

        );

        this.setModalInstances(instancesmodal);
      }

    );

  }

  setBirdstrikeRefreshInterval(): void {

    this.oRefreshInterval = setInterval(async () => {
        TwoDMapController.removeLayers('kft');
        TwoDMapController.removeLayers('minutes');
        this._readMapData();
      }

      , 1000 * 60 * 5);

  }

  /**
   * Setted Time for time lapse
   * @param oEvent click event of time lapse dropdown
   */
  changeTime(oEvent: any): void {

    const sTimeSelect = oEvent.target.innerText;
    this.iTimeMs = parseInt(sTimeSelect.replace(' ms', ''), 10);
    document.getElementById('timeRef').innerHTML = sTimeSelect;

  }

  /**
   * Shows Birdstrike on map based on selected height level
   * Layout will be setted to map after selected
   * @param  height level of Birdstrike
   * @param clickevent of Checkbox
   */
  changeMapView(iHeight: number, oEvent: any): void {
    if(this.is3D){
      ThreeDMapController.setHeightLayer(iHeight);
    }else{
      TwoDMapController.setMapHeightLayer(iHeight, oEvent);
    }
  }

  /**
   * clear Map View
   */
  clearMapView(): void {
    TwoDMapController.clearLayers();
  }

  /**
   * pause Time Lapse
   */
  pauseTimeLapse(): void {
    clearInterval(TwoDMapController.timeLapseInterval);
  }

  /**
   * start Time Lapse
   */
  startTimeLapse(): void {
    TwoDMapController.setGeoJsonTimeMarkers(this.iTimeMs);
  }


  /**
   * gets Birdstrike Data via json.
   * setted items to arrays based on time or height
   * shows info view, if item were loaded
   */
  async _readMapData(): Promise < void > {

    this.resetMapData();
    let dStartTime = new Date(Date.now());
    const aRequests = [];
    const iQueries = 60;

    for (let iQuery = 0; iQuery < iQueries; iQuery++) {
      let dEndTime = new Date(dStartTime);
      dEndTime = new Date(dEndTime.setMinutes(dEndTime.getMinutes() - 60 / iQueries));
      const aStartTimes = dStartTime.toLocaleTimeString().split(':', 2);
      const sStartTime = aStartTimes[0] + ':' + aStartTimes[1];
      const aEndTimes = dEndTime.toLocaleTimeString().split(':', 2);
      const sEndTime = aEndTimes[0] + ':' + aEndTimes[1];

      aRequests.push({
          start: sStartTime,
          end: sEndTime
        }

      );
      dStartTime = dEndTime;
    }


    const aPromises = [];

    for (let i = 0; i < 60; i++) {
      aPromises.push(this._readDataUrlWithTime(aRequests[i].start, aRequests[i].end));
    }

    // split requests for better performance
    Promise.all(aPromises).then(() => {
        TwoDMapController.setGeoJsonMarkers();
        TwoDMapController.addTimeLayerToMap();
        const dCurrentDate = new Date(Date.now());
        this.sLocalDate = dCurrentDate.toLocaleDateString();
        const aTimes = dCurrentDate.toLocaleTimeString().split(':', 2);
        this.sLocalTime = aTimes[0] + ':' + aTimes[1];
        document.getElementById('count-birdstrike').innerHTML = TwoDMapController.iBirdStrikeCount.toString();
        document.getElementById('highest-birdstrike').innerHTML = 'Höchste Meldung: ' + TwoDMapController.iHighestBird + ' ft';
        document.getElementById('info-update').innerHTML = this.sLocalDate + '<br>' + this.sLocalTime + ' Uhr';

        if (AppModule.bStarted) {
          document.getElementById('loading-panel').style.display = 'none';
          document.getElementById('control-panel').style.display = '';
          document.getElementById('TwoDMap').style.visibility = 'visible';
        }
      }

    ).catch((e) => {
        console.log('REST Server error. Lost connection');
        console.log(e);
        document.getElementById('loading-panel').style.display = 'none';
        document.getElementById('control-panel').style.display = 'none';
        document.getElementById('loadingmodal').style.visibility = 'hidden';
        document.getElementById('smww-panel').style.display = '';
        document.getElementById('TwoDMap').style.visibility = 'none';
        this.oRefreshInterval = null;
      }

    );
  }

  /**
   * returns Promise with ajax request of birds data
   * set Data to local arrays
   * @param  sStartTime Starttime for Request
   * @param  sEndTime Endtime for Request
   * @returns  Promise with ajax request
   */
  _readDataUrlWithTime(sEndTime: string, sStartTime: string): Promise < void > {

    return new Promise((resolve, reject) => {
        // split to get H and min of Time string
        const aStartTime = sStartTime.split(':') as any;
        const aEndTime = sEndTime.split(':') as any;

        // get MS of TimeString
        const iStartTime = (aStartTime[0] * 3600 + aStartTime[1] * 60) * 1000;
        const iEndTime = (aEndTime[0] * 3600 + aEndTime[1] * 60) * 1000;

        $.ajax({

            crossOrigin: true,
            url: 'http://localhost:4200/data/birds/' + iStartTime + '/' + iEndTime,
            success: (oData) => {
                oData = oData.res;

                for (const oBirdData of oData) {
                  if (oBirdData.time !== undefined) {
                    const oBird = new Bird(parseFloat(oBirdData.alt), parseFloat(oBirdData.lng), parseFloat(oBirdData.lat), oBirdData.time);

                    for (const oGeoRef of AppModule.GEOREF) {
                      if (oBird.dLat >= oGeoRef.iLatStart && oBird.dLat <= oGeoRef.iLatEnd && oBird.dLng >= oGeoRef.iLngStart && oBird.dLng <= oGeoRef.iLngEnd) {
                        oBird.sGeoRef = oGeoRef.sZone + '' + oGeoRef.sLetter;
                        break;
                      }
                    }

                    AppModule.aBirds.push(oBird);
                    let oMap = TwoDMapController.getMapObject();

                    oMap.on('styledata', () => {
                        TwoDMapController.setMarkerBasedOnTime(oBird.getMinutes(), oBird);
                        TwoDMapController.setMarkerBasedOnHeight(oBird.dAlt, oBird);
                        resolve();
                      }

                    );

                  }
                }

              }

              ,
            error: (oError) => {
              console.log(oError);
              reject();
            }
          }

        );
      }

    );
  }

  /**
   * Handler Shows GeoRef Squares
   * @param oEvent clickevent
   */
  setGeoRefSquares(oEvent: any): void {
    TwoDMapController.setGeoRefSquares(oEvent);
  }

  /**
   * Reset Map Data
   */
  resetMapData(): void {

    AppModule.aGeoArray = {
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
    }

    ;

    AppModule.aTimeArray = {}

    ;
    TwoDMapController.iHighestBird = 0;
    TwoDMapController.iBirdStrikeCount = 0;
  }

  /**
   * Setter for modals
   * @param oInstancesModals Array with Modal instance
   */
  setModalInstances(oInstancesModals): void {

    AppModule.oCrossSectionModal = oInstancesModals[0];
    AppModule.oLoadingModal = oInstancesModals[1];
  }

  /**
   * open Cross-Section Dialog
   */
  openCrossSectionDialog(): void {
    CrossSectionController.setDataToCrossSectionDialog();
    AppModule.oCrossSectionModal.open();
  }

  show3dViewer(): void {
    AppModule.oLoadingModal.open();
    if (!this.is3D) {
      TwoDMapController.disableHeightLayers();
      Promise.all([
        ThreeDMapController.loadMap()
      ]).then(() => {
        document.getElementById('ThreeDMap').style.visibility = 'visible';
        document.getElementById('TwoDMap').style.visibility = 'hidden';
        document.getElementById('threedviewbtn').innerHTML = "2D Darstellung"
        this.is3D = true;
        AppModule.oLoadingModal.close();
      });

    } else {
      ThreeDMapController.disableHeightLayers();
      document.getElementById('ThreeDMap').style.visibility = 'hidden';
      document.getElementById('TwoDMap').style.visibility = 'visible';
      document.getElementById('threedviewbtn').innerHTML = "3D Darstellung"
      this.is3D = false;
      AppModule.oLoadingModal.close();
    }

  }

}

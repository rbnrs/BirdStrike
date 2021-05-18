import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  ChartOptions,
  TimeSeriesScale,
  ChartData,
  ChartItem,
  Filler,
  Legend,
  Title,
  Tooltip
} from 'chart.js';

import {
  AppModule
} from '../app.module';
import { Bird } from '../utils/bird.utils';
import {
  Colors
} from '../utils/colors.utils';
import { Georef } from '../utils/georef.utils';
import { TwoDMapController } from './2dmap.controller';



Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Filler,
  Legend,
  Title,
  Tooltip
);


export class StatisticsController {

  static oCrossSectionChart: any;
  static oBarChart: any;
  static iGeoRefCounter: any;
  static iHighestBirdGeoRef: number;


  static setDataToBarChart(): void{

    const oBarChartCanvas = document.getElementById('barchart');
    if (this.oBarChart){
      this.oBarChart.destroy();
    }

    this.oBarChart = new Chart(oBarChartCanvas as ChartItem, {
      type: 'bar',
      data: this.createChartDataBar(),
      options: {
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: AppModule.sCurrentGeoRef
          }
        },
      } as ChartOptions

    });
  }

  static setDataToCrossSectionChart(): void {

    const oCrossSectionCanvas = document.getElementById('crosssectionchart');

    if (this.oCrossSectionChart){
      this.oCrossSectionChart.destroy();
    }
    this.oCrossSectionChart = new Chart(oCrossSectionCanvas as ChartItem, {
      type: 'bubble',
      data: this.createChartDataCrossSection(),
      options: {
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: AppModule.sCurrentGeoRef
          }
        },
        scales: {
          yAxes: {
            scaleLabel: {
              display: true,
              labelString: 'Vogelschwarm Höhe'
            },
            ticks: {
              beginAtZero: true
            }
          },
          xAxes: {
            scaleLabel: {
              display: true,
              labelString: 'Standort: ' + AppModule.oLatLng.lat + ',' + AppModule.oLatLng.lng
            }
          }
        }
      } as ChartOptions
    });
  }

  static createChartDataBar(): ChartData {
    const oDataSet = [
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
      0
    ];

    for (const oBird of AppModule.aBirds) {

      if (oBird.sGeoRef === AppModule.sCurrentGeoRef) {
        oDataSet[oBird.getHeightLevelBasedOnHeight() - 1] = oDataSet[oBird.getHeightLevelBasedOnHeight() - 1] + 1;
      }

    }

    return {
      labels: [
              '< 1 kft',
              '1 - 2 kft',
              '2 - 3 kft',
              '3 - 4 kft',
              '4 - 5 kft',
              '5 - 6 kft',
              '6 - 8 kft',
              '8 - 10 kft',
              '10 - 12 kft',
              '> 12 kft'],
      datasets: [
        {
          backgroundColor: '#3F9B93',
          borderColor: '#3F9B93',
          data: oDataSet,
          label: 'Verteilung der Meldungen je Höhenlevel'
        },
      ]
    };
  }

  static setOthersData(sLocalDate, sLocalTime): void {

    let oGeoRefMost = new Georef(0, 0, 0, 0, '', '');

    // tslint:disable-next-line: prefer-for-of
    for (let iPos = 0; iPos < AppModule.GEOREF.length; iPos++){
      const oGeoRef = AppModule.GEOREF[iPos];
      if (oGeoRefMost.iCounter < oGeoRef.iCounter){
        oGeoRefMost = oGeoRef;
      }
    }


    let aHeightLevelMost = [];
    let iHeightLevelMost = 1;

    // tslint:disable-next-line: prefer-for-of
    for (const iHeightLevel in AppModule.aHeightArrayBirds) {
      if(AppModule.aHeightArrayBirds.hasOwnProperty(iHeightLevel)){
        const aHeightLevel = AppModule.aHeightArrayBirds[iHeightLevel];
        if (aHeightLevelMost.length < aHeightLevel.length){
          aHeightLevelMost = aHeightLevel;
          iHeightLevelMost = parseInt(iHeightLevel, 10);
        }
      }
    }

    document.getElementById('otherstatcount').innerHTML = TwoDMapController.iBirdStrikeCount.toString();
    document.getElementById('otherstatcountgeoref').innerHTML = this.iGeoRefCounter.toString();
    document.getElementById('otherstatgeoref').innerHTML = AppModule.sCurrentGeoRef;
    document.getElementById('otherstatgeorefcountmost').innerHTML = oGeoRefMost.sZone + oGeoRefMost.sLetter + ' (' + oGeoRefMost.iCounter + ')';
    document.getElementById('otherstathighestgeoref').innerHTML = this.iHighestBirdGeoRef.toString() + ' kft';
    document.getElementById('otherstathighest').innerHTML = TwoDMapController.iHighestBird.toString() + ' kft';
    document.getElementById('otherstatlastupdate').innerHTML = sLocalTime + ' Uhr, ' + sLocalDate;
    // tslint:disable-next-line: max-line-length
    document.getElementById('otherstatmostlevel').innerHTML = Bird.getHeightLevelStringByHeightLevel(iHeightLevelMost) + ' (' + aHeightLevelMost.length + ')';

    //TODO change when risk data is available
    document.getElementById('otherstatrisk').innerHTML = '3 - Mittel';
    document.getElementById('otherstatriskgeoref').innerHTML = '1 - Leicht';


  }

  static createChartDataCrossSection(): ChartData {
    const oDataSet = {
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

    this.iGeoRefCounter = 0;
    this.iHighestBirdGeoRef = 0;
    for (const oBird of AppModule.aBirds) {

      if (oBird.sGeoRef === AppModule.sCurrentGeoRef) {
        this.iGeoRefCounter++;
        if (this.iHighestBirdGeoRef < oBird.dAlt){
          this.iHighestBirdGeoRef = oBird.dAlt;
        }
        const oData = {
          x: oBird.dLat,
          y: oBird.dAlt,
          r: 2
        };
        oDataSet['aDataSetColor' + oBird.getHeightLevelBasedOnHeight()].push(oData);
      }

    }

    console.log(this.iGeoRefCounter);


    return {
      datasets: [{
          label: '< 1 kft',
          backgroundColor: Colors.color1,
          borderColor: Colors.color1,
          data: oDataSet['aDataSetColor' + 1]
        },
        {
          label: '1 - 2 kft',
          backgroundColor: Colors.color2,
          borderColor: Colors.color2,
          data: oDataSet['aDataSetColor' + 2]
        },
        {
          label: '2 - 3 kft',
          backgroundColor: Colors.color3,
          borderColor: Colors.color3,
          data: oDataSet['aDataSetColor' + 3]
        },
        {
          label: '3 - 4 kft',
          backgroundColor: Colors.color4,
          borderColor: Colors.color4,
          data: oDataSet['aDataSetColor' + 4]
        },
        {
          label: '4 - 5 kft',
          backgroundColor: Colors.color5,
          borderColor: Colors.color5,
          data: oDataSet['aDataSetColor' + 5]
        },
        {
          label: '5 - 6 kft',
          backgroundColor: Colors.color6,
          borderColor: Colors.color6,
          data: oDataSet['aDataSetColor' + 6]
        },
        {
          label: '6 - 8 kft',
          backgroundColor: Colors.color7,
          borderColor: Colors.color7,
          data: oDataSet['aDataSetColor' + 7]
        },
        {
          label: '8 - 10 kft',
          backgroundColor: Colors.color8,
          borderColor: Colors.color8,
          data: oDataSet['aDataSetColor' + 8]
        },
        {

          label: '10 - 12 kft',
          backgroundColor: Colors.color9,
          borderColor: Colors.color9,
          data: oDataSet['aDataSetColor' + 9]
        },
        {
          label: '> 12 kft',
          backgroundColor: Colors.color10,
          borderColor: Colors.color10,
          data: oDataSet['aDataSetColor' + 10]
        },
      ]
    };
  }

}

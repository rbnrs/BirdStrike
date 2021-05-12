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
} from "../app.module";
import {
  Colors
} from "../utils/colors.utils";



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


export class CrossSectionController {

  static oCrossSectionChart: any;


  static setDataToCrossSectionDialog(): void {

    const oCrossSectionCanvas = document.getElementById('crosssectionchart');

    this.oCrossSectionChart = new Chart(oCrossSectionCanvas as ChartItem, {
      type: 'bubble',
      data: this.createCharData(),
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

  static createCharData(): ChartData {
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

    for (const oBird of AppModule.aBirds) {

      if (oBird.sGeoRef === AppModule.sCurrentGeoRef) {
        const oData = {
          x: oBird.dLat,
          y: oBird.dAlt,
          r: 2
        };
        oDataSet['aDataSetColor' + oBird.getHeightLevelBasedOnHeight()].push(oData);
      }

    }


    return {
      datasets: [{
          label: '< 1 kft',
          backgroundColor: Colors.color1,
          borderColor: Colors.color1,
          data: oDataSet['aDataSetColor' + 1]
        },
        {
          label: '1 - 3 kft',
          backgroundColor: Colors.color2,
          borderColor: Colors.color2,
          data: oDataSet['aDataSetColor' + 2]
        },
        {
          label: '3 - 5 kft',
          backgroundColor: Colors.color3,
          borderColor: Colors.color3,
          data: oDataSet['aDataSetColor' + 3]
        },
        {
          label: '5 - 10 kft',
          backgroundColor: Colors.color4,
          borderColor: Colors.color4,
          data: oDataSet['aDataSetColor' + 4]
        },
        {
          label: '10 - 15 kft',
          backgroundColor: Colors.color5,
          borderColor: Colors.color5,
          data: oDataSet['aDataSetColor' + 5]
        },
        {
          label: '15 - 20 kft',
          backgroundColor: Colors.color6,
          borderColor: Colors.color6,
          data: oDataSet['aDataSetColor' + 6]
        },
        {
          label: '20 - 25 kft',
          backgroundColor: Colors.color7,
          borderColor: Colors.color7,
          data: oDataSet['aDataSetColor' + 7]
        },
        {
          label: '25 - 30 kft',
          backgroundColor: Colors.color8,
          borderColor: Colors.color8,
          data: oDataSet['aDataSetColor' + 8]
        },
        {

          label: '30 - 35 kft',
          backgroundColor: Colors.color9,
          borderColor: Colors.color9,
          data: oDataSet['aDataSetColor' + 9]
        },
        {
          label: '> 35 kft',
          backgroundColor: Colors.color10,
          borderColor: Colors.color10,
          data: oDataSet['aDataSetColor' + 10]
        },
      ]
    };
  }

}

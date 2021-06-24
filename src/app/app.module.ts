import { NgModule, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {Routes,  RouterModule} from '@angular/router';
import { AppComponent } from './app.component';
import { MapViewComponent } from './component/map-view/map-view.component';
import { Bird } from './utils/bird.utils';
import { Georef } from './utils/georef.utils';

const aRoutes: Routes = [
  {
    path: '',
    component: MapViewComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    MapViewComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(aRoutes, {useHash: false})
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule{

  static bStarted = false;
  static GEOREF: Georef[] = [];
  static oLoadingModal: any;
  static aTimeArrayGeoJSON: {};
  static aTimeArrayBirds: {};
  static aGeoArray: any;
  static aHeightArrayBirds: {};
  static oLatLng: any;
  static sCurrentGeoRef: string;
  static aBirds: Bird[] = [];
  static oSettingsModal: any;
  static iStartTime: number;
  static oDetailDialog: any;
  static aSelectedLayers = [];


  static startPerformanceTesting(): void{
    this.iStartTime = Date.now();
  }

  static printCurrentTimestamp(text: string): void{
    console.log(text + " " + (Date.now() - this.iStartTime) + " ms  ");
  }

}

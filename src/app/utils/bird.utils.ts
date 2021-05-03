export class Bird {

  dAlt: number;
  dLat: number;
  dLng: number;
  sTime: string;
  sGeoRef: string;

  constructor(dAlt: number, dLng: number, dLat: number, iTime: number) {

    this.dAlt = dAlt;
    this.dLng = dLng;
    this.dLat = dLat;
    this.sTime = this.getTimeString(iTime);
  }

  /**
   * creates Time String
   * @param iTime time in milliseconds
   * @returns Time String
   */
  getTimeString(iTime: number): string {

    const dDate = new Date(iTime);
    const sTimeString = dDate.toLocaleTimeString();
    const aTimeSplit = sTimeString.split(':');
    return aTimeSplit[0] + ':' + aTimeSplit[1];
  }

  /**
   * returns minutes of bird time
   */
  getMinutes(): number{
    return parseInt(this.sTime.split(':')[1], 10);
  }

  /**
   * get Level based on Birds Height
   */
  getHeightLevelBasedOnHeight(): number {

    if (this.dAlt < 1000) {
      return 1;
    } else if (this.dAlt < 3000) {
      return 2;
    } else if (this.dAlt < 5000) {
      return 3;
    } else if (this.dAlt < 10000) {
      return 4;
    } else if (this.dAlt < 15000) {
      return 5;
    } else if (this.dAlt < 20000) {
      return 6;
    } else if (this.dAlt < 25000) {
      return 7;
    } else if (this.dAlt < 30000) {
      return 8;
    } else if (this.dAlt < 35000) {
      return 9;
    } else if (this.dAlt > 35000) {
      return 10;
    }
  }

}

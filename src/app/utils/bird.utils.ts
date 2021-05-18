export class Bird {

  dAlt: number;
  dLat: number;
  dLng: number;
  sTime: string;
  sGeoRef: string;
  iTime: number;

  constructor(dAlt: number, dLng: number, dLat: number, iTime: number) {

    this.dAlt = dAlt;
    this.dLng = dLng;
    this.dLat = dLat;
    //this.sTime = this.getTimeString(iTime);
    this.iTime = iTime;
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
  getMinutes(): number {
    // return parseInt(this.sTime.split(':')[1], 10);
    return this.iTime;
  }

  /**
   * get Level based on Birds Height
   */
  getHeightLevelBasedOnHeight(): number {

    if (this.dAlt < 1000) {
      return 1;
    } else if (this.dAlt < 2000) {
      return 2;
    } else if (this.dAlt < 3000) {
      return 3;
    } else if (this.dAlt < 4000) {
      return 4;
    } else if (this.dAlt < 5000) {
      return 5;
    } else if (this.dAlt < 6000) {
      return 6;
    } else if (this.dAlt < 8000) {
      return 7;
    } else if (this.dAlt < 10000) {
      return 8;
    } else if (this.dAlt < 12000) {
      return 9;
    } else if (this.dAlt >= 12000) {
      return 10;
    }
  }

  // tslint:disable-next-line: member-ordering
  static getHeightLevelStringByHeightLevel(iHeightLevel: number): string {

    if (1 === iHeightLevel) {
      return '< 1 kft';
    } else if (2 === iHeightLevel) {
      return '1 - 2 kft';
    } else if (3 === iHeightLevel) {
      return '2 - 3 kft';
    } else if (4 === iHeightLevel) {
      return '3 - 4 kft';
    } else if (5 === iHeightLevel) {
      return '4 - 5 kft';
    } else if (6 === iHeightLevel) {
      return '5 - 6 kft';
    } else if (7 === iHeightLevel) {
      return '6 - 8 kft';
    } else if (8 === iHeightLevel) {
      return '8 - 10 kft';
    } else if (9 === iHeightLevel) {
      return '10 - 12 kft';
    } else if (10 === iHeightLevel) {
      return '> 12 kft';
    }

    return 'ERROR';
  }

}

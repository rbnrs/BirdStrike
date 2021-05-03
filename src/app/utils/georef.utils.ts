export class Georef {

  iLngStart: number;
  iLatStart: number;
  iLngEnd: number;
  iLatEnd: number;
  sLetter: string;
  sZone: string;


  constructor(iLngStart: number, iLatStart: number, iLngEnd: number, iLatEnd: number, sLetter: string, sZone: string) {

    this.iLngStart = iLngStart;
    this.iLatStart = iLatStart;
    this.iLngEnd = iLngEnd;
    this.iLatEnd = iLatEnd;
    this.sLetter = sLetter;
    this.sZone = sZone;

  }



  static getStartPosition(cChar): number {
    const sCoordinates = 'ABCDEFGHJKLMNPQ';

    for (let i = 0; i < 15; i++) {
      const cRes = sCoordinates.charAt(i);
      if (cRes === cChar) {
        return i + 1;
      }
    }
  }

  static nextChar(cChar): string {
    const cCharNext = String.fromCharCode(cChar.charCodeAt(0) + 1);

    if (cCharNext !== 'I' && cCharNext !== 'O') {
      return cCharNext;
    }
    return String.fromCharCode(cCharNext.charCodeAt(0) + 1);
  }
}

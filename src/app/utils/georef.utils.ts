export class Georef {

  iLngStart: number;
  iLatStart: number;
  iLngEnd: number;
  iLatEnd: number;
  sLetter: string;
  sZone: string;
  iCounter: number;
  iPrediction: number;


  constructor(iLngStart: number, iLatStart: number, iLngEnd: number, iLatEnd: number, sLetter: string, sZone: string) {

    this.iLngStart = iLngStart;
    this.iLatStart = iLatStart;
    this.iLngEnd = iLngEnd;
    this.iLatEnd = iLatEnd;
    this.sLetter = sLetter;
    this.sZone = sZone;
    this.iCounter = 0;

  }

  setPrediction(iPrediction: number): void {
    this.iPrediction = iPrediction;
  }

  getRiskColor(): string {
    switch (this.iPrediction) {
      case 1:
        return "#42FF00";
      case 2:
        return "#A1FF0F";
      case 3:
        return "#EDFF00";
      case 4:
        return "#FF3802";
      case 5:
        return "#FF003D";
      default:
        return "#000000";
    }
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

  static counterRiskSize(iCounter): number {

    if (iCounter < 500) {
      return 15;
    } else if (iCounter <= 2000) {
      return 19;
    } else if (iCounter <= 5000) {
      return 23;
    } else if (iCounter <= 10000) {
      return 27
    } else if (iCounter > 10000) {
      return 31;
    }

    return 15;
  }

  static counterRiskColor(iCounter): string {

    if (iCounter < 500) {
      return '#9fbacd';
    } else if (iCounter <= 2000) {
      return '#789eb9';
    } else if (iCounter <= 5000) {
      return '#5282a5';
    } else if (iCounter <= 10000) {
      return '#38698b';
    } else if (iCounter > 10000) {
      return '#2c516c';
    }

    return '#9fbacd';
  }

  getRiskText(): string {

    switch (this.iPrediction) {
      case 1:
        return "1 - Sehr Leicht";
      case 2:
        return "2 - Leicht";
      case 3:
        return "3 - Mittel";
      case 4:
        return "4 - Hoch";
      case 5:
        return "5 - Sehr Hoch";
      default:
        return "0 - Kein Risiko";
    }
  }

}

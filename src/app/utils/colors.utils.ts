export class Colors {

  static color1 = '#42FF00';
  static color2 = '#A1FF0F';
  static color3 = '#D8FF00';
  static color4 = '#EDFF00';
  static color5 = '#FFE207';
  static color6 = '#FFBF00';
  static color7 = '#FF8900';
  static color8 = '#FF3802';
  static color9 = '#FF003D';
  static color10 = '#FF03B9';


  static getColorByLevel(iLevel: number): string {

    switch (iLevel) {
      case 1:
        return this.color1;
      case 2:
        return this.color2;
      case 3:
        return this.color3;
      case 4:
        return this.color4;
      case 5:
        return this.color5;
      case 6:
        return this.color6;
      case 7:
        return this.color7;
      case 8:
        return this.color8;
      case 9:
        return this.color9;
      case 10:
        return this.color10;
    }
  }
}

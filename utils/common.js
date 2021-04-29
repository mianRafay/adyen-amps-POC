const common = {
     /**
   * @name  utf16Converter
   * @param  {string} {str}
   * @return {string | undefined}
   * @summary convert javascript UTF8 into UTF16
   *
   */
  utf16Converter: (str) => {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
      c = str.charCodeAt(i++);
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          out += str.charAt(i - 1);
          break;
        case 12:
        case 13:
          char2 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
          out += str.charAt(i - 1);
          break;
        case 14:
          char2 = str.charCodeAt(i++);
          char3 = str.charCodeAt(i++);
          out += String.fromCharCode(
            ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
          );
          break;
      }
    }

    var byteArray = new Uint8Array(out.length * 2);
    for (var j = 0; j < out.length; j++) {
      byteArray[j * 2] = out.charCodeAt(j); // & 0xff;
      byteArray[j * 2 + 1] = out.charCodeAt(j) >> 8; // & 0xff;
    }

    return String.fromCharCode.apply(String, byteArray);
  },

  /**
   * @name  hex2a
   * @param  {string} {key}
   * @return {string | undefined}
   * @summary convert hex2asci
   *
   */
  hex2a: (key) => {
    var str = "";
    for (var i = 0; i < key.length; i += 2) {
      str += String.fromCharCode(parseInt(key.substr(i, 2), 16));
    }
    return str;
  },

};

module.exports = common;

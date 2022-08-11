export function normalizeText(text: string) {
  //--------------------Ready text for typing----------------------
  text = text.replaceAll('	', '').replaceAll(' ', '');
  text = text.replaceAll("  ", " ");
  text = text.replaceAll("\n", "");

  const textArr = text.split("");

  // Don't allow first character to be whitespace
  while (textArr[0] == "\n" || textArr[0] == " ") {
    textArr.splice(0, 1);
  }

  // Don't allow last character to be whitespace
  while (textArr[text.length - 1] == "\n" || textArr[text.length - 1] == " ") {
    textArr.splice(text.length - 1, 1);
  }

  text = textArr.join("");

  text = text.replace(/[\t\r\v\f\b\0]/g, '');

  return text;
}
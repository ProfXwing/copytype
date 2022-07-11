export function normalizeText(text) {
    //--------------------Ready text for typing----------------------
    text = text.replaceAll('	', '').replaceAll(' ', '');
    text = text.replaceAll("  ", " ");
    text = text.replaceAll("\n", "");

    text = text.split("");

    // Don't allow first character to be whitespace
    while (text[0] == "\n" || text[0] == " ") {
        text.splice(0, 1);
    }

    // Don't allow last character to be whitespace
    while (text[text.length - 1] == "\n" || text[text.length - 1] == " ") {
        text.splice(text.length - 1, 1);
    }

    text = text.join("");


    text = text.replace(/[\t\r\v\f\b\0]/g, '');

    return text;
}
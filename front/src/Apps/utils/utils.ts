/**
 * Extract postalCode from address, ie:
 * extractPostalCodeFromAddress("37 RUE JEAN JACQUES NEUFER 57230 BITCHE") = 57230
 */
const POSTAL_CODE_REGEX = new RegExp(/^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/);
export const extractPostalCodeFromAddress = (
  address?: string
): string | undefined => {
  if (!address) return undefined;

  const clean = address.replace(/,/g, "").split(" ");

  // Technically the postalCode is likely to be the last code in the address,
  // so reverse (in case the street number is huge, for instace: "4100 rue du moulin...")
  return clean.reverse().find(s => s.match(POSTAL_CODE_REGEX));
};

/**
 * Copy some text to the clipboards. Contains fallbacks for unsafe origins or old
 * browers
 *
 * SO thread: https://stackoverflow.com/questions/51805395/navigator-clipboard-is-undefined
 */
export const copyToClipboard = async (textToCopy: string) => {
  // Navigator clipboard api needs a secure context (https)
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(textToCopy);
  } else {
    // Use the 'out of viewport hidden text area' trick
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;

    // Move textarea out of the viewport so it's not visible
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";

    document.body.prepend(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
    } finally {
      textArea.remove();
    }
  }
};

/**
 * Transforms a string into a suitable var name (camelCase)
 * ex: "Bordereaux de l'entreprise" > "bordreaux_de_lentreprise"
 */
export const toCamelCaseVarName = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .toLocaleLowerCase()
    .replace(/\s/g, "_")
    .trim();
};

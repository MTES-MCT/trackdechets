export const MEDIA_QUERIES = {
  handHeld: "900px"
};

export const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string) ||
  "contact@trackdechets.beta.gouv.fr";

export const SENDER_EMAIL =
  (import.meta.env.VITE_SENDER_EMAIL as string) ||
  "info@trackdechets.beta.gouv.fr";

export const DEVELOPERS_DOCUMENTATION_URL =
  (import.meta.env.VITE_DEVELOPERS_DOCUMENTATION_URL as string) ||
  "https://developers.trackdechets.beta.gouv.fr";

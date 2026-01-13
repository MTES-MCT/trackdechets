import { envConfig } from "./envConfig";

export const MEDIA_QUERIES = {
  handHeld: "992px"
};

export const SENDER_EMAIL = envConfig.VITE_SENDER_EMAIL;

export const DEVELOPERS_DOCUMENTATION_URL =
  envConfig.VITE_DEVELOPERS_DOCUMENTATION_URL;

export const TOAST_DURATION = 6000; // ms

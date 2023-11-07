import { setLocale } from "yup";

const locale = {
  mixed: {
    default: "Champ invalide",
    required: "Champ requis"
  },
  string: {
    url: "URL invalide",
    email: "Email invalide"
  }
};

function setYupLocale() {
  setLocale(locale);
}
export default setYupLocale;

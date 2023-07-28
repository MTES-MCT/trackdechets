import Plausible from "plausible-tracker";

const { DEV } = import.meta.env;
const isDevelopment = DEV;

if (!isDevelopment) {
  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

  if (plausibleDomain) {
    const { enableAutoPageviews } = Plausible({
      // Var d'ENV représentant l'identifiant de l'application sur Plausible
      domain: plausibleDomain,
      // URL de l'application Plausible self-hosted
      apiHost: "https://plausible.trackdechets.beta.gouv.fr",
    });

    enableAutoPageviews();
  }
}

import { useEffect } from "react";

/**
 * ========================
 * CRISP HOOK (SAFE + SPA FRIENDLY)
 * ========================
 *
 *  Objectif :
 * - Charger Crisp uniquement si activé
 * - Garder la session utilisateur (historique conversation)
 * - Éviter les reload et les destructions agressives
 * - Gérer proprement show / hide du chat
 */

export function useCrisp(enabled: boolean) {
  useEffect(() => {
    /**
     * ========================
     * CAS 1 : CRISP ACTIVÉ
     * ========================
     */
    if (enabled) {
      /**
       * Si Crisp n'est pas encore initialisé :
       * → on crée la queue + on injecte le script
       */
      if (!(window as any).$crisp) {
        // File de commandes Crisp (obligatoire avant chargement script)
        (window as any).$crisp = [];

        // ID du site Crisp (DOIT être défini avant chargement script)
        (window as any).CRISP_WEBSITE_ID =
          "81e9b326-1c34-427a-b5ab-2e004ffa180a";

        /**
         * Injection du script Crisp
         * → charge le widget chat
         */
        const script = document.createElement("script");
        script.src = "https://client.crisp.chat/l.js";
        script.async = true;
        script.id = "crisp-script";

        document.head.appendChild(script);
      } else {
        /**
         * Si Crisp est déjà chargé :
         * → on ré-affiche simplement le chat
         */
        (window as any).$crisp.push(["do", "chat:show"]);
      }

      return;
    }

    /**
     * ========================
     * CAS 2 : CRISP DÉSACTIVÉ
     * ========================
     *
     *  IMPORTANT :
     * On NE supprime PAS la session
     * On NE reset PAS les cookies
     * → sinon perte de conversation utilisateur
     */

    if ((window as any).$crisp) {
      /**
       * On masque simplement le widget
       * (le chat reste chargé mais invisible)
       */
      (window as any).$crisp.push(["do", "chat:hide"]);
    }

    //  volontairement NON utilisé :
    // - session:reset (perd les conversations)
    // - suppression iframe
    // - delete window.$crisp
  }, [enabled]);
}

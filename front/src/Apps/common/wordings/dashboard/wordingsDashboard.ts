// boutons d'actions primaire bsd card
export const VALIDER_TRAITEMENT = "Valider le traitement";
export const VALIDER_ACCEPTATION = "Valider l'acceptation";
export const PUBLIER = "Publier";
export const SIGNER = "Signer";
export const SIGNER_EN_TANT_QUE_TRAVAUX =
  "Signer en tant qu'entreprise de travaux";
export const SIGNATURE_ECO_ORG = "Signature Éco-organisme";
export const FAIRE_SIGNER = "Faire signer";
export const VALIDER_ENTREPOSAGE_PROVISOIRE =
  "Valider l'entreposage provisoire";
export const VALIDER_RECEPTION = "Valider la réception";
export const SIGNER_ENLEVEMENT = "Signer l'enlèvement";
export const VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE =
  "Valider l'acceptation de l'entreposage provisoire";
export const SIGNATURE_ACCEPTATION_CONTENANT = "Gérer les contenants";

// status badge
export const BROUILLON = "Brouillon";
export const RECU = "Reçu, en attente d'acceptation";
export const ACCEPTE = "ACCEPTÉ, EN ATTENTE DE TRAITEMENT";
export const TRAITE = "Traité";
export const ANNEXE_BORDEREAU_SUITE = "Annexé à un bordereau suite";
export const TRAITE_AVEC_RUPTURE_TRACABILITE =
  "Traité (avec rupture de traçabilité)";
export const REFUSE = "REFUSÉ";
export const ARRIVE_ENTREPOS_PROVISOIRE =
  "ARRIVÉ À L’ENTREPOSAGE PROVISOIRE, EN ATTENTE D’ACCEPTATION";
export const ENTREPOS_TEMPORAIREMENT =
  "entreposé temporairement ou en reconditionnement";
export const BSD_SUITE_PREPARE = "BSD suite préparé";
export const SIGNE_PAR_TRANSPORTEUR = "signé par le transporteur";
export const INITIAL = "publié";
export const SIGNE_PAR_EMETTEUR = "signé par l’émetteur";
export const SIGNER_PAR_ENTREPOS_PROVISOIRE =
  "Signé par l'installation d'entreposage provisoire";
export const PARTIELLEMENT_REFUSE = "Partiellement refusé";
export const SUIVI_PAR_PNTTD = "Suivi via PNTTD";
export const SIGNER_PAR_ENTREPRISE_TRAVAUX =
  "Signé par l'entreprise de travaux";
export const EN_ATTENTE_BSD_SUITE = "En attente d'un bordereau suite";
export const ANNULE = "Annulé";

// Additional actions buttons
export const apercu_action_label = "Aperçu";
export const pdf_action_label = "PDF";
export const modifier_action_label = "Modifier";
export const dupliquer_action_label = "Dupliquer";
export const revision_action_label = "Réviser";
export const supprimer_action_label = "Supprimer";
export const completer_bsd_suite = "Compléter le BSD suite";
export const annexe1 = "Annexe 1";

// blankstate
export const blankstate_action_title = "Il n'y a aucun bordereau à signer";
export const blankstate_action_desc = `Bonne nouvelle, vous n'avez aucun bordereau à signer ! Des
bordereaux apparaissent dans cet onglet uniquement lorsque vous avez
une action à effectuer dans le cadre de leur cycle de vie (envoi,
réception ou traitement...)`;
export const blankstate_history_title = "Il n'y a aucun bordereau en archive";
export const blankstate_history_desc = ` Des bordereaux apparaissent dans cet onglet lorsqu'ils ont terminé
leur cycle de vie. Ils sont alors disponibles en lecture seule
pour consultation.`;
export const blankstate_draft_title = "Il n'y a aucun bordereau en brouillon";
export const blankstate_draft_desc = `Si vous le souhaitez, vous pouvez créer un bordereau depuis le menu de
création ci-dessus ou dupliquer un bordereau déjà existant dans un autre
onglet grâce à l'icône `;
export const blankstate_follow_title = "Il n'y a aucun bordereau à suivre";
export const blankstate_follow_desc = `Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en
attente d'une action extérieure. Par exemple lorsqu'en tant que
producteur vous attendez la réception d'un déchet ou son
traitement. La colonne STATUT vous renseignera
sur l'état précis du bordereau.`;
export const blankstate_reviews_title = "Il n'y a aucun bordereau en révision";
export const blankstate_reviews_desc =
  "Vous n'avez aucune révision en attente.";

// load more
export const load_more_bsds = "Charger plus de bordereaux";

// filters
export const filter_show_btn = "Chercher par";
export const filter_reset_btn = "Annuler les filtres";
export const filter_type_select_placeholder = "Sélectionner un type de filtre";
export const filter_type_select_label = "Type de filtre";
export const filter_type_apply_btn = "Appliquer les filtres";
export const filter_bsd_type = "Type de bordereau";
export const filter_siret = "Siret";
export const filter_waste_code = "Code déchet";
export const filter_bsd_number = "Numéro du bordereau";
export const filter_contenant_number = "Numéro de contenant (BSFF)";
export const filter_immat_number = "Numéro d'immatriculation";
export const filter_chantier_name = "Nom du chantier";
export const filter_chantier_adress = "Adresse du chantier";
export const filter_free_text = "Champs libres";
export const bsd_type_option_bsdd = "Déchets Dangereux";
export const bsd_type_option_bsvhu = "Véhicules Hors d'Usage";
export const bsd_type_option_bsff = "Déchets de Fluides Frigorigènes";
export const bsd_type_option_bsda = "Déchets d'Amiante";
export const bsd_type_option_bsdasri =
  "Déchets d'Activités de Soins à Risque Infectieux";
export const filter_type_select_option_placeholder = "Sélectionner une option";
export const max_filter_autorized_label =
  "Vous avez atteint le nombre de filtres maximum";
export const sr_btn_delete_filter_line = "supprimer un filtre";
export const sr_btn_add_filter_line = "ajouter un filtre";
export const multi_select_select_all_label = "Tout sélectionner";

// create dropdown
export const dropdown_create_btn = "Créer un bordereau";
export const dropdown_create_bsdd = "Déchets dangereux";
export const dropdown_create_bsda = "Amiante";
export const dropdown_create_bsdasri = "DASRI";
export const dropdown_create_bsvhu = "Véhicule Hors d’Usage";
export const dropdown_create_bsff = "Fluide Frigorifique";

export const bsddValidationDraftText = `Cette action aura pour effet de valider les données du bordereau et
            de le faire apparaitre dans l'onglet "Pour action" de l'émetteur
            ainsi que l'onglet "À collecter" du transporteur. Un identifiant
            unique lui sera attribué et vous pourrez générer un PDF. Le
            bordereau pourra cependant toujours être modifié ou supprimé depuis
            l'onglet "Pour action", "À collecter" ou "Suivi".`;

export const bsdaPublishDraft = ` Cette action aura pour effet de démarrer le cycle de vie du
            bordereau en le faisant apparaître dans l'onglet
            <strong>“Pour action”</strong> du tableau de bord de l'émetteur. Le
            bordereau pourra toujours être modifié ou supprimé tant qu'aucune
            signature n'a été apposée.`;

export const bsffPublishDraft = `Cette action aura pour effet de démarrer le cycle de vie du
            bordereau en le faisant apparaître dans l'onglet
            <strong>“Pour action”</strong> du tableau de bord de l'émetteur. Le
            bordereau pourra toujours être modifié ou supprimé tant qu'aucune
            signature n'a été apposée.`;
export const bsvhuPublishDraft = `Cette action aura pour effet de démarrer le cycle de vie du
            bordereau en le faisant apparaître dans l'onglet
            <strong>“Pour action”</strong> du tableau de bord de l'émetteur. Le
            bordereau pourra toujours être modifié ou supprimé tant qu'aucune
            signature n'a été apposée.`;

// tabs
export const DRAFTS = "Brouillons";
export const ACTS = "Pour action";
export const FOLLOWS = "Suivi";
export const ARCHIVES = "Archives";
export const REVIEWS = "Révisions";
export const TO_COLLECT = "À collecter";
export const COLLECTED = "Collecté";
export const REGISTER = "Registre";

// Reviews

export const APPROUVER_REFUSER_REVISION = "Approuver / Refuser";
export const CONSULTER_REVISION = "Consulter";
export const SUPRIMER_REVISION = "Supprimer la révision";

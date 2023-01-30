// boutons d'actions primaire bsd card
export const VALIDER = "Valider";
export const VALIDER_TRAITEMENT = "Valider le traitement";
export const VALIDER_ACCEPTATION = "Valider l'acceptation";
export const PUBLIER = "Publier";
export const SIGNER = "Signer";
export const SIGNER_EN_TANT_QUE_TRAVAUX =
  "Signer en tant qu'entreprise de travaux";
export const SIGNATURE_ECO_ORG = "Signature Éco-organisme";
export const SIGNATURE_PRODUCTEUR = "Signature producteur";
export const SIGNATURE_EMETTEUR = "Signer en tant qu'émetteur";
export const SIGNATURE_TRANSPORTEUR = "Signature transporteur";
export const VALIDER_ENTREPOSAGE_PROVISOIRE =
  "Valider l'entreposage provisoire";
export const VALIDER_RECEPTION = "Valider la réception";
export const SIGNER_RECEPTION = "Signer la réception";
export const SIGNER_ENLEVEMENT = "Signer l'enlèvement";
export const SIGNER_TRAITEMENT = "Signer le traitement";
export const SIGNER_ENTREPOSAGE_PROVISOIRE =
  "Signer en tant qu'entreposage provisoire";
export const VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE =
  "Valider l'acceptation de l'entreposage provisoire";
export const SIGNATURE_ACCEPTATION_CONTENANT =
  "Signature acceptation et traitement par contenant";

// status badge
export const BROUILLON = "Brouillon";
export const EN_ATTENTE_SIGNATURE_EMETTEUR =
  "En attente de signature par l’émetteur";
export const EN_ATTENTE_RECEPTION = "EN ATTENTE DE RÉCEPTION";
export const RECU = "reçu, en attente d’acceptation ou de refus";
export const ACCEPTE = "ACCEPTÉ, EN ATTENTE DE TRAITEMENT";
export const TRAITE = "Traité";
export const EN_ATTENTE_REGROUPEMENT = "EN ATTENTE DE REGROUPEMENT";
export const ANNEXE_BORDEREAU_REGROUPEMENT =
  "ANNEXÉ À UN BORDEREAU DE REGROUPEMENT";
export const REGROUPE_AVEC_RUPTURE_TRACABILITE =
  "regroupé, avec autorisation de RUPTURE DE TRAÇABILITÉ";
export const REFUSE = "REFUSÉ";
export const ARRIVE_ENTREPOS_PROVISOIRE =
  "ARRIVÉ À L’ENTREPOSAGE PROVISOIRE, EN ATTENTE D’ACCEPTATION";
export const ENTREPOS_TEMPORAIREMENT =
  "entreposé temporairement ou en reconditionnement";
export const EN_ATTENTE_SIGNATURE_ENTREPOS_PROVISOIRE =
  "en attente de signature par l’installation d’entreposage provisoire";
export const EN_ATTENTE_SIGNATURE = "EN ATTENTE DE RÉCEPTION pour traitement";
export const SIGNE_PAR_PRODUCTEUR = "signé par le producteur";
export const INITIAL = "initial";
export const SIGNE_PAR_EMETTEUR = "signé par l’émetteur";
export const SIGNER_PAR_ENTREPOS_PROVISOIRE =
  "Signé par l'installation d'entreposage provisoire";
export const PARTIELLEMENT_REFUSE = "Partiellement refusé";
export const SUIVI_PAR_PNTTD = "Suivi via PNTTD";
export const SIGNER_PAR_ENTREPRISE_TRAVAUX =
  "Signé par l'entreprise de travaux";
export const EN_ATTENTE_OU_BSD_SUITE = "En attente ou associé à un BSD suite";

// Additional actions buttons
export const apercu_action_label = "Vue détaillée";
export const pdf_action_label = "PDF";
export const modifier_action_label = "Modifier";
export const dupliquer_action_label = "Dupliquer";
export const revision_action_label = "Révision";
export const supprimer_action_label = "Supprimer";
export const completer_bsd_suite = "Compléter le BSD suite";

// breadcrumb
export const breadcrumb_title = "Mes Bordereaux";
export const breadcrumb_pour_action = "Pour Action";
export const breadcrumb_brouillon = "Brouillons";
export const breadcrumb_suivi = "Suivi";
export const breadcrumb_archive = "Archives";

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

// load more
export const load_more_bsds = "Charger plus de bordereaux";

// filters
export const filter_show_btn = "Chercher par";
export const filter_reset_btn = "Supprimer les filtres";
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

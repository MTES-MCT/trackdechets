// boutons d'actions primaire bsd card
export const VALIDER_TRAITEMENT = "Valider le traitement";
export const VALIDER_ACCEPTATION = "Valider l'acceptation";
export const PUBLIER = "Publier";
export const SIGNER = "Signer";
export const SIGNATURE_ECO_ORG = "Signature Éco-organisme";
export const FAIRE_SIGNER = "Faire signer";
export const VALIDER_ENTREPOSAGE_PROVISOIRE =
  "Valider l'entreposage provisoire";
export const VALIDER_RECEPTION = "Valider la réception";
export const VALIDER_ACCEPTATION_ENTREPOSAGE_PROVISOIRE =
  "Valider l'acceptation de l'entreposage provisoire";
export const SIGNATURE_ACCEPTATION_CONTENANT = "Gérer les contenants";
export const AJOUTER_ANNEXE_1 = "Ajouter une annexe 1";
// PAOH valider dépôt
export const FIN_DE_MISSION = "Fin de mission";

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
export const SIGNE_PAR_TRANSPORTEUR_N = (n: number) =>
  `signé par le transporteur n°${n}`;
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
export const EN_ATTENTE_TRAITEMENT = "En attente de traitement";

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
export const blankstate_default_title = "Il n'y a aucun bordereau";
export const blankstate_default_desc =
  "Si vous le souhaitez, vous pouvez créer un bordereau depuis le menu de création ci-dessus";

// load more
export const load_more_bsds = "Charger plus de bordereaux";

// filters
export const filter_show_btn = "Chercher par";
export const filter_reset_btn = "Annuler les filtres";
export const filter_type_select_placeholder = "Sélectionner un type de filtre";
export const filter_type_select_label = "Type de filtre";
export const filter_bsd_type = "Type de bordereau";
export const filter_waste_code = "N° de déchet / nom usuel";
export const filter_bsd_number = "N° libre / BSD / contenant";
export const filter_immat_number = "Numéro d'immatriculation";
export const filter_chantier_name = "Nom de chantier";
export const filter_chantier_adress = "Adresse du chantier";
export const filter_free_text = "Champs libres";
export const filter_worker_operation_code = "Code d'opération";
export const filter_siret_productor_address = "Adresse du producteur";
export const filter_transporter_sign_date = "Date d'enlèvement";
export const filter_reception_sign_date = "Date de réception";
export const filter_acceptation_sign_date = "Date d'acceptation";
export const filter_operation_sign_date = "Date de traitement / d'opération";
export const filter_tva_intra = "Numéro de TVA intracommunautaire";
export const filter_next_destination_siret = "SIRET du destinataire ultérieur";
export const filter_given_name = "Raison sociale / SIRET";
export const filter_cap = "Numéro de CAP";
export const filter_seal_numbers = "Numéro du scellé (BSDA)";
export const filter_fiche_intervention_numbers =
  "Numéro de fiche d'intervention (BSFF)";
export const filter_worker_sign_date =
  "Date de signature par l'entreprise de travaux (BSDA)";
export const filter_emitter_sign_date =
  "Date de signature par le producteur / émetteur / opérateur";

export const bsd_type_option_bsdd = "Déchets Dangereux";
export const bsd_type_option_bsvhu = "Véhicules Hors d'Usage";
export const bsd_type_option_bsff = "Déchets de Fluides Frigorigènes";
export const bsd_type_option_bsda = "Déchets d'Amiante";
export const bsd_type_option_bsdasri =
  "Déchets d'Activités de Soins à Risques Infectieux";
export const bsd_type_option_bspaoh = "Pièces Anatomiques d'Origine Humaine";
export const bsd_sub_type_option_initial = "Initial";
export const bsd_sub_type_option_tournee = "Tournée dédiée";
export const bsd_sub_type_option_appendix1 = "Annexe 1";
export const bsd_sub_type_option_appendix2 = "Annexe 2";
export const bsd_sub_type_option_temp_stored = "Entreposage provisoire";
export const bsd_sub_type_option_collection_2710 = "Collecte en déchetterie";
export const bsd_sub_type_option_gathering = "Groupement";
export const bsd_sub_type_option_groupement = "Regroupement";
export const bsd_sub_type_option_reshipment = "Réexpédition";
export const bsd_sub_type_option_reconditionnement = "Reconditionnement";
export const bsd_sub_type_option_synthesis = "Synthèse";
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
export const dropdown_create_bsff = "Fluide Frigorigène";
export const dropdown_create_bspaoh = "PAOH";

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
export const bpaohPublishDraft = `Cette action aura pour effet de démarrer le cycle de vie du
            bordereau en le faisant apparaître dans l'onglet
            <strong>“Pour action”</strong> du tableau de bord de l'émetteur. Le
            bordereau pourra toujours être modifié ou supprimé tant qu'aucune
            signature n'a été apposée.`;
// tabs
export const ALL_BSDS = "Tous les bordereaux";
export const ALL_REVIEWS = "Toutes les révisions";
export const DRAFTS = "Brouillons";
export const ACTS = "Pour action";
export const FOLLOWS = "Suivis";
export const ARCHIVES = "Archives";
export const REVIEWS = "Révisions";
export const TRANSPORT = "Transport";
export const TO_COLLECT = "À collecter";
export const COLLECTED = "Collectés";
export const REGISTER = "Registre";
export const TO_REVIEW = "En cours";
export const REVIEWED = "Révisés";
export const RETURN = "Retours";

// Reviews
export const GERER_REVISION = "Gérer la révision";
export const CONSULTER_REVISION = "Consulter la révision";
export const SUPRIMER_REVISION = "Annuler la révision";

// Transport
export const EMPORT_DIRECT_LABEL = "Signer directement";
export const VALIDER_SYNTHESE_LABEL = "Valider la synthèse";
export const ROAD_CONTROL = "Contrôle routier";

export const NON_RENSEIGNE = "Non renseigné";
export const QUANTITY_NON_RENSEIGNE = "Non renseignée";
export const BSD_DETAILS_QTY_TOOLTIP =
  "Les valeurs quantité refusée et traitée font suite à une mise à jour permettant à l'installation de destination d'un bordereau de les compléter. Si la valeur affichée est 'Non renseignée', cela signifie que le traitement est antérieur à la mise à disposition de cette fonctionnalité et que ces champs n'ont pas été complétés ultérieurement, par la révision par exemple. Pour plus d'informations sur ces nouveaux champs, consultez la FAQ.";

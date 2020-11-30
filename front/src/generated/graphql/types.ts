export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: any }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /**
   * The `DateTime` scalar expects a date-formatted string matching one of the following formats:
   * - "yyyy-MM-dd" (eg. 2020-11-23)
   * - "yyyy-MM-ddTHH:mm:ss" (eg. 2020-11-23T13:34:55)
   * - "yyyy-MM-ddTHH:mm:ssX" (eg. 2020-11-23T13:34:55Z)
   * - "yyyy-MM-dd'T'HH:mm:ss.SSS" (eg. 2020-11-23T13:34:55.987)
   * - "yyyy-MM-dd'T'HH:mm:ss.SSSX" (eg. 2020-11-23T13:34:55.987Z)
   */
  DateTime: string;
  /** Chaîne de caractère au format URL, débutant par un protocole http(s). */
  URL: string;
  JSON: any;
};

/** Payload de création d'une annexe 2 */
export type AppendixFormInput = {
  /** Identifiant unique du bordereau */
  id: Maybe<Scalars['ID']>;
  /**
   * N° de bordereau
   * 
   * Déprécié : L'id du bordereau doit être utilisé comme identifiant (paramètre id).
   * Le readableId permet de le récupérer via la query form.
   */
  readableId: Maybe<Scalars['ID']>;
};

/** Cet objet est renvoyé par la mutation login qui est dépréciée */
export type AuthPayload = {
  __typename?: 'AuthPayload';
  /**
   * Bearer token à durée illimité permettant de s'authentifier
   * à l'API Trackdéchets. Pour ce faire, il doit être passé dans le
   * header d'autorisation `Authorization: Bearer ******`
   */
  token: Scalars['String'];
  /** Utilisateur lié au token */
  user: User;
};

/**
 * Information sur établissement accessible dans la liste des favoris
 * La liste des favoris est constituée à partir de l'historique des
 * BSD édités
 */
export type CompanyFavorite = {
  __typename?: 'CompanyFavorite';
  /** Nom de l'établissement */
  name: Maybe<Scalars['String']>;
  /** SIRET de l'établissement */
  siret: Maybe<Scalars['String']>;
  /** Adresse de l'établissement */
  address: Maybe<Scalars['String']>;
  /** Nom du contact */
  contact: Maybe<Scalars['String']>;
  /** Numéro de téléphone */
  phone: Maybe<Scalars['String']>;
  /** Email de contact */
  mail: Maybe<Scalars['String']>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt: Maybe<TransporterReceipt>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt: Maybe<TraderReceipt>;
};

/** Payload d'un établissement */
export type CompanyInput = {
  /** SIRET de l'établissement */
  siret: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name: Maybe<Scalars['String']>;
  /** Adresse de l'établissement */
  address: Maybe<Scalars['String']>;
  /** Nom du contact dans l'établissement */
  contact: Maybe<Scalars['String']>;
  /** Email du contact dans l'établissement */
  mail: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone: Maybe<Scalars['String']>;
};

/** Information sur utilisateur au sein d'un établissement */
export type CompanyMember = {
  __typename?: 'CompanyMember';
  /** Identifiant opaque */
  id: Scalars['ID'];
  /** Email */
  email: Scalars['String'];
  /** Nom de l'utilisateur */
  name: Maybe<Scalars['String']>;
  /** Rôle de l'utilisateur dans l'établissement (admin ou membre) */
  role: Maybe<UserRole>;
  /** Si oui ou non l'email de l'utilisateur a été confirmé */
  isActive: Maybe<Scalars['Boolean']>;
  /** Si oui ou non une une invitation à joindre l'établissement est en attente */
  isPendingInvitation: Maybe<Scalars['Boolean']>;
  /** Si oui ou non cet utilisateur correspond à l'utilisateur authentifié */
  isMe: Maybe<Scalars['Boolean']>;
};

/** Information sur un établissement accessible par un utilisateur membre */
export type CompanyPrivate = {
  __typename?: 'CompanyPrivate';
  /** Identifiant opaque */
  id: Scalars['ID'];
  /** Profil de l'établissement */
  companyTypes: Array<CompanyType>;
  /** Identifiant GEREP */
  gerepId: Maybe<Scalars['String']>;
  /** Code de sécurité permettant de signer les BSD */
  securityCode: Scalars['Int'];
  /** Email de contact (visible sur la fiche entreprise) */
  contactEmail: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact (visible sur la fiche entreprise) */
  contactPhone: Maybe<Scalars['String']>;
  /** Site web (visible sur la fiche entreprise) */
  website: Maybe<Scalars['String']>;
  /** Liste des utilisateurs appartenant à cet établissement */
  users: Maybe<Array<CompanyMember>>;
  /** Rôle de l'utilisateur authentifié cau sein de cet établissement */
  userRole: Maybe<UserRole>;
  /**
   * Nom d'usage de l'entreprise qui permet de différencier
   * différents établissements ayant le même nom
   */
  givenName: Maybe<Scalars['String']>;
  /** SIRET de l'établissement */
  siret: Scalars['String'];
  /** Adresse de l'établissement */
  address: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name: Maybe<Scalars['String']>;
  /** Code NAF de l'établissement */
  naf: Maybe<Scalars['String']>;
  /** Libellé NAF de l'établissement */
  libelleNaf: Maybe<Scalars['String']>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement (le cas échéant)
   */
  installation: Maybe<Installation>;
  /** Récépissé transporteur (le cas échéant, pour les profils transporteur) */
  transporterReceipt: Maybe<TransporterReceipt>;
  /** Récépissé négociant (le cas échéant, pour les profils transporteur) */
  traderReceipt: Maybe<TraderReceipt>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements: Array<Scalars['URL']>;
};

/** Information sur un établissement accessible publiquement */
export type CompanyPublic = {
  __typename?: 'CompanyPublic';
  /** Email de contact */
  contactEmail: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact */
  contactPhone: Maybe<Scalars['String']>;
  /** Site web */
  website: Maybe<Scalars['String']>;
  /** SIRET de l'établissement */
  siret: Maybe<Scalars['String']>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif: Maybe<Scalars['String']>;
  /** Adresse de l'établissement */
  address: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name: Maybe<Scalars['String']>;
  /** Code NAF */
  naf: Maybe<Scalars['String']>;
  /** Libellé NAF */
  libelleNaf: Maybe<Scalars['String']>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement
   */
  installation: Maybe<Installation>;
  /** Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets */
  isRegistered: Maybe<Scalars['Boolean']>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt: Maybe<TransporterReceipt>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt: Maybe<TraderReceipt>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements: Array<Scalars['URL']>;
};

/** Information sur un établissement accessible publiquement en recherche */
export type CompanySearchResult = {
  __typename?: 'CompanySearchResult';
  /** SIRET de l'établissement */
  siret: Maybe<Scalars['String']>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif: Maybe<Scalars['String']>;
  /** Adresse de l'établissement */
  address: Maybe<Scalars['String']>;
  /** Code commune de l'établissement */
  codeCommune: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name: Maybe<Scalars['String']>;
  /** Profil de l'établissement */
  companyTypes: Maybe<Array<Maybe<CompanyType>>>;
  /** Code NAF */
  naf: Maybe<Scalars['String']>;
  /** Libellé NAF */
  libelleNaf: Maybe<Scalars['String']>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement
   */
  installation: Maybe<Installation>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt: Maybe<TransporterReceipt>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt: Maybe<TraderReceipt>;
};

/** Statistiques d'un établissement */
export type CompanyStat = {
  __typename?: 'CompanyStat';
  /** Établissement */
  company: Maybe<FormCompany>;
  /** Liste des statistiques */
  stats: Array<Stat>;
};

/** Profil entreprise */
export enum CompanyType {
  /** Producteur de déchet */
  Producer = 'PRODUCER',
  /** Installation de Transit, regroupement ou tri de déchets */
  Collector = 'COLLECTOR',
  /** Installation de traitement */
  Wasteprocessor = 'WASTEPROCESSOR',
  /** Transporteur */
  Transporter = 'TRANSPORTER',
  /** Installation d'entreposage, dépollution, démontage, découpage de VHU */
  WasteVehicles = 'WASTE_VEHICLES',
  /** Installation de collecte de déchets apportés par le producteur initial */
  WasteCenter = 'WASTE_CENTER',
  /** Négociant */
  Trader = 'TRADER',
  /** Éco-organisme */
  EcoOrganisme = 'ECO_ORGANISME'
}

/** Consistance du déchet */
export enum Consistence {
  /** Solide */
  Solid = 'SOLID',
  /** Liquide */
  Liquid = 'LIQUID',
  /** Gazeux */
  Gaseous = 'GASEOUS',
  /** Pâteux */
  Doughy = 'DOUGHY'
}

/** Payload de création d'un bordereau */
export type CreateFormInput = {
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId: Maybe<Scalars['String']>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter: Maybe<EmitterInput>;
  /** Établissement qui reçoit le déchet (case 2) */
  recipient: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter: Maybe<TransporterInput>;
  /** Détails du déchet (case 3) */
  wasteDetails: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader: Maybe<TraderInput>;
  /** Annexe 2 */
  appendix2Forms: Maybe<Array<Maybe<AppendixFormInput>>>;
  ecoOrganisme: Maybe<EcoOrganismeInput>;
  temporaryStorageDetail: Maybe<TemporaryStorageDetailInput>;
};

/** Payload de création d'un récépissé négociant */
export type CreateTraderReceiptInput = {
  /** Numéro de récépissé négociant */
  receiptNumber: Scalars['String'];
  /** Limite de validatié du récépissé */
  validityLimit: Scalars['DateTime'];
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
};

/** Payload de création d'un récépissé transporteur */
export type CreateTransporterReceiptInput = {
  /** Numéro de récépissé transporteur */
  receiptNumber: Scalars['String'];
  /** Limite de validatié du récépissé */
  validityLimit: Scalars['DateTime'];
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
};


/** Représente une ligne dans une déclaration GEREP */
export type Declaration = {
  __typename?: 'Declaration';
  /** Année de la déclaration */
  annee: Maybe<Scalars['String']>;
  /** Code du déchet */
  codeDechet: Maybe<Scalars['String']>;
  /** Description du déchet */
  libDechet: Maybe<Scalars['String']>;
  /** Type de déclaration GEREP: producteur ou traiteur */
  gerepType: Maybe<GerepType>;
};

/** Payload de suppression d'un récépissé négociant */
export type DeleteTraderReceiptInput = {
  /** The id of the trader receipt to delete */
  id: Scalars['ID'];
};

/** Payload de suppression d'un récépissé transporteur */
export type DeleteTransporterReceiptInput = {
  /** The id of the transporter receipt to delete */
  id: Scalars['ID'];
};

export type Destination = {
  __typename?: 'Destination';
  /** N° de CAP (le cas échéant) */
  cap: Maybe<Scalars['String']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation: Maybe<Scalars['String']>;
  /** Établissement de destination */
  company: Maybe<FormCompany>;
  /** Indique si l'information a été saisie par l'émetteur du bordereau ou l'installation d'entreposage */
  isFilledByEmitter: Maybe<Scalars['Boolean']>;
};

export type DestinationInput = {
  /** Installation de destination prévue */
  company: Maybe<CompanyInput>;
  /** N° de CAP prévu (le cas échéant) */
  cap: Maybe<Scalars['String']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation: Maybe<Scalars['String']>;
};

/**
 * Eco-organisme
 * Les éco-organismes n'apparaissent pas en case 1 du bordereau mais sont quand même responsables du déchet.
 * C'est l'entreprise de collecte de déchet qui apparait en case 1.
 * Pour pouvoir saisir un éco-organisme, le détenteur du déchet doit être défini comme 'Autre détenteur'.
 * Seul un éco-organisme enregistré dans Trackdéchet peut être associé.
 */
export type EcoOrganisme = {
  __typename?: 'EcoOrganisme';
  id: Scalars['ID'];
  /** Nom de l'éco-organisme */
  name: Scalars['String'];
  /** Siret de l'éco-organisme */
  siret: Scalars['String'];
  /** Adresse de l'éco-organisme */
  address: Scalars['String'];
};

/** Payload de liason d'un BSD à un eco-organisme */
export type EcoOrganismeInput = {
  name: Scalars['String'];
  siret: Scalars['String'];
};

/** Émetteur du BSD (case 1) */
export type Emitter = {
  __typename?: 'Emitter';
  /** Type d'émetteur */
  type: Maybe<EmitterType>;
  /** Adresse du chantier */
  workSite: Maybe<WorkSite>;
  /**
   * DEPRECATED - Ancienne adresse chantier
   * @deprecated Migration vers `workSite` obligatoire
   */
  pickupSite: Maybe<Scalars['String']>;
  /** Établissement émetteur */
  company: Maybe<FormCompany>;
};

/** Payload lié à un l'émetteur du BSD (case 1) */
export type EmitterInput = {
  /** Type d'émetteur */
  type: Maybe<EmitterType>;
  /** Adresse du chantier */
  workSite: Maybe<WorkSiteInput>;
  /** DEPRECATED - Ancienne adresse chantier */
  pickupSite: Maybe<Scalars['String']>;
  /** Établissement émetteur */
  company: Maybe<CompanyInput>;
};

/** Types d'émetteur de déchet (choix multiple de la case 1) */
export enum EmitterType {
  /** Producetur de déchet */
  Producer = 'PRODUCER',
  /** Autre détenteur */
  Other = 'OTHER',
  /** Collecteur de petites quantités de déchets relevant de la même rubrique */
  Appendix1 = 'APPENDIX1',
  /** Personne ayant transformé ou réalisé un traitement dont la provenance des déchets reste identifiable */
  Appendix2 = 'APPENDIX2'
}

/** Type d'établissement favoris */
export enum FavoriteType {
  Emitter = 'EMITTER',
  Transporter = 'TRANSPORTER',
  Recipient = 'RECIPIENT',
  Trader = 'TRADER',
  NextDestination = 'NEXT_DESTINATION',
  TemporaryStorageDetail = 'TEMPORARY_STORAGE_DETAIL',
  Destination = 'DESTINATION'
}

/**
 * URL de téléchargement accompagné d'un token
 * permettant de valider le téléchargement.
 */
export type FileDownload = {
  __typename?: 'FileDownload';
  /** Token ayant une durée de validité de 10s */
  token: Maybe<Scalars['String']>;
  /** Lien de téléchargement */
  downloadLink: Maybe<Scalars['String']>;
};

/**
 * Bordereau de suivi de déchets (BSD)
 * Version dématérialisée du [CERFA n°12571*01](https://www.service-public.fr/professionnels-entreprises/vosdroits/R14334)
 */
export type Form = {
  __typename?: 'Form';
  /** Identifiant unique du bordereau. */
  id: Scalars['ID'];
  /**
   * Identifiant lisible utilisé comme numéro sur le CERFA (case "Bordereau n°****").
   * Il est possible de l'utiliser pour récupérer l'identifiant unique du bordereau via la query form,
   * utilisé pour le reste des opérations.
   */
  readableId: Scalars['String'];
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId: Maybe<Scalars['String']>;
  /**
   * Permet de savoir si les données du BSD ont été importées depuis un
   * bordereau signé papier via la mutation `importPaperForm`
   */
  isImportedFromPaper: Scalars['Boolean'];
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter: Maybe<Emitter>;
  /** Établissement qui reçoit le déchet (case 2) */
  recipient: Maybe<Recipient>;
  /** Transporteur du déchet (case 8) */
  transporter: Maybe<Transporter>;
  /** Détails du déchet (case 3) */
  wasteDetails: Maybe<WasteDetails>;
  /** Négociant (case 7) */
  trader: Maybe<Trader>;
  /** Date de création du BSD */
  createdAt: Maybe<Scalars['DateTime']>;
  /** Date de la dernière modification du BSD */
  updatedAt: Maybe<Scalars['DateTime']>;
  /** Statut du BSD (brouillon, envoyé, reçu, traité, etc) */
  status: FormStatus;
  /** Si oui ou non le BSD a été signé par un transporteur */
  signedByTransporter: Maybe<Scalars['Boolean']>;
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt: Maybe<Scalars['DateTime']>;
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Maybe<Scalars['String']>;
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus: Maybe<Scalars['String']>;
  /** Raison du refus (case 10) */
  wasteRefusalReason: Maybe<Scalars['String']>;
  /** Nom de la personne en charge de la réception du déchet (case 10) */
  receivedBy: Maybe<Scalars['String']>;
  /** Date à laquelle le déchet a été reçu (case 10) */
  receivedAt: Maybe<Scalars['DateTime']>;
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt: Maybe<Scalars['DateTime']>;
  /** Quantité réelle présentée (case 10) */
  quantityReceived: Maybe<Scalars['Float']>;
  /**
   * Quantité actuellement connue en tonnes.
   * Elle est calculée en fonction des autres champs pour renvoyer la dernière quantité connue.
   * Elle renvoi ainsi soit la quantité envoyée estimée, soit la quantitée recue
   * sur le site d'entreposage, soit la quantitée réelle recue.
   */
  actualQuantity: Maybe<Scalars['Float']>;
  /** Traitement réalisé (code D/R) */
  processingOperationDone: Maybe<Scalars['String']>;
  /** Description de l'opération d’élimination / valorisation (case 11) */
  processingOperationDescription: Maybe<Scalars['String']>;
  /** Personne en charge du traitement */
  processedBy: Maybe<Scalars['String']>;
  /** Date à laquelle le déchet a été traité */
  processedAt: Maybe<Scalars['DateTime']>;
  /** Si oui ou non il y a eu perte de traçabalité */
  noTraceability: Maybe<Scalars['Boolean']>;
  /** Destination ultérieure prévue (case 12) */
  nextDestination: Maybe<NextDestination>;
  /** Annexe 2 */
  appendix2Forms: Maybe<Array<Form>>;
  ecoOrganisme: Maybe<FormEcoOrganisme>;
  /** BSD suite - détail des champs de la partie entreposage provisoire ou reconditionnement */
  temporaryStorageDetail: Maybe<TemporaryStorageDetail>;
  /** Résumé des valeurs clés du bordereau à l'instant T */
  stateSummary: Maybe<StateSummary>;
  transportSegments: Maybe<Array<TransportSegment>>;
  currentTransporterSiret: Maybe<Scalars['String']>;
  nextTransporterSiret: Maybe<Scalars['String']>;
};

/** Information sur un établissement dans un BSD */
export type FormCompany = {
  __typename?: 'FormCompany';
  /** Nom de l'établissement */
  name: Maybe<Scalars['String']>;
  /** SIRET de l'établissement */
  siret: Maybe<Scalars['String']>;
  /** Adresse de l'établissement */
  address: Maybe<Scalars['String']>;
  /**
   * Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
   * https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2
   * 
   * Seul la destination ultérieure case 12 (`form.nextDestination.company`) peut être à l'étranger.
   */
  country: Maybe<Scalars['String']>;
  /** Nom du contact dans l'établissement */
  contact: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone: Maybe<Scalars['String']>;
  /** Email du contact dans l'établissement */
  mail: Maybe<Scalars['String']>;
};

/** Information sur l'éco-organisme responsable du BSD */
export type FormEcoOrganisme = {
  __typename?: 'FormEcoOrganisme';
  name: Scalars['String'];
  siret: Scalars['String'];
};

/** Payload de création d'un BSD */
export type FormInput = {
  /** Identifiant opaque */
  id: Maybe<Scalars['ID']>;
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId: Maybe<Scalars['String']>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter: Maybe<EmitterInput>;
  /** Établissement qui reçoit le déchet (case 2) */
  recipient: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter: Maybe<TransporterInput>;
  /** Détails du déchet (case 3) */
  wasteDetails: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader: Maybe<TraderInput>;
  /** Annexe 2 */
  appendix2Forms: Maybe<Array<Maybe<AppendixFormInput>>>;
  ecoOrganisme: Maybe<EcoOrganismeInput>;
  temporaryStorageDetail: Maybe<TemporaryStorageDetailInput>;
};

export enum FormRole {
  /** Les BSD's dont je suis transporteur */
  Transporter = 'TRANSPORTER',
  /** Les BSD's dont je suis la destination de traitement */
  Recipient = 'RECIPIENT',
  /** Les BSD's dont je suis l'émetteur */
  Emitter = 'EMITTER',
  /** Les BSD's dont je suis le négociant */
  Trader = 'TRADER',
  /** Les BSD's dont je suis éco-organisme */
  EcoOrganisme = 'ECO_ORGANISME'
}

/** Informations du cycle de vie des bordereaux */
export type FormsLifeCycleData = {
  __typename?: 'formsLifeCycleData';
  /** Liste des changements de statuts */
  statusLogs: Array<StatusLog>;
  /** pagination, indique si d'autres pages existent après */
  hasNextPage: Maybe<Scalars['Boolean']>;
  /** pagination, indique si d'autres pages existent avant */
  hasPreviousPage: Maybe<Scalars['Boolean']>;
  /** Premier id de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle */
  startCursor: Maybe<Scalars['ID']>;
  /** Dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle */
  endCursor: Maybe<Scalars['ID']>;
  /** Nombre de changements de statuts renvoyés */
  count: Maybe<Scalars['Int']>;
};

/** Format de l'export du registre */
export enum FormsRegisterExportFormat {
  /** Fichier csv */
  Csv = 'CSV',
  /** Fichier Excel */
  Xlsx = 'XLSX'
}

/**
 * Modèle de registre réglementaire tels que décrits dans l'arrêté du 29 février 2012 fixant
 * le contenu des registres mnetionnées aux articles R. 541-43 et R. 541-46 du code de l'environnement
 * https://www.legifrance.gouv.fr/affichTexte.do?cidTexte=JORFTEXT000025454959&categorieLien=id
 */
export enum FormsRegisterExportType {
  /** Registre exhaustif, déchets entrants et sortants */
  All = 'ALL',
  /**
   * Registre producteur, déchets sortants
   * Art 1: Les exploitants des établissements produisant ou expédiant des déchets tiennent à jour
   * un registre chronologique où sont consignés tous les déchets sortants.
   */
  Outgoing = 'OUTGOING',
  /**
   * Registre traiteur, TTR
   * Art 2: Les exploitants des installations de transit, de regroupement ou de traitement de déchets,
   * notamment de tri, établissent et tiennent à jour un registre chronologique où sont consignés
   * tous les déchets entrants.
   */
  Incoming = 'INCOMING',
  /**
   * Registre transporteur
   * Art 3: Les transporteurs et les collecteurs de déchets tiennent à jour un registre chronologique
   * des déchets transportés ou collectés.
   */
  Transported = 'TRANSPORTED',
  /**
   * Registre négociants
   * Art 4: Les négociants tiennent à jour un registre chronologique des déchets détenus.
   */
  Traded = 'TRADED'
}

/** Différents statuts d'un BSD au cours de son cycle de vie */
export enum FormStatus {
  /**
   * BSD à l'état de brouillon
   * Des champs obligatoires peuvent manquer
   */
  Draft = 'DRAFT',
  /**
   * BSD finalisé
   * Les champs sont validés pour détecter des valeurs manquantes ou erronnées
   */
  Sealed = 'SEALED',
  /** BSD envoyé vers l'établissement de destination */
  Sent = 'SENT',
  /** BSD reçu par l'établissement de destination */
  Received = 'RECEIVED',
  /** BSD dont les déchets ont été traités */
  Processed = 'PROCESSED',
  /** BSD en attente de regroupement */
  AwaitingGroup = 'AWAITING_GROUP',
  /** Regroupement effectué */
  Grouped = 'GROUPED',
  /** Perte de traçabalité */
  NoTraceability = 'NO_TRACEABILITY',
  /** Déchet refusé */
  Refused = 'REFUSED',
  /** Déchet arrivé sur le site d'entreposage ou reconditionnement */
  TempStored = 'TEMP_STORED',
  /** Déchet avec les cadres 14-19 complétées (si besoin), prêt à partir du site d'entreposage ou reconditionnement */
  Resealed = 'RESEALED',
  /** Déchet envoyé du site d'entreposage ou reconditionnement vers sa destination de traitement */
  Resent = 'RESENT'
}

/**
 * DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`
 * 
 * Mise à jour d'un BSD
 */
export type FormSubscription = {
  __typename?: 'FormSubscription';
  /** Type de mutation */
  mutation: Maybe<Scalars['String']>;
  /** BSD concerné */
  node: Maybe<Form>;
  /** Liste des champs mis à jour */
  updatedFields: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Ancienne valeurs */
  previousValues: Maybe<Form>;
};

/** Type d'une déclaration GEREP */
export enum GerepType {
  Producteur = 'Producteur',
  Traiteur = 'Traiteur'
}

/** Payload d'import d'un BSD papier */
export type ImportPaperFormInput = {
  /**
   * Numéro de BSD Trackdéchets (uniquement dans le cas d'une mise à jour d'un
   * bordereau émis initialement dans Trackdéchets)
   */
  id: Maybe<Scalars['ID']>;
  /**
   * Identifiant libre qui peut éventuellement servir à faire le lien dans Trackdéchets
   * entre le BSD papier et le BSD numérique dans le cas de l'import d'un BSD n'ayant
   * pas été émis initialement dans Trackdéchets.
   */
  customId: Maybe<Scalars['String']>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter: Maybe<EmitterInput>;
  /** Établissement qui reçoit le déchet (case 2) */
  recipient: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter: Maybe<TransporterInput>;
  /** Détails du déchet (case 3) */
  wasteDetails: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader: Maybe<TraderInput>;
  /** Éco-organisme (apparait en case 1) */
  ecoOrganisme: Maybe<EcoOrganismeInput>;
  /** Informations liées aux signatures transporteur et émetteur (case 8 et 9) */
  signingInfo: SignatureFormInput;
  /** Informations liées à la réception du déchet (case 10) */
  receivedInfo: ReceivedFormInput;
  /** Informations liées au traitement du déchet (case 11) */
  processedInfo: ProcessedFormInput;
};

/** Installation pour la protection de l'environnement (ICPE) */
export type Installation = {
  __typename?: 'Installation';
  /** Identifiant S3IC */
  codeS3ic: Maybe<Scalars['String']>;
  /** URL de la fiche ICPE sur Géorisques */
  urlFiche: Maybe<Scalars['String']>;
  /** Liste des rubriques associées */
  rubriques: Maybe<Array<Rubrique>>;
  /** Liste des déclarations GEREP */
  declarations: Maybe<Array<Declaration>>;
};

/**
 * Payload d'un établissement pouvant se situer en France
 * ou à l'étranger
 */
export type InternationalCompanyInput = {
  /** SIRET de l'établissement, optionnel dans le cas d'un établissement à l'étranger */
  siret: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name: Maybe<Scalars['String']>;
  /** Adresse de l'établissement */
  address: Maybe<Scalars['String']>;
  /**
   * Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
   * https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2
   * 
   * En l'absence de code, l'entreprise est considérée comme résidant en France.
   */
  country: Maybe<Scalars['String']>;
  /** Nom du contact dans l'établissement */
  contact: Maybe<Scalars['String']>;
  /** Email du contact dans l'établissement */
  mail: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone: Maybe<Scalars['String']>;
};

/**
 * Invitation à rejoindre une entreprise
 * lorsque l'utilisateur invité n'est pas encore inscrit
 * sur Trackdéchets
 */
export type Invitation = {
  __typename?: 'Invitation';
  /** Identifiant unique */
  id: Scalars['ID'];
  /** Email de l'utilisateur invité */
  email: Scalars['String'];
  /** Siret de l'entreprise à laquelle l'utilisateur est invité */
  companySiret: Scalars['String'];
  /** Hash unique inclus dans le lien d'invitation envoyé par email */
  hash: Scalars['String'];
  /** Rôle de l'utilisateur au sein de l'entreprise */
  role: UserRole;
  /** Date when the invitation was accepted and the user joined */
  acceptedAt: Maybe<Scalars['DateTime']>;
};


/**
 * Demande de rattachement à un établissement effectué par
 * un utilisateur.
 */
export type MembershipRequest = {
  __typename?: 'MembershipRequest';
  id: Scalars['ID'];
  /** Email de l'utilisateur faisant la demande */
  email: Scalars['String'];
  /** SIRET de l'établissement */
  siret: Scalars['String'];
  /** Nom de l'établissement */
  name: Scalars['String'];
  /** Statut de la demande de rattachement */
  status: MembershipRequestStatus;
  /**
   * Liste des adresses email correspondant aux comptes administrateurs à qui la demande
   * de rattachement a été envoyée. Les adresses emails sont partiellement masquées de la
   * façon suivante j********w@trackdechets.fr
   */
  sentTo: Array<Scalars['String']>;
};

/**
 * Différents statuts possibles pour une demande de rattachement
 * à un établissement
 */
export enum MembershipRequestStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Refused = 'REFUSED'
}

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * USAGE INTERNE
   * Accepte une demande de rattachement à un établissement
   * en spécifiant le rôle accordé au nouvel utilisateur
   */
  acceptMembershipRequest: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Modifie le mot de passe d'un utilisateur
   */
  changePassword: User;
  /**
   * USAGE INTERNE
   * Rattache un établissement à l'utilisateur authentifié
   */
  createCompany: CompanyPrivate;
  /** Crée un nouveau bordereau */
  createForm: Form;
  /**
   * USAGE INTERNE
   * Crée un récépissé transporteur
   */
  createTraderReceipt: Maybe<TraderReceipt>;
  /**
   * USAGE INTERNE
   * Crée un récépissé transporteur
   */
  createTransporterReceipt: Maybe<TransporterReceipt>;
  /**
   * USAGE INTERNE
   * Récupère une URL signé pour l'upload d'un fichier
   */
  createUploadLink: UploadLink;
  /** Supprime un BSD */
  deleteForm: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Supprime une invitation à un établissement
   */
  deleteInvitation: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Supprime un récépissé négociant
   */
  deleteTraderReceipt: Maybe<TransporterReceipt>;
  /**
   * USAGE INTERNE
   * Supprime un récépissé transporteur
   */
  deleteTransporterReceipt: Maybe<TransporterReceipt>;
  /** Duplique un BSD */
  duplicateForm: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Met à jour les informations de l'utilisateur
   */
  editProfile: User;
  /** Édite un segment existant */
  editSegment: Maybe<TransportSegment>;
  /**
   * Permet d'importer les informations d'un BSD papier dans Trackdéchet après la réalisation de l'opération
   * de traitement. Le BSD signé papier original doit être conservé à l'installation de destination qui doit
   * être en mesure de retrouver le bordereau papier correspondant à un bordereau numérique. Le champ `customId`
   * de l'input peut-être utilisé pour faire le lien.
   */
  importPaperForm: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Invite un nouvel utilisateur à un établissement
   */
  inviteUserToCompany: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Active le compte d'un utilisateur invité
   */
  joinWithInvite: User;
  /**
   * DEPRECATED - La récupération de token pour le compte de tiers
   * doit s'effectuer avec le protocole OAuth2
   * 
   * Récupére un token à partir de l'email et du mot de passe
   * d'un utilisateur.
   */
  login: AuthPayload;
  /** Valide le traitement d'un BSD */
  markAsProcessed: Maybe<Form>;
  /** Valide la réception d'un BSD */
  markAsReceived: Maybe<Form>;
  /** Valide la complétion des cadres 14 à 19 lors d'un entreposage provisoire ou reconditionnement */
  markAsResealed: Maybe<Form>;
  /**
   * Valide l'envoi du BSD après un entreposage provisoire ou reconditionnement
   * @deprecated Utiliser la mutation signedByTransporter permettant d'apposer les signatures du collecteur-transporteur (case 18) et de l'exploitant du site d'entreposage provisoire ou de reconditionnement (case 19)
   */
  markAsResent: Maybe<Form>;
  /**
   * Scelle un BSD
   * Les champs suivants sont obligatoires pour pouvoir sceller un bordereau et
   * doivent avoir été renseignés au préalable
   * 
   * ```
   * emitter: {
   *   type
   *   company: {
   *     siret
   *     name
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * recipient: {
   *   processingOperation
   *   company: {
   *     siret
   *     name
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * transporter: {
   *   company: {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   *   receipt
   *   department
   *   validityLimit
   *   numberPlate
   * }
   * wasteDetails: {
   *   code
   *   // onuCode est optionnel pour les déchets non-dangereux
   *   onuCode
   *   name
   *   packagings
   *   numberOfPackages
   *   quantity
   *   quantityType
   *   consistence
   * }
   * ```
   */
  markAsSealed: Maybe<Form>;
  /**
   * Valide l'envoi d'un BSD
   * @deprecated Utiliser la mutation signedByTransporter permettant d'apposer les signatures collecteur-transporteur (case 8) et émetteur (case 9)
   */
  markAsSent: Maybe<Form>;
  /** Valide la réception d'un BSD d'un entreposage provisoire ou reconditionnement */
  markAsTempStored: Maybe<Form>;
  /** Marque un segment de transport comme prêt à être emporté */
  markSegmentAsReadyToTakeOver: Maybe<TransportSegment>;
  /** Prépare un nouveau segment de transport multimodal */
  prepareSegment: Maybe<TransportSegment>;
  /**
   * USAGE INTERNE
   * Refuse une demande de rattachement à un un établissement
   */
  refuseMembershipRequest: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Supprime les droits d'un utilisateurs sur un établissement
   */
  removeUserFromCompany: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Renouvelle le code de sécurité de l'établissement
   */
  renewSecurityCode: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Renvoie l'email d'invitation à un établissement
   */
  resendInvitation: Scalars['Boolean'];
  /**
   * USAGE INTERNE
   * Envoie un email pour la réinitialisation du mot de passe
   */
  resetPassword: Scalars['Boolean'];
  /**
   * DEPRECATED - Sauvegarde un BSD (création ou modification, si `FormInput` contient un ID)
   * @deprecated Utiliser createForm / updateForm selon le besoin
   */
  saveForm: Maybe<Form>;
  /**
   * Envoie une demande de rattachement de l'utilisateur courant
   * à rejoindre l'établissement dont le siret est précisé en paramètre.
   * Cette demande est communiquée à l'ensemble des administrateurs de
   * l'établissement qui ont le choix de l'accepter ou de la refuser.
   */
  sendMembershipRequest: Maybe<MembershipRequest>;
  /**
   * Permet de transférer le déchet à un transporteur lors de la collecte initiale (signatures en case 8 et 9)
   * ou après une étape d'entreposage provisoire ou de reconditionnement (signatures en case 18 et 19).
   * Cette mutation doit être appelée avec le token du collecteur-transporteur.
   * L'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement) est authentifié quant à lui
   * grâce à son code de sécurité disponible sur le tableau de bord Trackdéchets (Mon Compte > Établissements > Sécurité).
   * D'un point de vue pratique, cela implique qu'un responsable de l'établissement
   * émetteur (resp. d'entreposage provisoire ou de reconditionnement)
   * renseigne le code de sécurité sur le terminal du collecteur-transporteur.
   * Dans le cas où un éco-organisme figure sur le BSD, il est également possible
   * de signer avec son code plutôt que celui de l'émetteur.
   * Il faut alors fournir le code de l'éco-organisme en indiquant qu'il est
   * l'auteur de la signature (signingInfo.signatureAuthor doit valoir
   * ECO_ORGANISME).
   */
  signedByTransporter: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Permet de créer un nouvel utilisateur
   */
  signup: User;
  /** Marque un segment comme pris en charge par le nouveau transporteur */
  takeOverSegment: Maybe<TransportSegment>;
  /**
   * USAGE INTERNE
   * Édite les informations d'un établissement
   */
  updateCompany: CompanyPrivate;
  /** Met à jour un bordereau existant */
  updateForm: Form;
  /**
   * USAGE INTERNE
   * Édite les informations d'un récépissé négociant
   */
  updateTraderReceipt: Maybe<TraderReceipt>;
  /** Met à jour la plaque d'immatriculation ou le champ libre du transporteur */
  updateTransporterFields: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Édite les informations d'un récépissé transporteur
   */
  updateTransporterReceipt: Maybe<TransporterReceipt>;
};


export type MutationAcceptMembershipRequestArgs = {
  id: Scalars['ID'];
  role: UserRole;
};


export type MutationChangePasswordArgs = {
  oldPassword: Scalars['String'];
  newPassword: Scalars['String'];
};


export type MutationCreateCompanyArgs = {
  companyInput: PrivateCompanyInput;
};


export type MutationCreateFormArgs = {
  createFormInput: CreateFormInput;
};


export type MutationCreateTraderReceiptArgs = {
  input: CreateTraderReceiptInput;
};


export type MutationCreateTransporterReceiptArgs = {
  input: CreateTransporterReceiptInput;
};


export type MutationCreateUploadLinkArgs = {
  fileName: Scalars['String'];
  fileType: Scalars['String'];
};


export type MutationDeleteFormArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteInvitationArgs = {
  email: Scalars['String'];
  siret: Scalars['String'];
};


export type MutationDeleteTraderReceiptArgs = {
  input: DeleteTraderReceiptInput;
};


export type MutationDeleteTransporterReceiptArgs = {
  input: DeleteTransporterReceiptInput;
};


export type MutationDuplicateFormArgs = {
  id: Scalars['ID'];
};


export type MutationEditProfileArgs = {
  name: Maybe<Scalars['String']>;
  phone: Maybe<Scalars['String']>;
  email: Maybe<Scalars['String']>;
};


export type MutationEditSegmentArgs = {
  id: Scalars['ID'];
  siret: Scalars['String'];
  nextSegmentInfo: NextSegmentInfoInput;
};


export type MutationImportPaperFormArgs = {
  input: ImportPaperFormInput;
};


export type MutationInviteUserToCompanyArgs = {
  email: Scalars['String'];
  siret: Scalars['String'];
  role: UserRole;
};


export type MutationJoinWithInviteArgs = {
  inviteHash: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
};


export type MutationLoginArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationMarkAsProcessedArgs = {
  id: Scalars['ID'];
  processedInfo: ProcessedFormInput;
};


export type MutationMarkAsReceivedArgs = {
  id: Scalars['ID'];
  receivedInfo: ReceivedFormInput;
};


export type MutationMarkAsResealedArgs = {
  id: Scalars['ID'];
  resealedInfos: ResealedFormInput;
};


export type MutationMarkAsResentArgs = {
  id: Scalars['ID'];
  resentInfos: ResentFormInput;
};


export type MutationMarkAsSealedArgs = {
  id: Scalars['ID'];
};


export type MutationMarkAsSentArgs = {
  id: Scalars['ID'];
  sentInfo: SentFormInput;
};


export type MutationMarkAsTempStoredArgs = {
  id: Scalars['ID'];
  tempStoredInfos: TempStoredFormInput;
};


export type MutationMarkSegmentAsReadyToTakeOverArgs = {
  id: Scalars['ID'];
};


export type MutationPrepareSegmentArgs = {
  id: Scalars['ID'];
  siret: Scalars['String'];
  nextSegmentInfo: NextSegmentInfoInput;
};


export type MutationRefuseMembershipRequestArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveUserFromCompanyArgs = {
  userId: Scalars['ID'];
  siret: Scalars['String'];
};


export type MutationRenewSecurityCodeArgs = {
  siret: Scalars['String'];
};


export type MutationResendInvitationArgs = {
  email: Scalars['String'];
  siret: Scalars['String'];
};


export type MutationResetPasswordArgs = {
  email: Scalars['String'];
};


export type MutationSaveFormArgs = {
  formInput: FormInput;
};


export type MutationSendMembershipRequestArgs = {
  siret: Scalars['String'];
};


export type MutationSignedByTransporterArgs = {
  id: Scalars['ID'];
  signingInfo: TransporterSignatureFormInput;
};


export type MutationSignupArgs = {
  userInfos: SignupInput;
};


export type MutationTakeOverSegmentArgs = {
  id: Scalars['ID'];
  takeOverInfo: TakeOverInput;
};


export type MutationUpdateCompanyArgs = {
  siret: Scalars['String'];
  gerepId: Maybe<Scalars['String']>;
  contactEmail: Maybe<Scalars['String']>;
  contactPhone: Maybe<Scalars['String']>;
  website: Maybe<Scalars['String']>;
  companyTypes: Maybe<Array<Maybe<CompanyType>>>;
  givenName: Maybe<Scalars['String']>;
  transporterReceiptId: Maybe<Scalars['String']>;
  traderReceiptId: Maybe<Scalars['String']>;
  ecoOrganismeAgreements: Maybe<Array<Scalars['URL']>>;
};


export type MutationUpdateFormArgs = {
  updateFormInput: UpdateFormInput;
};


export type MutationUpdateTraderReceiptArgs = {
  input: UpdateTraderReceiptInput;
};


export type MutationUpdateTransporterFieldsArgs = {
  id: Scalars['ID'];
  transporterNumberPlate: Maybe<Scalars['String']>;
  transporterCustomInfo: Maybe<Scalars['String']>;
};


export type MutationUpdateTransporterReceiptArgs = {
  input: UpdateTransporterReceiptInput;
};

/** Destination ultérieure prévue (case 12) */
export type NextDestination = {
  __typename?: 'NextDestination';
  /** Traitement prévue (code D/R) */
  processingOperation: Maybe<Scalars['String']>;
  /** Établissement ultérieure */
  company: Maybe<FormCompany>;
};

export type NextDestinationInput = {
  /** Traitement prévue (code D/R) */
  processingOperation: Scalars['String'];
  /** Établissement de destination ultérieur */
  company: InternationalCompanyInput;
};

/** Payload lié à l'ajout de segment de transport multimodal (case 20 à 21) */
export type NextSegmentInfoInput = {
  transporter: Maybe<TransporterInput>;
  mode: TransportMode;
};

/** Informations sur le conditionnement */
export type PackagingInfo = {
  __typename?: 'PackagingInfo';
  /** Type de conditionnement */
  type: Packagings;
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other: Maybe<Scalars['String']>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars['Int'];
};

/** Payload lié à un élément de conditionnement */
export type PackagingInfoInput = {
  /** Type de conditionnement */
  type: Packagings;
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other: Maybe<Scalars['String']>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars['Int'];
};

/** Type de packaging du déchet */
export enum Packagings {
  /** Fut */
  Fut = 'FUT',
  /** GRV */
  Grv = 'GRV',
  /** Citerne */
  Citerne = 'CITERNE',
  /** Benne */
  Benne = 'BENNE',
  /** Autre */
  Autre = 'AUTRE'
}

/** Payload permettant le rattachement d'un établissement à un utilisateur */
export type PrivateCompanyInput = {
  /** SIRET de l'établissement */
  siret: Scalars['String'];
  /** Identifiant GEREP de l'établissement */
  gerepId: Maybe<Scalars['String']>;
  /** Profil de l'établissement */
  companyTypes: Array<CompanyType>;
  /** Code NAF */
  codeNaf: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  companyName: Maybe<Scalars['String']>;
  /**
   * Liste de documents permettant de démontrer l'appartenance
   * de l'utilisateur à l'établissement
   */
  documentKeys: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Récipissé transporteur (le cas échéant, pour les profils transporteur) */
  transporterReceiptId: Maybe<Scalars['String']>;
  /** Récipissé négociant (le cas échéant, pour les profils négociant) */
  traderReceiptId: Maybe<Scalars['String']>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements: Maybe<Array<Scalars['URL']>>;
};

/** Payload de traitement d'un BSD */
export type ProcessedFormInput = {
  /** Traitement réalisé (code D/R) */
  processingOperationDone: Scalars['String'];
  /**
   * Description de l'opération d’élimination / valorisation (case 11)
   * Elle se complète automatiquement lorsque non fournie
   */
  processingOperationDescription: Maybe<Scalars['String']>;
  /** Personne en charge du traitement */
  processedBy: Scalars['String'];
  /** Date à laquelle le déchet a été traité */
  processedAt: Scalars['DateTime'];
  /** Destination ultérieure prévue (case 12) */
  nextDestination: Maybe<NextDestinationInput>;
  /** Si oui ou non il y a eu perte de traçabalité */
  noTraceability: Maybe<Scalars['Boolean']>;
};

/** Type de quantité lors de l'émission */
export enum QuantityType {
  /** Quntité réelle */
  Real = 'REAL',
  /** Quantité estimée */
  Estimated = 'ESTIMATED'
}

export type Query = {
  __typename?: 'Query';
  /**
   * USAGE INTERNE > Mon Compte > Générer un token
   * Renvoie un token permettant de s'authentifier à l'API Trackdéchets
   */
  apiKey: Scalars['String'];
  /** Renvoie des BSD candidats à un regroupement dans une annexe 2 */
  appendixForms: Array<Form>;
  /**
   * Renvoie des informations publiques sur un établissement
   * extrait de la base SIRENE et de la base des installations
   * classées pour la protection de l'environnement (ICPE)
   */
  companyInfos: CompanyPublic;
  /** Renvoie la liste des éco-organismes */
  ecoOrganismes: Array<EcoOrganisme>;
  /**
   * Renvoie les établissements favoris de l'utilisateur. C'est à dire les
   * établissements qui font souvent partis des BSD édités
   */
  favorites: Array<CompanyFavorite>;
  /** Renvoie un BSD sélectionné par son ID (opaque ou lisible, l'un des deux doit être fourni) */
  form: Maybe<Form>;
  /**
   * Renvoie un token pour télécharger un pdf de BSD
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  formPdf: FileDownload;
  /**
   * Renvoie les BSDs de l'établissement sélectionné.
   * Si aucun SIRET n'est précisé et que l'utilisateur est membre d'une seule entreprise
   * alors les BSD de cette entreprise sont retournés.
   * Si l'utilisateur est membre de 2 entreprises ou plus, vous devez obligatoirement
   * préciser un SIRET
   * Si l'utilisateur n'est membre d'aucune entreprise, un tableau vide sera renvoyé
   * 
   * Vous pouvez filtrer:
   * - par rôle que joue votre entreprise sur le BSD via `role`
   * - par date de dernière modification via `updatedAfter`
   * - par date d'envoi via `sentAfter`
   * - par statut du BSD via `status`
   * - les BSD qui attendent une action (ou non) de votre part via `hasNextStep`
   * - par code déchet via `wasteCode`
   * - par SIRET d'une entreprise présente n'importe où sur le bordereau via `siretPresentOnForm`
   * 
   * Par défaut:
   * - tous les BSD accessibles sont retournés
   * - les BSD sont classés par date de création, de la plus récente à la plus vieille
   * - les résultats sont paginés par 50. Il est possible de modifier cette valeur
   * via `first` ou `last` en fonction du curseur utilisé
   * - pour afficher la suite des résultats, utiliser `cursorAfter` ou `cursorBefore`
   */
  forms: Array<Form>;
  /**
   * Renvoie les changements de statut des bordereaux de l'entreprise sélectionnée.
   * La liste est paginée par pages de 100 items, ordonnée par date décroissante (champ `loggedAt`)
   * Seuls les changements de statut disposant d'un champ `loggedAt` non nul sont retournés
   */
  formsLifeCycle: FormsLifeCycleData;
  /**
   * Renvoie un token pour télécharger un csv du regsitre
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  formsRegister: FileDownload;
  /**
   * USAGE INTERNE
   * Recherche une invitation à rejoindre une entreprise
   * par son hash
   */
  invitation: Maybe<Invitation>;
  /** Renvoie les informations sur l'utilisateur authentifié */
  me: User;
  /**
   * Récupère une demande de rattachement effectuée par l'utilisateur courant
   * à partir de l'identifiant de cette demande ou du SIRET de l'établissement
   * auquel l'utilisateur a demandé à être rattaché. L'un ou l'autre des
   * paramètres (id ou siret) doit être être passé mais pas les deux. Cette query
   * permet notamment de suivre l'état d'avancement de la demande de rattachement
   * (en attente, accepté, refusé)
   */
  membershipRequest: Maybe<MembershipRequest>;
  /**
   * Effectue une recherche floue sur la base SIRENE et enrichit
   * les résultats avec des informations provenant de Trackdéchets
   */
  searchCompanies: Array<CompanySearchResult>;
  /** Renvoie des statistiques sur le volume de déchets entrant et sortant */
  stats: Array<CompanyStat>;
};


export type QueryAppendixFormsArgs = {
  siret: Scalars['String'];
  wasteCode: Maybe<Scalars['String']>;
};


export type QueryCompanyInfosArgs = {
  siret: Scalars['String'];
};


export type QueryFavoritesArgs = {
  siret: Scalars['String'];
  type: FavoriteType;
};


export type QueryFormArgs = {
  id: Maybe<Scalars['ID']>;
  readableId: Maybe<Scalars['String']>;
};


export type QueryFormPdfArgs = {
  id: Maybe<Scalars['ID']>;
};


export type QueryFormsArgs = {
  siret: Maybe<Scalars['String']>;
  skip: Maybe<Scalars['Int']>;
  cursorAfter: Maybe<Scalars['ID']>;
  first: Maybe<Scalars['Int']>;
  cursorBefore: Maybe<Scalars['ID']>;
  last: Maybe<Scalars['Int']>;
  sentAfter: Maybe<Scalars['String']>;
  updatedAfter: Maybe<Scalars['String']>;
  status: Maybe<Array<FormStatus>>;
  roles: Maybe<Array<FormRole>>;
  hasNextStep: Maybe<Scalars['Boolean']>;
  siretPresentOnForm: Maybe<Scalars['String']>;
  wasteCode: Maybe<Scalars['String']>;
};


export type QueryFormsLifeCycleArgs = {
  siret: Maybe<Scalars['String']>;
  loggedBefore: Maybe<Scalars['String']>;
  loggedAfter: Maybe<Scalars['String']>;
  cursorAfter: Maybe<Scalars['String']>;
  cursorBefore: Maybe<Scalars['String']>;
  formId: Maybe<Scalars['ID']>;
};


export type QueryFormsRegisterArgs = {
  sirets: Array<Scalars['String']>;
  exportType: Maybe<FormsRegisterExportType>;
  startDate: Maybe<Scalars['DateTime']>;
  endDate: Maybe<Scalars['DateTime']>;
  wasteCode: Maybe<Scalars['String']>;
  exportFormat: Maybe<FormsRegisterExportFormat>;
};


export type QueryInvitationArgs = {
  hash: Scalars['String'];
};


export type QueryMembershipRequestArgs = {
  id: Maybe<Scalars['ID']>;
  siret: Maybe<Scalars['String']>;
};


export type QuerySearchCompaniesArgs = {
  clue: Scalars['String'];
  department: Maybe<Scalars['String']>;
};

/** Payload de réception d'un BSD */
export type ReceivedFormInput = {
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus: WasteAcceptationStatusInput;
  /** Raison du refus (case 10) */
  wasteRefusalReason: Maybe<Scalars['String']>;
  /** Nom de la personne en charge de la réception du déchet (case 10) */
  receivedBy: Scalars['String'];
  /** Date à laquelle le déchet a été reçu (case 10) */
  receivedAt: Scalars['DateTime'];
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt: Maybe<Scalars['DateTime']>;
  /** Quantité réelle présentée (case 10) */
  quantityReceived: Scalars['Float'];
};

/**
 * Installation de destination ou d'entreprosage
 * ou de reconditionnement prévue (case 2)
 */
export type Recipient = {
  __typename?: 'Recipient';
  /** N° de CAP (le cas échéant) */
  cap: Maybe<Scalars['String']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation: Maybe<Scalars['String']>;
  /** Établissement de destination */
  company: Maybe<FormCompany>;
  /** Indique si c'est un établissement d'entreposage temporaire ou de reocnditionnement */
  isTempStorage: Maybe<Scalars['Boolean']>;
};

/**
 * Payload lié à l'installation de destination ou d'entreprosage
 * ou de reconditionnement prévue (case 2)
 */
export type RecipientInput = {
  /** N° de CAP (le cas échéant) */
  cap: Maybe<Scalars['String']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation: Maybe<Scalars['String']>;
  /** Établissement de destination */
  company: Maybe<CompanyInput>;
  /** Si c'est un entreprosage provisoire ou reconditionnement */
  isTempStorage: Maybe<Scalars['Boolean']>;
};

/** Payload lié au détails du déchet du BSD suite (case 14 à 19) */
export type ResealedFormInput = {
  /** Destination finale du déchet (case 14) */
  destination: Maybe<DestinationInput>;
  /** Détail du déchet en cas de reconditionnement (case 15 à 19) */
  wasteDetails: Maybe<WasteDetailsInput>;
  /** Transporteur du déchet reconditionné */
  transporter: Maybe<TransporterInput>;
};

/** Payload lié au détails du déchet du BSD suite et à la signature de l'envoi (case 14 à 20) */
export type ResentFormInput = {
  /** Destination finale du déchet (case 14) */
  destination: Maybe<DestinationInput>;
  /** Détail du déchet en cas de reconditionnement (case 15 à 19) */
  wasteDetails: Maybe<WasteDetailsInput>;
  /** Transporteur du déchet reconditionné */
  transporter: Maybe<TransporterInput>;
  /** Nom du signataire du BSD suite  (case 19) */
  signedBy: Scalars['String'];
  /** Date de signature du BSD suite (case 19). Défaut à la date d'aujourd'hui. */
  signedAt: Scalars['DateTime'];
};

/**
 * Rubrique ICPE d'un établissement avec les autorisations associées
 * Pour plus de détails, se référer à la
 * [nomenclature des ICPE](https://www.georisques.gouv.fr/articles-risques/les-installations-classees-pour-la-protection-de-lenvironnement#nomenclature-des-installations-classees)
 */
export type Rubrique = {
  __typename?: 'Rubrique';
  /**
   * Numéro de rubrique tel que défini dans la nomenclature des ICPE
   * Ex: 2710
   */
  rubrique: Scalars['String'];
  /** Alinéa pour la rubrique concerné */
  alinea: Maybe<Scalars['String']>;
  /** État de l'activité, ex: 'En fonct', 'À l'arrêt' */
  etatActivite: Maybe<Scalars['String']>;
  /** Régime autorisé pour la rubrique: déclaratif, autorisation, seveso, etc */
  regimeAutorise: Maybe<Scalars['String']>;
  /**
   * Description de l'activité:
   * Ex: traitement thermique de déchets dangereux
   */
  activite: Maybe<Scalars['String']>;
  /** Catégorie d'établissement associé: TTR, VHU, Traitement */
  category: Scalars['String'];
  /** Volume autorisé */
  volume: Maybe<Scalars['String']>;
  /** Unité utilisé pour le volume autorisé */
  unite: Maybe<Scalars['String']>;
  /** Type de déchets autorisé */
  wasteType: Maybe<WasteType>;
};

/** Payload de signature d'un BSD */
export type SentFormInput = {
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt: Scalars['DateTime'];
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars['String'];
};

/** Dénomination de l'auteur de la signature */
export enum SignatureAuthor {
  /** L'auteur de la signature est l'émetteur du déchet */
  Emitter = 'EMITTER',
  /** L'auteur de la signature est l'éco-organisme figurant sur le BSD */
  EcoOrganisme = 'ECO_ORGANISME'
}

/** Payload simplifié de signature d'un BSD par un transporteur */
export type SignatureFormInput = {
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt: Scalars['DateTime'];
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars['String'];
};

export type SignupInput = {
  /** Email de l'utilisateur */
  email: Scalars['String'];
  /** Mot de passe de l'utilisateur */
  password: Scalars['String'];
  /** Nom de l'utilisateur */
  name: Scalars['String'];
  /** Numéro de téléphone de l'utilisateur */
  phone: Maybe<Scalars['String']>;
};

/** Statistiques */
export type Stat = {
  __typename?: 'Stat';
  /** Code déchet */
  wasteCode: Scalars['String'];
  /** Quantité entrante */
  incoming: Scalars['Float'];
  /** Qantité sortante */
  outgoing: Scalars['Float'];
};

/**
 * En fonction du statut du bordereau, différentes informations sont à lire pour connaitre vraiment l'étast du bordereau:
 * - la quantité peut changer entre émission, réception, entreposage provisoire...
 * - le bordereau peut naviguer entre plusieurs entreprises.
 * - quand le bordereau a-t-il été modifié pour la dernière fois ? (création, signature, traitement... ?)
 * - si c'est un bordereau avec conditionnement et qu'on attend un transporteur, quel est-il ?
 * 
 * Cet objet `StateSummary` vise à simplifier ces questions. Il renverra toujours la valeur pour un instant T donné.
 */
export type StateSummary = {
  __typename?: 'StateSummary';
  /** Quantité la plus à jour */
  quantity: Maybe<Scalars['Float']>;
  /**
   * DEPRECATED Packaging le plus à jour
   * @deprecated Utiliser packagingInfos
   */
  packagings: Array<Packagings>;
  /** Packaging le plus à jour */
  packagingInfos: Array<PackagingInfo>;
  /** Code ONU le plus à jour */
  onuCode: Maybe<Scalars['String']>;
  /** Prochaine entreprise à transporter le déchet (entreprise en case 8 ou 18) */
  transporter: Maybe<FormCompany>;
  /** Numéro de plaque d'immatriculation */
  transporterNumberPlate: Maybe<Scalars['String']>;
  /** Information libre, destinée aux transporteurs */
  transporterCustomInfo: Maybe<Scalars['String']>;
  /** Prochaine entreprise à recevoir le déchet (entreprise en case 2 ou 14) */
  recipient: Maybe<FormCompany>;
  /** Prochaine entreprise à émettre le déchet (entreprise en case 1 ou 13) */
  emitter: Maybe<FormCompany>;
  /** Date de la dernière action sur le bordereau */
  lastActionOn: Maybe<Scalars['DateTime']>;
};

/** Changement de statut d'un bordereau */
export type StatusLog = {
  __typename?: 'StatusLog';
  /** Identifiant du log */
  id: Maybe<Scalars['ID']>;
  /** Statut du bordereau après le changement de statut */
  status: Maybe<FormStatus>;
  /** Date à laquelle le changement de statut a été effectué */
  loggedAt: Maybe<Scalars['DateTime']>;
  /** Valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription) */
  updatedFields: Maybe<Scalars['JSON']>;
  /** BSD concerné */
  form: Maybe<StatusLogForm>;
  /** Utilisateur à l'origine de la modification */
  user: Maybe<StatusLogUser>;
};

/** Information sur un BSD dans les logs de modifications de statuts */
export type StatusLogForm = {
  __typename?: 'StatusLogForm';
  /** Identifiant du BSD */
  id: Maybe<Scalars['ID']>;
  /**
   * N° du bordereau
   * @deprecated Le readableId apparaît sur le CERFA mais l'id doit être utilisé comme identifiant.
   */
  readableId: Maybe<Scalars['String']>;
};

/** Utilisateur ayant modifié le BSD */
export type StatusLogUser = {
  __typename?: 'StatusLogUser';
  id: Maybe<Scalars['ID']>;
  email: Maybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /**
   * DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`
   * 
   * Permet de s'abonner aux changements de statuts d'un BSD
   */
  forms: Maybe<FormSubscription>;
};


export type SubscriptionFormsArgs = {
  token: Scalars['String'];
};

/** Payload de prise en charge de segment */
export type TakeOverInput = {
  takenOverAt: Scalars['DateTime'];
  takenOverBy: Scalars['String'];
};

/** Données du BSD suite sur la partie entreposage provisoire ou reconditionnement, rattachées à un BSD existant */
export type TemporaryStorageDetail = {
  __typename?: 'TemporaryStorageDetail';
  /** Établissement qui stocke temporairement le déchet (case 13) */
  temporaryStorer: Maybe<TemporaryStorer>;
  /**
   * Installation de destination prévue (case 14) à remplir par le producteur ou
   * le site d'entreposage provisoire
   */
  destination: Maybe<Destination>;
  /** Détails du déchet (cases 15, 16 et 17) */
  wasteDetails: Maybe<WasteDetails>;
  /** Transporteur du déchet (case 18) */
  transporter: Maybe<Transporter>;
  /** Nom du signataire du BSD suite  (case 19) */
  signedBy: Maybe<Scalars['String']>;
  /** Date de signature du BSD suite (case 19) */
  signedAt: Maybe<Scalars['DateTime']>;
};

export type TemporaryStorageDetailInput = {
  destination: Maybe<DestinationInput>;
};

export type TemporaryStorer = {
  __typename?: 'TemporaryStorer';
  quantityType: Maybe<QuantityType>;
  quantityReceived: Maybe<Scalars['Float']>;
  wasteAcceptationStatus: Maybe<Scalars['String']>;
  wasteRefusalReason: Maybe<Scalars['String']>;
  receivedAt: Maybe<Scalars['DateTime']>;
  receivedBy: Maybe<Scalars['String']>;
};

export type TempStoredFormInput = {
  /** Statut d'acceptation du déchet (case 13) */
  wasteAcceptationStatus: WasteAcceptationStatusInput;
  /** Raison du refus (case 13) */
  wasteRefusalReason: Maybe<Scalars['String']>;
  /** Nom de la personne en charge de la réception du déchet (case 13) */
  receivedBy: Scalars['String'];
  /** Date à laquelle le déchet a été reçu (case 13) */
  receivedAt: Scalars['DateTime'];
  /** Date à laquelle le déchet a été accepté ou refusé (case 13). Défaut à la date d'aujourd'hui. */
  signedAt: Maybe<Scalars['DateTime']>;
  /** Quantité réelle présentée (case 13) */
  quantityReceived: Scalars['Float'];
  /** Réelle ou estimée */
  quantityType: QuantityType;
};

/** Négociant (case 7) */
export type Trader = {
  __typename?: 'Trader';
  /** Établissement négociant */
  company: Maybe<FormCompany>;
  /** N° de récipissé */
  receipt: Maybe<Scalars['String']>;
  /** Département */
  department: Maybe<Scalars['String']>;
  /** Limite de validité */
  validityLimit: Maybe<Scalars['DateTime']>;
};

/** Payload lié au négociant */
export type TraderInput = {
  /** N° de récipissé */
  receipt: Maybe<Scalars['String']>;
  /** Département */
  department: Maybe<Scalars['String']>;
  /** Limite de validité */
  validityLimit: Maybe<Scalars['DateTime']>;
  /** Établissement négociant */
  company: Maybe<CompanyInput>;
};

/** Récépissé négociant */
export type TraderReceipt = {
  __typename?: 'TraderReceipt';
  id: Scalars['ID'];
  /** Numéro de récépissé négociant */
  receiptNumber: Scalars['String'];
  /** Limite de validatié du récépissé */
  validityLimit: Scalars['DateTime'];
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
};

/** Collecteur - transporteur (case 8) */
export type Transporter = {
  __typename?: 'Transporter';
  /** Établissement collecteur - transporteur */
  company: Maybe<FormCompany>;
  /** Exemption de récipissé */
  isExemptedOfReceipt: Maybe<Scalars['Boolean']>;
  /** N° de récipissé */
  receipt: Maybe<Scalars['String']>;
  /** Département */
  department: Maybe<Scalars['String']>;
  /** Limite de validité du récipissé */
  validityLimit: Maybe<Scalars['DateTime']>;
  /** Numéro de plaque d'immatriculation */
  numberPlate: Maybe<Scalars['String']>;
  /** Information libre, destinée aux transporteurs */
  customInfo: Maybe<Scalars['String']>;
};

/** Collecteur - transporteur (case 8) */
export type TransporterInput = {
  /** Établissement collecteur - transporteur */
  company: Maybe<CompanyInput>;
  /** Exemption de récipissé */
  isExemptedOfReceipt: Maybe<Scalars['Boolean']>;
  /** N° de récipissé */
  receipt: Maybe<Scalars['String']>;
  /** Département */
  department: Maybe<Scalars['String']>;
  /** Limite de validité du récipissé */
  validityLimit: Maybe<Scalars['DateTime']>;
  /** Numéro de plaque d'immatriculation */
  numberPlate: Maybe<Scalars['String']>;
  /** Information libre, destinée aux transporteurs */
  customInfo: Maybe<Scalars['String']>;
};

/** Récépissé transporteur */
export type TransporterReceipt = {
  __typename?: 'TransporterReceipt';
  id: Scalars['ID'];
  /** Numéro de récépissé transporteur */
  receiptNumber: Scalars['String'];
  /** Limite de validatié du récépissé */
  validityLimit: Scalars['DateTime'];
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
};

/** Payload de signature d'un BSD par un transporteur */
export type TransporterSignatureFormInput = {
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt: Scalars['DateTime'];
  /** Si oui ou non le BSD a été signé par un transporteur */
  signedByTransporter: Scalars['Boolean'];
  /** Code de sécurité permettant d'authentifier l'émetteur */
  securityCode: Scalars['Int'];
  /** Dénomination de l'auteur de la signature, par défaut il s'agit de l'émetteur */
  signatureAuthor: Maybe<SignatureAuthor>;
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars['String'];
  /** Si oui on non le BSD a été signé par l'émetteur */
  signedByProducer: Scalars['Boolean'];
  /** Conditionnements */
  packagingInfos: Maybe<Array<PackagingInfoInput>>;
  /** DEPRECATED - Conditionnement */
  packagings: Maybe<Array<Maybe<Packagings>>>;
  /** Quantité en tonnes */
  quantity: Scalars['Float'];
  /** Code ONU */
  onuCode: Maybe<Scalars['String']>;
};

export enum TransportMode {
  Road = 'ROAD',
  Rail = 'RAIL',
  Air = 'AIR',
  River = 'RIVER',
  Sea = 'SEA'
}

export type TransportSegment = {
  __typename?: 'TransportSegment';
  id: Scalars['ID'];
  /** Siret du transporteur précédent */
  previousTransporterCompanySiret: Maybe<Scalars['String']>;
  /** Transporteur du segment */
  transporter: Maybe<Transporter>;
  /** Mode de transport */
  mode: Maybe<TransportMode>;
  /** Date de prise en charge */
  takenOverAt: Maybe<Scalars['DateTime']>;
  /** Reponsable de la prise en charge */
  takenOverBy: Maybe<Scalars['String']>;
  /** Prêt à être pris en charge */
  readyToTakeOver: Maybe<Scalars['Boolean']>;
  /** Numéro du segment */
  segmentNumber: Maybe<Scalars['Int']>;
};

/** Payload de mise à jour d'un bordereau */
export type UpdateFormInput = {
  /** Identifiant opaque */
  id: Scalars['ID'];
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId: Maybe<Scalars['String']>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter: Maybe<EmitterInput>;
  /** Établissement qui reçoit le déchet (case 2) */
  recipient: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter: Maybe<TransporterInput>;
  /** Détails du déchet (case 3) */
  wasteDetails: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader: Maybe<TraderInput>;
  /** Annexe 2 */
  appendix2Forms: Maybe<Array<Maybe<AppendixFormInput>>>;
  ecoOrganisme: Maybe<EcoOrganismeInput>;
  temporaryStorageDetail: Maybe<TemporaryStorageDetailInput>;
};

/** Payload d'édition d'un récépissé transporteur */
export type UpdateTraderReceiptInput = {
  /** The id of the trader receipt to modify */
  id: Scalars['ID'];
  /** Numéro de récépissé transporteur */
  receiptNumber: Maybe<Scalars['String']>;
  /** Limite de validatié du récépissé */
  validityLimit: Maybe<Scalars['DateTime']>;
  /** Département ayant enregistré la déclaration */
  department: Maybe<Scalars['String']>;
};

/** Payload d'édition d'un récépissé transporteur */
export type UpdateTransporterReceiptInput = {
  /** The id of the transporter receipt to modify */
  id: Scalars['ID'];
  /** Numéro de récépissé transporteur */
  receiptNumber: Maybe<Scalars['String']>;
  /** Limite de validatié du récépissé */
  validityLimit: Maybe<Scalars['DateTime']>;
  /** Département ayant enregistré la déclaration */
  department: Maybe<Scalars['String']>;
};

/** Lien d'upload */
export type UploadLink = {
  __typename?: 'UploadLink';
  /** URL signé permettant d'uploader un fichier */
  signedUrl: Maybe<Scalars['String']>;
  /** Clé permettant l'upload du fichier */
  key: Maybe<Scalars['String']>;
};


/** Représente un utilisateur sur la plateforme Trackdéchets */
export type User = {
  __typename?: 'User';
  /** Identifiant opaque */
  id: Scalars['ID'];
  /** Email de l'utiliateur */
  email: Scalars['String'];
  /** Nom de l'utilisateur */
  name: Maybe<Scalars['String']>;
  /** Numéro de téléphone de l'utilisateur */
  phone: Maybe<Scalars['String']>;
  /** Liste des établissements dont l'utilisateur est membre */
  companies: Array<CompanyPrivate>;
};

/**
 * Liste les différents rôles d'un utilisateur au sein
 * d'un établissement.
 * 
 * Les admins peuvent:
 * * consulter/éditer les bordereaux
 * * gérer les utilisateurs de l'établissement
 * * éditer les informations de la fiche entreprise
 * * demander le renouvellement du code de sécurité
 * * Éditer les informations de la fiche entreprise
 * 
 * Les membres peuvent:
 * * consulter/éditer les bordereaux
 * * consulter le reste des informations
 * 
 * Vous pouvez consulter [cette page](https://docs.google.com/spreadsheets/d/12K9Bd2k5l4uqXhS0h5uI00lNEzW7C-1t-NDOyxy8aKk/edit#gid=0)
 * pour le détail de chacun des rôles
 */
export enum UserRole {
  Member = 'MEMBER',
  Admin = 'ADMIN'
}

/** Statut d'acceptation d'un déchet */
export enum WasteAcceptationStatusInput {
  /** Accepté en totalité */
  Accepted = 'ACCEPTED',
  /** Refusé */
  Refused = 'REFUSED',
  /** Refus partiel */
  PartiallyRefused = 'PARTIALLY_REFUSED'
}

/** Détails du déchet (case 3, 4, 5, 6) */
export type WasteDetails = {
  __typename?: 'WasteDetails';
  /** Rubrique déchet au format |_|_| |_|_| |_|_| (*) */
  code: Maybe<Scalars['String']>;
  /** Dénomination usuelle */
  name: Maybe<Scalars['String']>;
  /** Code ONU */
  onuCode: Maybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos: Maybe<Array<PackagingInfo>>;
  /**
   * Conditionnement
   * @deprecated Utiliser `packagingInfos`
   */
  packagings: Maybe<Array<Packagings>>;
  /**
   * Autre packaging (préciser)
   * @deprecated Utiliser `packagingInfos`
   */
  otherPackaging: Maybe<Scalars['String']>;
  /**
   * Nombre de colis
   * @deprecated Utiliser `packagingInfos`
   */
  numberOfPackages: Maybe<Scalars['Int']>;
  /** Quantité en tonnes */
  quantity: Maybe<Scalars['Float']>;
  /** Réelle ou estimée */
  quantityType: Maybe<QuantityType>;
  /** Consistance */
  consistence: Maybe<Consistence>;
};

/** Payload lié au détails du déchet (case 3, 4, 5, 6) */
export type WasteDetailsInput = {
  /**
   * Code du déchet dangereux ou non-dangereux qui doit faire partie de la liste officielle du code de l'environnement :
   * https://aida.ineris.fr/consultation_document/10327
   * 
   * Il doit être composé de 3 paires de deux chiffres séparés par un espace et se termine éventuellement par une astérisque.
   * 
   * Un exemple de déchet non-dangereux valide (déchets provenant de l'extraction des minéraux métallifères) :
   * 01 01 01
   * 
   * Ce même exemple, mais avec un format invalide :
   * 010101
   * 
   * Un exemple de déchet dangereux valide (stériles acidogènes provenant de la transformation du sulfure) :
   * 01 03 04*
   * 
   * Ce même exemple, mais avec un format invalide :
   * 010304 *
   */
  code: Maybe<Scalars['String']>;
  /** Dénomination usuelle */
  name: Maybe<Scalars['String']>;
  /** Code ONU */
  onuCode: Maybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos: Maybe<Array<PackagingInfoInput>>;
  /** DEPRECATED - Conditionnement */
  packagings: Maybe<Array<Maybe<Packagings>>>;
  /** DEPRECATED - Autre packaging (préciser) */
  otherPackaging: Maybe<Scalars['String']>;
  /** DEPRECATED - Nombre de colis */
  numberOfPackages: Maybe<Scalars['Int']>;
  /** Quantité en tonnes */
  quantity: Maybe<Scalars['Float']>;
  /** Réelle ou estimée */
  quantityType: Maybe<QuantityType>;
  /** Consistance */
  consistence: Maybe<Consistence>;
};

/** Type de déchets autorisé pour une rubrique */
export enum WasteType {
  /** Déchet inerte */
  Inerte = 'INERTE',
  /** Déchet non dangereux */
  NotDangerous = 'NOT_DANGEROUS',
  /** Déchet dangereux */
  Dangerous = 'DANGEROUS'
}

/** Informations sur une adresse chantier */
export type WorkSite = {
  __typename?: 'WorkSite';
  name: Maybe<Scalars['String']>;
  address: Maybe<Scalars['String']>;
  city: Maybe<Scalars['String']>;
  postalCode: Maybe<Scalars['String']>;
  infos: Maybe<Scalars['String']>;
};

/** Payload d'une adresse chantier */
export type WorkSiteInput = {
  name: Maybe<Scalars['String']>;
  address: Maybe<Scalars['String']>;
  city: Maybe<Scalars['String']>;
  postalCode: Maybe<Scalars['String']>;
  infos: Maybe<Scalars['String']>;
};


export function createAppendixFormInputMock(props: Partial<AppendixFormInput>): AppendixFormInput {
  return {
    id: null,
    readableId: null,
    ...props,
  };
}

export function createAuthPayloadMock(props: Partial<AuthPayload>): AuthPayload {
  return {
    __typename: "AuthPayload",
    token: "",
    user: createUserMock({}),
    ...props,
  };
}

export function createCompanyFavoriteMock(props: Partial<CompanyFavorite>): CompanyFavorite {
  return {
    __typename: "CompanyFavorite",
    name: null,
    siret: null,
    address: null,
    contact: null,
    phone: null,
    mail: null,
    transporterReceipt: null,
    traderReceipt: null,
    ...props,
  };
}

export function createCompanyInputMock(props: Partial<CompanyInput>): CompanyInput {
  return {
    siret: null,
    name: null,
    address: null,
    contact: null,
    mail: null,
    phone: null,
    ...props,
  };
}

export function createCompanyMemberMock(props: Partial<CompanyMember>): CompanyMember {
  return {
    __typename: "CompanyMember",
    id: "",
    email: "",
    name: null,
    role: null,
    isActive: null,
    isPendingInvitation: null,
    isMe: null,
    ...props,
  };
}

export function createCompanyPrivateMock(props: Partial<CompanyPrivate>): CompanyPrivate {
  return {
    __typename: "CompanyPrivate",
    id: "",
    companyTypes: [],
    gerepId: null,
    securityCode: 0,
    contactEmail: null,
    contactPhone: null,
    website: null,
    users: null,
    userRole: null,
    givenName: null,
    siret: "",
    address: null,
    name: null,
    naf: null,
    libelleNaf: null,
    installation: null,
    transporterReceipt: null,
    traderReceipt: null,
    ecoOrganismeAgreements: [],
    ...props,
  };
}

export function createCompanyPublicMock(props: Partial<CompanyPublic>): CompanyPublic {
  return {
    __typename: "CompanyPublic",
    contactEmail: null,
    contactPhone: null,
    website: null,
    siret: null,
    etatAdministratif: null,
    address: null,
    name: null,
    naf: null,
    libelleNaf: null,
    installation: null,
    isRegistered: null,
    transporterReceipt: null,
    traderReceipt: null,
    ecoOrganismeAgreements: [],
    ...props,
  };
}

export function createCompanySearchResultMock(props: Partial<CompanySearchResult>): CompanySearchResult {
  return {
    __typename: "CompanySearchResult",
    siret: null,
    etatAdministratif: null,
    address: null,
    codeCommune: null,
    name: null,
    companyTypes: null,
    naf: null,
    libelleNaf: null,
    installation: null,
    transporterReceipt: null,
    traderReceipt: null,
    ...props,
  };
}

export function createCompanyStatMock(props: Partial<CompanyStat>): CompanyStat {
  return {
    __typename: "CompanyStat",
    company: null,
    stats: [],
    ...props,
  };
}

export function createCreateFormInputMock(props: Partial<CreateFormInput>): CreateFormInput {
  return {
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    ...props,
  };
}

export function createCreateTraderReceiptInputMock(props: Partial<CreateTraderReceiptInput>): CreateTraderReceiptInput {
  return {
    receiptNumber: "",
    validityLimit: new Date().toISOString(),
    department: "",
    ...props,
  };
}

export function createCreateTransporterReceiptInputMock(props: Partial<CreateTransporterReceiptInput>): CreateTransporterReceiptInput {
  return {
    receiptNumber: "",
    validityLimit: new Date().toISOString(),
    department: "",
    ...props,
  };
}

export function createDeclarationMock(props: Partial<Declaration>): Declaration {
  return {
    __typename: "Declaration",
    annee: null,
    codeDechet: null,
    libDechet: null,
    gerepType: null,
    ...props,
  };
}

export function createDeleteTraderReceiptInputMock(props: Partial<DeleteTraderReceiptInput>): DeleteTraderReceiptInput {
  return {
    id: "",
    ...props,
  };
}

export function createDeleteTransporterReceiptInputMock(props: Partial<DeleteTransporterReceiptInput>): DeleteTransporterReceiptInput {
  return {
    id: "",
    ...props,
  };
}

export function createDestinationMock(props: Partial<Destination>): Destination {
  return {
    __typename: "Destination",
    cap: null,
    processingOperation: null,
    company: null,
    isFilledByEmitter: null,
    ...props,
  };
}

export function createDestinationInputMock(props: Partial<DestinationInput>): DestinationInput {
  return {
    company: null,
    cap: null,
    processingOperation: null,
    ...props,
  };
}

export function createEcoOrganismeMock(props: Partial<EcoOrganisme>): EcoOrganisme {
  return {
    __typename: "EcoOrganisme",
    id: "",
    name: "",
    siret: "",
    address: "",
    ...props,
  };
}

export function createEcoOrganismeInputMock(props: Partial<EcoOrganismeInput>): EcoOrganismeInput {
  return {
    name: "",
    siret: "",
    ...props,
  };
}

export function createEmitterMock(props: Partial<Emitter>): Emitter {
  return {
    __typename: "Emitter",
    type: null,
    workSite: null,
    pickupSite: null,
    company: null,
    ...props,
  };
}

export function createEmitterInputMock(props: Partial<EmitterInput>): EmitterInput {
  return {
    type: null,
    workSite: null,
    pickupSite: null,
    company: null,
    ...props,
  };
}

export function createFileDownloadMock(props: Partial<FileDownload>): FileDownload {
  return {
    __typename: "FileDownload",
    token: null,
    downloadLink: null,
    ...props,
  };
}

export function createFormMock(props: Partial<Form>): Form {
  return {
    __typename: "Form",
    id: "",
    readableId: "",
    customId: null,
    isImportedFromPaper: false,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    createdAt: null,
    updatedAt: null,
    status: FormStatus.Draft,
    signedByTransporter: null,
    sentAt: null,
    sentBy: null,
    wasteAcceptationStatus: null,
    wasteRefusalReason: null,
    receivedBy: null,
    receivedAt: null,
    signedAt: null,
    quantityReceived: null,
    actualQuantity: null,
    processingOperationDone: null,
    processingOperationDescription: null,
    processedBy: null,
    processedAt: null,
    noTraceability: null,
    nextDestination: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    stateSummary: null,
    transportSegments: null,
    currentTransporterSiret: null,
    nextTransporterSiret: null,
    ...props,
  };
}

export function createFormCompanyMock(props: Partial<FormCompany>): FormCompany {
  return {
    __typename: "FormCompany",
    name: null,
    siret: null,
    address: null,
    country: null,
    contact: null,
    phone: null,
    mail: null,
    ...props,
  };
}

export function createFormEcoOrganismeMock(props: Partial<FormEcoOrganisme>): FormEcoOrganisme {
  return {
    __typename: "FormEcoOrganisme",
    name: "",
    siret: "",
    ...props,
  };
}

export function createFormInputMock(props: Partial<FormInput>): FormInput {
  return {
    id: null,
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    ...props,
  };
}

export function createFormsLifeCycleDataMock(props: Partial<FormsLifeCycleData>): FormsLifeCycleData {
  return {
    __typename: "formsLifeCycleData",
    statusLogs: [],
    hasNextPage: null,
    hasPreviousPage: null,
    startCursor: null,
    endCursor: null,
    count: null,
    ...props,
  };
}

export function createFormSubscriptionMock(props: Partial<FormSubscription>): FormSubscription {
  return {
    __typename: "FormSubscription",
    mutation: null,
    node: null,
    updatedFields: null,
    previousValues: null,
    ...props,
  };
}

export function createImportPaperFormInputMock(props: Partial<ImportPaperFormInput>): ImportPaperFormInput {
  return {
    id: null,
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    ecoOrganisme: null,
    signingInfo: createSignatureFormInputMock({}),
    receivedInfo: createReceivedFormInputMock({}),
    processedInfo: createProcessedFormInputMock({}),
    ...props,
  };
}

export function createInstallationMock(props: Partial<Installation>): Installation {
  return {
    __typename: "Installation",
    codeS3ic: null,
    urlFiche: null,
    rubriques: null,
    declarations: null,
    ...props,
  };
}

export function createInternationalCompanyInputMock(props: Partial<InternationalCompanyInput>): InternationalCompanyInput {
  return {
    siret: null,
    name: null,
    address: null,
    country: null,
    contact: null,
    mail: null,
    phone: null,
    ...props,
  };
}

export function createInvitationMock(props: Partial<Invitation>): Invitation {
  return {
    __typename: "Invitation",
    id: "",
    email: "",
    companySiret: "",
    hash: "",
    role: UserRole.Member,
    acceptedAt: null,
    ...props,
  };
}

export function createMembershipRequestMock(props: Partial<MembershipRequest>): MembershipRequest {
  return {
    __typename: "MembershipRequest",
    id: "",
    email: "",
    siret: "",
    name: "",
    status: MembershipRequestStatus.Pending,
    sentTo: [],
    ...props,
  };
}

export function createNextDestinationMock(props: Partial<NextDestination>): NextDestination {
  return {
    __typename: "NextDestination",
    processingOperation: null,
    company: null,
    ...props,
  };
}

export function createNextDestinationInputMock(props: Partial<NextDestinationInput>): NextDestinationInput {
  return {
    processingOperation: "",
    company: createInternationalCompanyInputMock({}),
    ...props,
  };
}

export function createNextSegmentInfoInputMock(props: Partial<NextSegmentInfoInput>): NextSegmentInfoInput {
  return {
    transporter: null,
    mode: TransportMode.Road,
    ...props,
  };
}

export function createPackagingInfoMock(props: Partial<PackagingInfo>): PackagingInfo {
  return {
    __typename: "PackagingInfo",
    type: Packagings.Fut,
    other: null,
    quantity: 0,
    ...props,
  };
}

export function createPackagingInfoInputMock(props: Partial<PackagingInfoInput>): PackagingInfoInput {
  return {
    type: Packagings.Fut,
    other: null,
    quantity: 0,
    ...props,
  };
}

export function createPrivateCompanyInputMock(props: Partial<PrivateCompanyInput>): PrivateCompanyInput {
  return {
    siret: "",
    gerepId: null,
    companyTypes: [],
    codeNaf: null,
    companyName: null,
    documentKeys: null,
    transporterReceiptId: null,
    traderReceiptId: null,
    ecoOrganismeAgreements: null,
    ...props,
  };
}

export function createProcessedFormInputMock(props: Partial<ProcessedFormInput>): ProcessedFormInput {
  return {
    processingOperationDone: "",
    processingOperationDescription: null,
    processedBy: "",
    processedAt: new Date().toISOString(),
    nextDestination: null,
    noTraceability: null,
    ...props,
  };
}

export function createReceivedFormInputMock(props: Partial<ReceivedFormInput>): ReceivedFormInput {
  return {
    wasteAcceptationStatus: WasteAcceptationStatusInput.Accepted,
    wasteRefusalReason: null,
    receivedBy: "",
    receivedAt: new Date().toISOString(),
    signedAt: null,
    quantityReceived: 0,
    ...props,
  };
}

export function createRecipientMock(props: Partial<Recipient>): Recipient {
  return {
    __typename: "Recipient",
    cap: null,
    processingOperation: null,
    company: null,
    isTempStorage: null,
    ...props,
  };
}

export function createRecipientInputMock(props: Partial<RecipientInput>): RecipientInput {
  return {
    cap: null,
    processingOperation: null,
    company: null,
    isTempStorage: null,
    ...props,
  };
}

export function createResealedFormInputMock(props: Partial<ResealedFormInput>): ResealedFormInput {
  return {
    destination: null,
    wasteDetails: null,
    transporter: null,
    ...props,
  };
}

export function createResentFormInputMock(props: Partial<ResentFormInput>): ResentFormInput {
  return {
    destination: null,
    wasteDetails: null,
    transporter: null,
    signedBy: "",
    signedAt: new Date().toISOString(),
    ...props,
  };
}

export function createRubriqueMock(props: Partial<Rubrique>): Rubrique {
  return {
    __typename: "Rubrique",
    rubrique: "",
    alinea: null,
    etatActivite: null,
    regimeAutorise: null,
    activite: null,
    category: "",
    volume: null,
    unite: null,
    wasteType: null,
    ...props,
  };
}

export function createSentFormInputMock(props: Partial<SentFormInput>): SentFormInput {
  return {
    sentAt: new Date().toISOString(),
    sentBy: "",
    ...props,
  };
}

export function createSignatureFormInputMock(props: Partial<SignatureFormInput>): SignatureFormInput {
  return {
    sentAt: new Date().toISOString(),
    sentBy: "",
    ...props,
  };
}

export function createSignupInputMock(props: Partial<SignupInput>): SignupInput {
  return {
    email: "",
    password: "",
    name: "",
    phone: null,
    ...props,
  };
}

export function createStatMock(props: Partial<Stat>): Stat {
  return {
    __typename: "Stat",
    wasteCode: "",
    incoming: 0,
    outgoing: 0,
    ...props,
  };
}

export function createStateSummaryMock(props: Partial<StateSummary>): StateSummary {
  return {
    __typename: "StateSummary",
    quantity: null,
    packagings: [],
    packagingInfos: [],
    onuCode: null,
    transporter: null,
    transporterNumberPlate: null,
    transporterCustomInfo: null,
    recipient: null,
    emitter: null,
    lastActionOn: null,
    ...props,
  };
}

export function createStatusLogMock(props: Partial<StatusLog>): StatusLog {
  return {
    __typename: "StatusLog",
    id: null,
    status: null,
    loggedAt: null,
    updatedFields: null,
    form: null,
    user: null,
    ...props,
  };
}

export function createStatusLogFormMock(props: Partial<StatusLogForm>): StatusLogForm {
  return {
    __typename: "StatusLogForm",
    id: null,
    readableId: null,
    ...props,
  };
}

export function createStatusLogUserMock(props: Partial<StatusLogUser>): StatusLogUser {
  return {
    __typename: "StatusLogUser",
    id: null,
    email: null,
    ...props,
  };
}

export function createSubscriptionMock(props: Partial<Subscription>): Subscription {
  return {
    __typename: "Subscription",
    forms: null,
    ...props,
  };
}

export function createTakeOverInputMock(props: Partial<TakeOverInput>): TakeOverInput {
  return {
    takenOverAt: new Date().toISOString(),
    takenOverBy: "",
    ...props,
  };
}

export function createTemporaryStorageDetailMock(props: Partial<TemporaryStorageDetail>): TemporaryStorageDetail {
  return {
    __typename: "TemporaryStorageDetail",
    temporaryStorer: null,
    destination: null,
    wasteDetails: null,
    transporter: null,
    signedBy: null,
    signedAt: null,
    ...props,
  };
}

export function createTemporaryStorageDetailInputMock(props: Partial<TemporaryStorageDetailInput>): TemporaryStorageDetailInput {
  return {
    destination: null,
    ...props,
  };
}

export function createTemporaryStorerMock(props: Partial<TemporaryStorer>): TemporaryStorer {
  return {
    __typename: "TemporaryStorer",
    quantityType: null,
    quantityReceived: null,
    wasteAcceptationStatus: null,
    wasteRefusalReason: null,
    receivedAt: null,
    receivedBy: null,
    ...props,
  };
}

export function createTempStoredFormInputMock(props: Partial<TempStoredFormInput>): TempStoredFormInput {
  return {
    wasteAcceptationStatus: WasteAcceptationStatusInput.Accepted,
    wasteRefusalReason: null,
    receivedBy: "",
    receivedAt: new Date().toISOString(),
    signedAt: null,
    quantityReceived: 0,
    quantityType: QuantityType.Real,
    ...props,
  };
}

export function createTraderMock(props: Partial<Trader>): Trader {
  return {
    __typename: "Trader",
    company: null,
    receipt: null,
    department: null,
    validityLimit: null,
    ...props,
  };
}

export function createTraderInputMock(props: Partial<TraderInput>): TraderInput {
  return {
    receipt: null,
    department: null,
    validityLimit: null,
    company: null,
    ...props,
  };
}

export function createTraderReceiptMock(props: Partial<TraderReceipt>): TraderReceipt {
  return {
    __typename: "TraderReceipt",
    id: "",
    receiptNumber: "",
    validityLimit: new Date().toISOString(),
    department: "",
    ...props,
  };
}

export function createTransporterMock(props: Partial<Transporter>): Transporter {
  return {
    __typename: "Transporter",
    company: null,
    isExemptedOfReceipt: null,
    receipt: null,
    department: null,
    validityLimit: null,
    numberPlate: null,
    customInfo: null,
    ...props,
  };
}

export function createTransporterInputMock(props: Partial<TransporterInput>): TransporterInput {
  return {
    company: null,
    isExemptedOfReceipt: null,
    receipt: null,
    department: null,
    validityLimit: null,
    numberPlate: null,
    customInfo: null,
    ...props,
  };
}

export function createTransporterReceiptMock(props: Partial<TransporterReceipt>): TransporterReceipt {
  return {
    __typename: "TransporterReceipt",
    id: "",
    receiptNumber: "",
    validityLimit: new Date().toISOString(),
    department: "",
    ...props,
  };
}

export function createTransporterSignatureFormInputMock(props: Partial<TransporterSignatureFormInput>): TransporterSignatureFormInput {
  return {
    sentAt: new Date().toISOString(),
    signedByTransporter: false,
    securityCode: 0,
    signatureAuthor: null,
    sentBy: "",
    signedByProducer: false,
    packagingInfos: null,
    packagings: null,
    quantity: 0,
    onuCode: null,
    ...props,
  };
}

export function createTransportSegmentMock(props: Partial<TransportSegment>): TransportSegment {
  return {
    __typename: "TransportSegment",
    id: "",
    previousTransporterCompanySiret: null,
    transporter: null,
    mode: null,
    takenOverAt: null,
    takenOverBy: null,
    readyToTakeOver: null,
    segmentNumber: null,
    ...props,
  };
}

export function createUpdateFormInputMock(props: Partial<UpdateFormInput>): UpdateFormInput {
  return {
    id: "",
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    ...props,
  };
}

export function createUpdateTraderReceiptInputMock(props: Partial<UpdateTraderReceiptInput>): UpdateTraderReceiptInput {
  return {
    id: "",
    receiptNumber: null,
    validityLimit: null,
    department: null,
    ...props,
  };
}

export function createUpdateTransporterReceiptInputMock(props: Partial<UpdateTransporterReceiptInput>): UpdateTransporterReceiptInput {
  return {
    id: "",
    receiptNumber: null,
    validityLimit: null,
    department: null,
    ...props,
  };
}

export function createUploadLinkMock(props: Partial<UploadLink>): UploadLink {
  return {
    __typename: "UploadLink",
    signedUrl: null,
    key: null,
    ...props,
  };
}

export function createUserMock(props: Partial<User>): User {
  return {
    __typename: "User",
    id: "",
    email: "",
    name: null,
    phone: null,
    companies: [],
    ...props,
  };
}

export function createWasteDetailsMock(props: Partial<WasteDetails>): WasteDetails {
  return {
    __typename: "WasteDetails",
    code: null,
    name: null,
    onuCode: null,
    packagingInfos: null,
    packagings: null,
    otherPackaging: null,
    numberOfPackages: null,
    quantity: null,
    quantityType: null,
    consistence: null,
    ...props,
  };
}

export function createWasteDetailsInputMock(props: Partial<WasteDetailsInput>): WasteDetailsInput {
  return {
    code: null,
    name: null,
    onuCode: null,
    packagingInfos: null,
    packagings: null,
    otherPackaging: null,
    numberOfPackages: null,
    quantity: null,
    quantityType: null,
    consistence: null,
    ...props,
  };
}

export function createWorkSiteMock(props: Partial<WorkSite>): WorkSite {
  return {
    __typename: "WorkSite",
    name: null,
    address: null,
    city: null,
    postalCode: null,
    infos: null,
    ...props,
  };
}

export function createWorkSiteInputMock(props: Partial<WorkSiteInput>): WorkSiteInput {
  return {
    name: null,
    address: null,
    city: null,
    postalCode: null,
    infos: null,
    ...props,
  };
}

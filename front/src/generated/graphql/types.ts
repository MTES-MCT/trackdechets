export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /**
   * Le scalaire `DateTime` accepte des chaines de caractères
   * formattées selon le standard ISO 8601. Exemples:
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

export type AcceptedFormInput = {
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus: WasteAcceptationStatusInput;
  /** Raison du refus (case 10). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: Maybe<Scalars["String"]>;
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt: Scalars["DateTime"];
  /** Nom de la personne en charge de l'acceptation' du déchet (case 10) */
  signedBy: Scalars["String"];
  /**
   * Quantité réelle présentée (case 10).
   *  Doit être supérieure à 0 lorsque le déchet est accepté.
   *  Doit être égale à 0 lorsque le déchet est refusé.
   */
  quantityReceived: Scalars["Float"];
};

export type AdminForVerification = {
  __typename?: "AdminForVerification";
  email: Scalars["String"];
  name?: Maybe<Scalars["String"]>;
  phone?: Maybe<Scalars["String"]>;
};

/**
 * Information sur le bordereau initial lors d'une réexpédition après transformation ou traitement aboutissant
 * à des déchets dont la provenance reste identifiable (annexe 2)
 */
export type Appendix2Form = {
  __typename?: "Appendix2Form";
  /** Identifiant unique du bordereau initial */
  id: Scalars["ID"];
  /** Identifiant lisible du bordereau initial */
  readableId: Scalars["String"];
  /** Détails du déchet du bordereau initial (case 3) */
  wasteDetails?: Maybe<WasteDetails>;
  /**
   * Émetteur du bordereau initial
   * Les établissements apparaissant sur le bordereau de regroupement mais pas sur le bordereau initial (ex: l'exutoire finale)
   * n'ont pas accès à ce champs pour préserver les informations commerciales de l'établissement effectuant le regroupemnt
   */
  emitter?: Maybe<Emitter>;
  /**
   * Code postal de l'émetteur du bordereau initial permettant aux établissements
   * qui apparaissent sur le bordereau de regroupement
   * mais pas sur le bordereau initial (ex: l'exutoire finale) de connaitre la zone de chalandise de l'émetteur initial.
   */
  emitterPostalCode?: Maybe<Scalars["String"]>;
  /**
   * Date d’acceptation du lot initial par l’installation réalisant une
   * transformation ou un traitement aboutissant à des déchets
   * dont la provenance reste identifiable. C'est la date qui figure au cadre 10 du bordereau initial.
   */
  signedAt?: Maybe<Scalars["DateTime"]>;
  /**
   * Quantité reçue par l’installation réalisant une transformation ou un traitement aboutissant à des déchets
   * dont la provenance reste identifiable
   */
  quantityReceived?: Maybe<Scalars["Float"]>;
  /**
   * Opération de transformation ou un traitement aboutissant à des déchets dont la provenance reste identifiable effectuée
   * par l'installation de regroupement
   */
  processingOperationDone?: Maybe<Scalars["String"]>;
};

/** Payload de création d'une annexe 2 */
export type AppendixFormInput = {
  /** Identifiant unique du bordereau */
  id?: Maybe<Scalars["ID"]>;
  /**
   * N° de bordereau
   *
   * Déprécié : L'id du bordereau doit être utilisé comme identifiant (paramètre id).
   * Le readableId permet de le récupérer via la query form.
   */
  readableId?: Maybe<Scalars["ID"]>;
};

/** Cet objet est renvoyé par la mutation login qui est dépréciée */
export type AuthPayload = {
  __typename?: "AuthPayload";
  /**
   * Bearer token à durée illimité permettant de s'authentifier
   * à l'API Trackdéchets. Pour ce faire, il doit être passé dans le
   * header d'autorisation `Authorization: Bearer ******`
   */
  token: Scalars["String"];
  /** Utilisateur lié au token */
  user: User;
};

/** Courtier */
export type Broker = {
  __typename?: "Broker";
  /** Établissement courtier */
  company?: Maybe<FormCompany>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars["String"]>;
  /** Département */
  department?: Maybe<Scalars["String"]>;
  /** Limite de validité */
  validityLimit?: Maybe<Scalars["DateTime"]>;
};

/** Payload lié au courtier */
export type BrokerInput = {
  /** N° de récipissé */
  receipt?: Maybe<Scalars["String"]>;
  /** Département */
  department?: Maybe<Scalars["String"]>;
  /** Limite de validité */
  validityLimit?: Maybe<Scalars["DateTime"]>;
  /** Établissement courtier */
  company?: Maybe<CompanyInput>;
};

/** Récépissé courtier */
export type BrokerReceipt = {
  __typename?: "BrokerReceipt";
  id: Scalars["ID"];
  /** Numéro de récépissé courtier */
  receiptNumber: Scalars["String"];
  /** Limite de validité du récépissé */
  validityLimit: Scalars["DateTime"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

export type Bsd = Form | Bsdasri | Bsvhu | Bsda;

export type Bsda = {
  __typename?: "Bsda";
  /** Bordereau n° */
  id: Scalars["String"];
  /** Date de création */
  createdAt: Scalars["DateTime"];
  /** Date de dernière modification */
  updatedAt: Scalars["DateTime"];
  /** Indique si le bordereau est à l'état de brouillon */
  isDraft: Scalars["Boolean"];
  /** Statur du bordereau */
  status: BsdaStatus;
  /**
   * Type de bordereau
   * Le type de bordereau impacte le workflow et les champs obligatoires
   */
  type?: Maybe<BsdaType>;
  /** Maitre d'ouvrage ou détenteur du déchet */
  emitter?: Maybe<BsdaEmitter>;
  /** Dénomination du déchet */
  waste?: Maybe<BsdaWaste>;
  /** Conditionnement */
  packagings?: Maybe<Array<BsdaPackaging>>;
  /** Quantité */
  quantity?: Maybe<BsdaQuantity>;
  /** Installation de destination */
  destination?: Maybe<BsdaDestination>;
  /** Entreprise de travaux */
  worker?: Maybe<BsdaWorker>;
  /** Entreprise de transport */
  transporter?: Maybe<BsdaTransporter>;
  /** Précedents BSDA associés, constituant l'historique de traçabilité */
  associations?: Maybe<Array<Maybe<BsdaAssociation>>>;
};

export enum BsdaAcceptationStatus {
  Accepted = "ACCEPTED",
  Refused = "REFUSED",
  PartiallyRefused = "PARTIALLY_REFUSED"
}

export type BsdaAssociation = {
  __typename?: "BsdaAssociation";
  id: Scalars["ID"];
  status: BsdaStatus;
};

export type BsdaCompanyWhere = {
  siret: Scalars["String"];
};

export type BsdaConnection = {
  __typename?: "BsdaConnection";
  totalCount: Scalars["Int"];
  pageInfo: PageInfo;
  edges: Array<BsdaEdge>;
};

export enum BsdaConsistence {
  Solide = "SOLIDE",
  Pulverulent = "PULVERULENT",
  Other = "OTHER"
}

export type BsdaDestination = {
  __typename?: "BsdaDestination";
  /** Établissement de destination */
  company?: Maybe<FormCompany>;
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars["String"]>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: Maybe<Scalars["String"]>;
  /** Expédition reçue à l'installation de destination */
  reception?: Maybe<BsdaReception>;
  /** Réalisation de l'opération (case 11) */
  operation?: Maybe<BsdaOperation>;
};

export type BsdaDestinationInput = {
  /** Établissement de destination */
  company?: Maybe<CompanyInput>;
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars["String"]>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: Maybe<Scalars["String"]>;
  /** Expédition reçue à l'installation de destination */
  reception?: Maybe<BsdaReceptionInput>;
  /** Réalisation de l'opération (case 11) */
  operation?: Maybe<BsdaOperationInput>;
};

export type BsdaDestinationWhere = {
  company?: Maybe<BsdaCompanyWhere>;
  operation?: Maybe<BsdaOperationWhere>;
};

export type BsdaEdge = {
  __typename?: "BsdaEdge";
  cursor: Scalars["String"];
  node: Bsda;
};

export type BsdaEmission = {
  __typename?: "BsdaEmission";
  signature?: Maybe<Signature>;
};

export type BsdaEmissionWhere = {
  signature?: Maybe<BsdaSignatureWhere>;
};

export type BsdaEmitter = {
  __typename?: "BsdaEmitter";
  /** Indique si le détenteur est un particulier ou une entreprise */
  isPrivateIndividual?: Maybe<Scalars["Boolean"]>;
  /** Établissement MOA/détenteur. Partiellement rempli si l'émetteur est en fait un particulier */
  company?: Maybe<FormCompany>;
  /** Informations chantier (si différente de l'adresse de l'entreprise) */
  worksite?: Maybe<BsdaWorksite>;
  /** Déclaration générale */
  emission?: Maybe<BsdaEmission>;
};

export type BsdaEmitterInput = {
  /** Indique si le détenteur est un particulier ou une entreprise */
  isPrivateIndividual?: Maybe<Scalars["Boolean"]>;
  /** Établissement MOA/détenteur. Partiellement rempli si l'émetteur est en fait un particulier */
  company?: Maybe<CompanyInput>;
  /** Informations chantier (si différente de l'adresse de l'entreprise) */
  worksite?: Maybe<BsdaWorksiteInput>;
};

export type BsdaEmitterWhere = {
  company?: Maybe<BsdaCompanyWhere>;
  emission?: Maybe<BsdaEmissionWhere>;
};

export type BsdaInput = {
  /**
   * Type de bordereau
   * Le type de bordereau impacte le workflow et les champs obligatoires
   */
  type?: Maybe<BsdaType>;
  /** Maitre d'ouvrage ou détenteur du déchet */
  emitter?: Maybe<BsdaEmitterInput>;
  /** Dénomination du déchet */
  waste?: Maybe<BsdaWasteInput>;
  /** Conditionnement */
  packagings?: Maybe<Array<BsdaPackagingInput>>;
  /** Quantité */
  quantity?: Maybe<BsdaQuantityInput>;
  /** Installation de destination */
  destination?: Maybe<BsdaDestinationInput>;
  /** Entreprise de travaux */
  worker?: Maybe<BsdaWorkerInput>;
  /** Entreprise de transport */
  transporter?: Maybe<BsdaTransporterInput>;
  /** Précédents bordereaux à associer à celui ci - cas du transit, entreposage provisoire ou groupement */
  associations?: Maybe<Array<Scalars["ID"]>>;
};

export type BsdaOperation = {
  __typename?: "BsdaOperation";
  /** Code D/R */
  code?: Maybe<Scalars["String"]>;
  /** Date de réalisation de l'opération */
  date?: Maybe<Scalars["DateTime"]>;
  signature?: Maybe<Signature>;
};

export type BsdaOperationInput = {
  /** Code D/R */
  code?: Maybe<Scalars["String"]>;
  /** Date de réalisation de l'opération */
  date?: Maybe<Scalars["DateTime"]>;
};

export type BsdaOperationWhere = {
  signature?: Maybe<BsdaSignatureWhere>;
};

export type BsdaPackaging = {
  __typename?: "BsdaPackaging";
  /** Type de conditionnement */
  type: BsdaPackagingType;
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars["String"]>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars["Int"];
};

export type BsdaPackagingInput = {
  /** Type de conditionnement */
  type?: Maybe<BsdaPackagingType>;
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars["String"]>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars["Int"];
};

export enum BsdaPackagingType {
  PaletteFilme = "PALETTE_FILME",
  BigBag = "BIG_BAG",
  DepotBag = "DEPOT_BAG",
  SacRenforce = "SAC_RENFORCE",
  BodyBenne = "BODY_BENNE",
  Other = "OTHER"
}

export type BsdaQuantity = {
  __typename?: "BsdaQuantity";
  /** Type de quantité (réelle ou estimé) */
  type?: Maybe<BsdaQuantityType>;
  /** Quantité en tonne */
  value?: Maybe<Scalars["Float"]>;
};

export type BsdaQuantityInput = {
  /** Type de quantité (réelle ou estimé) */
  type?: Maybe<BsdaQuantityType>;
  /** Quantité en tonne */
  value?: Maybe<Scalars["Float"]>;
};

export enum BsdaQuantityType {
  Real = "REAL",
  Estimated = "ESTIMATED"
}

export type BsdaRecepisse = {
  __typename?: "BsdaRecepisse";
  number?: Maybe<Scalars["String"]>;
  department?: Maybe<Scalars["String"]>;
  validityLimit?: Maybe<Scalars["DateTime"]>;
};

export type BsdaRecepisseInput = {
  number?: Maybe<Scalars["String"]>;
  department?: Maybe<Scalars["String"]>;
  validityLimit?: Maybe<Scalars["DateTime"]>;
};

export type BsdaReception = {
  __typename?: "BsdaReception";
  /** Date de présentation sur site */
  date?: Maybe<Scalars["DateTime"]>;
  /** Quantité présentée */
  quantity?: Maybe<BsdaQuantity>;
  /** Lot accepté, accepté partiellement ou refusé */
  acceptationStatus?: Maybe<BsdaAcceptationStatus>;
  /** Motif de refus */
  refusalReason?: Maybe<Scalars["String"]>;
  /** Signature case 10 */
  signature?: Maybe<Signature>;
};

export type BsdaReceptionInput = {
  /** Date de présentation sur site */
  date?: Maybe<Scalars["DateTime"]>;
  /** Quantité présentée */
  quantity?: Maybe<BsdaQuantityInput>;
  /** Lot accepté, accepté partiellement ou refusé */
  acceptationStatus?: Maybe<BsdaAcceptationStatus>;
  /** Motif de refus */
  refusalReason?: Maybe<Scalars["String"]>;
};

export type BsdaSignatureInput = {
  /** Type de signature apposé */
  type: BsdaSignatureType;
  /** Date de la signature */
  date?: Maybe<Scalars["DateTime"]>;
  /** Nom et prénom du signataire */
  author: Scalars["String"];
  /** Code de sécurité de l'entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel */
  securityCode?: Maybe<Scalars["Int"]>;
};

export enum BsdaSignatureType {
  Emission = "EMISSION",
  Work = "WORK",
  Transport = "TRANSPORT",
  Operation = "OPERATION"
}

export type BsdaSignatureWhere = {
  date: DateFilter;
};

/** Bordereau Bsdasri */
export type Bsdasri = {
  __typename?: "Bsdasri";
  id: Scalars["ID"];
  status: BsdasriStatus;
  createdAt?: Maybe<Scalars["DateTime"]>;
  updatedAt?: Maybe<Scalars["DateTime"]>;
  isDraft: Scalars["Boolean"];
  emitter?: Maybe<BsdasriEmitter>;
  emission?: Maybe<BsdasriEmission>;
  transporter?: Maybe<BsdasriTransporter>;
  transport?: Maybe<BsdasriTransport>;
  recipient?: Maybe<BsdasriRecipient>;
  reception?: Maybe<BsdasriReception>;
  operation?: Maybe<BsdasriOperation>;
  /** Bordereaux regroupés */
  regroupedBsdasris?: Maybe<Array<Scalars["ID"]>>;
  metadata: BsdasriMetadata;
};

export type BsdasriCompanyWhere = {
  siret: Scalars["String"];
};

export type BsdasriConnection = {
  __typename?: "BsdasriConnection";
  totalCount: Scalars["Int"];
  pageInfo: PageInfo;
  edges: Array<BsdasriEdge>;
};

export type BsdasriCreateInput = {
  emitter?: Maybe<BsdasriEmitterInput>;
  emission?: Maybe<BsdasriEmissionInput>;
  transporter?: Maybe<BsdasriTransporterInput>;
  transport?: Maybe<BsdasriTransportInput>;
  recipient?: Maybe<BsdasriRecipientInput>;
  reception?: Maybe<BsdasriReceptionInput>;
  operation?: Maybe<BsdasriOperationInput>;
  regroupedBsdasris?: Maybe<Array<Maybe<RegroupedBsdasriInput>>>;
};

export type BsdasriEdge = {
  __typename?: "BsdasriEdge";
  cursor: Scalars["String"];
  node: Bsdasri;
};

/** Informations relatives au déchet émis */
export type BsdasriEmission = {
  __typename?: "BsdasriEmission";
  wasteCode?: Maybe<Scalars["String"]>;
  wasteDetails?: Maybe<BsdasriEmissionWasteDetails>;
  handedOverAt?: Maybe<Scalars["DateTime"]>;
  signature?: Maybe<BsdasriSignature>;
  /** Emporté sans signature PRED avec son autorisation prélalable */
  isTakenOverWithoutEmitterSignature?: Maybe<Scalars["Boolean"]>;
  /** Signature PRED avec code de sécurité */
  isTakenOverWithSecretCode?: Maybe<Scalars["Boolean"]>;
};

export type BsdasriEmissionInput = {
  wasteCode?: Maybe<Scalars["String"]>;
  wasteDetails?: Maybe<BsdasriWasteDetailEmissionInput>;
  handedOverAt?: Maybe<Scalars["DateTime"]>;
};

/** Détail sur le déchet emis du Bsdasri */
export type BsdasriEmissionWasteDetails = {
  __typename?: "BsdasriEmissionWasteDetails";
  /** Quantité émise */
  quantity?: Maybe<BsdasriQuantity>;
  /** Volume en litres */
  volume?: Maybe<Scalars["Int"]>;
  packagingInfos?: Maybe<Array<BsdasriPackagingInfo>>;
  onuCode?: Maybe<Scalars["String"]>;
};

/** Émetteur du Bsdasri, Personne responsable de l'émimination des déchets (PRED) */
export type BsdasriEmitter = {
  __typename?: "BsdasriEmitter";
  /** Établissement émetteur */
  company?: Maybe<FormCompany>;
  /** Site d'emport du déceht, si différent de celle de l'émetteur */
  workSite?: Maybe<WorkSite>;
  /** Date de remise au tranporteur */
  handOverToTransporterAt?: Maybe<Scalars["DateTime"]>;
  /** Champ libre */
  customInfo?: Maybe<Scalars["String"]>;
  /** Type d'émetteur */
  type?: Maybe<BsdasriEmitterType>;
  /** Agit pour le compte de l'éco organisme agréé */
  onBehalfOfEcoorganisme: Scalars["Boolean"];
};

export type BsdasriEmitterInput = {
  /** Établissement émetteur */
  type?: Maybe<BsdasriEmitterType>;
  company?: Maybe<CompanyInput>;
  workSite?: Maybe<WorkSiteInput>;
  /** Champ libre émetteur */
  customInfo?: Maybe<Scalars["String"]>;
  onBehalfOfEcoorganisme?: Maybe<Scalars["Boolean"]>;
};

/** Type d'émetteur */
export enum BsdasriEmitterType {
  /** Producteur */
  Producer = "PRODUCER",
  /** Installation de regroupement */
  Collector = "COLLECTOR"
}

export type BsdasriEmitterWhere = {
  company?: Maybe<BsdasriCompanyWhere>;
  signature?: Maybe<BsdasriSignatureWhere>;
};

export type BsdasriError = {
  __typename?: "BsdasriError";
  message: Scalars["String"];
  path: Scalars["String"];
  requiredFor: Array<BsdasriSignatureType>;
};

export type BsdasriInput = {
  emitter?: Maybe<BsdasriEmitterInput>;
  emission?: Maybe<BsdasriEmissionInput>;
  transporter?: Maybe<BsdasriTransporterInput>;
  transport?: Maybe<BsdasriTransportInput>;
  recipient?: Maybe<BsdasriRecipientInput>;
  reception?: Maybe<BsdasriReceptionInput>;
  operation?: Maybe<BsdasriOperationInput>;
};

export type BsdasriMetadata = {
  __typename?: "BsdasriMetadata";
  errors: Array<Maybe<BsdasriError>>;
};

/** Informations relatives au traitement du Bsdasri */
export type BsdasriOperation = {
  __typename?: "BsdasriOperation";
  /** Quantité traitée */
  quantity?: Maybe<BsdasriOperationQuantity>;
  /** Code de l'opération de traitement */
  processingOperation?: Maybe<Scalars["String"]>;
  /** Date de l'opération de traitement */
  processedAt?: Maybe<Scalars["DateTime"]>;
  signature?: Maybe<BsdasriSignature>;
};

export type BsdasriOperationInput = {
  quantity?: Maybe<BsdasriQuantityInput>;
  processingOperation?: Maybe<Scalars["String"]>;
  processedAt?: Maybe<Scalars["DateTime"]>;
};

export type BsdasriOperationQuantity = {
  __typename?: "BsdasriOperationQuantity";
  /** Quantité en kg */
  value?: Maybe<Scalars["Int"]>;
};

/** Informations sur le conditionnement Bsdasri */
export type BsdasriPackagingInfo = {
  __typename?: "BsdasriPackagingInfo";
  /** Type de conditionnement */
  type: BsdasriPackagings;
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars["String"]>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars["Int"];
  volume: Scalars["Int"];
};

export type BsdasriPackagingInfoInput = {
  /** Type de conditionnement */
  type: BsdasriPackagings;
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars["String"]>;
  /** Volume de chaque colis associé à ce conditionnement */
  volume: Scalars["Int"];
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars["Int"];
};

/** Type de packaging du déchet */
export enum BsdasriPackagings {
  /** Caisse en carton avec sac en plastique */
  BoiteCarton = "BOITE_CARTON",
  /** Fûts ou jerrican à usage unique */
  Fut = "FUT",
  /** Boîtes et Mini-collecteurs pour déchets perforants */
  BoitePerforants = "BOITE_PERFORANTS",
  /** Grand emballage */
  GrandEmballage = "GRAND_EMBALLAGE",
  /** Grand récipient pour vrac */
  Grv = "GRV",
  /** Autre */
  Autre = "AUTRE"
}

export type BsdasriQuantity = {
  __typename?: "BsdasriQuantity";
  /** Quantité en kg */
  value?: Maybe<Scalars["Int"]>;
  /** Quantité réélle (pesée ou estimée) */
  type?: Maybe<QuantityType>;
};

export type BsdasriQuantityInput = {
  value?: Maybe<Scalars["Int"]>;
  type?: Maybe<QuantityType>;
};

/** Informations relatives à la réception du Bsdasri */
export type BsdasriReception = {
  __typename?: "BsdasriReception";
  wasteDetails?: Maybe<BsdasriReceptionWasteDetails>;
  wasteAcceptation?: Maybe<BsdasriWasteAcceptation>;
  receivedAt?: Maybe<Scalars["DateTime"]>;
  signature?: Maybe<BsdasriSignature>;
};

export type BsdasriReceptionInput = {
  wasteDetails?: Maybe<BsdasriRecipientWasteDetailInput>;
  receivedAt?: Maybe<Scalars["DateTime"]>;
  wasteAcceptation?: Maybe<BsdasriWasteAcceptationInput>;
};

/** Détail sur le déchet reçu du Bsdasri */
export type BsdasriReceptionWasteDetails = {
  __typename?: "BsdasriReceptionWasteDetails";
  volume?: Maybe<Scalars["Int"]>;
  packagingInfos?: Maybe<Array<BsdasriPackagingInfo>>;
};

/** Destinataire du Bsdasri */
export type BsdasriRecipient = {
  __typename?: "BsdasriRecipient";
  /** Installation destinataire */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars["String"]>;
};

export type BsdasriRecipientInput = {
  /** Établissement émetteur */
  company?: Maybe<CompanyInput>;
  /** Champ libre transporteur */
  customInfo?: Maybe<Scalars["String"]>;
};

export type BsdasriRecipientWasteDetailInput = {
  volume?: Maybe<Scalars["Int"]>;
  packagingInfos?: Maybe<Array<BsdasriPackagingInfoInput>>;
};

export type BsdasriRecipientWhere = {
  company?: Maybe<BsdasriCompanyWhere>;
  signature?: Maybe<BsdasriSignatureWhere>;
};

export enum BsdasriRole {
  /** Les Bsdasri dont je suis transporteur */
  Transporter = "TRANSPORTER",
  /** Les Bsdasri dont je suis la destination de traitement */
  Recipient = "RECIPIENT",
  /** Les Bsdasri dont je suis l'émetteur */
  Emitter = "EMITTER"
}

export type BsdasriSignature = {
  __typename?: "BsdasriSignature";
  date?: Maybe<Scalars["DateTime"]>;
  author?: Maybe<Scalars["String"]>;
};

export type BsdasriSignatureInput = {
  type: BsdasriSignatureType;
  author: Scalars["String"];
};

export enum BsdasriSignatureType {
  /** Signature du cadre émetteur (PRED) */
  Emission = "EMISSION",
  /** Signature du cadre collecteur transporteur */
  Transport = "TRANSPORT",
  /** Signature de la réception du déchet */
  Reception = "RECEPTION",
  /** Signature du traitement du déchet */
  Operation = "OPERATION"
}

export type BsdasriSignatureWhere = {
  date: DateFilter;
};

export type BsdasriSignatureWithSecretCodeInput = {
  author: Scalars["String"];
  securityCode?: Maybe<Scalars["Int"]>;
};

export enum BsdasriStatus {
  /** Bsdasri dans son état initial */
  Initial = "INITIAL",
  /** Optionnel, Bsdasri signé par la PRED (émetteur) */
  SignedByProducer = "SIGNED_BY_PRODUCER",
  /** Bsdasri envoyé vers l'établissement de destination */
  Sent = "SENT",
  /** Bsdasri reçu par l'établissement de destination */
  Received = "RECEIVED",
  /** Bsdasri dont les déchets ont été traités */
  Processed = "PROCESSED",
  /** Déchet refusé */
  Refused = "REFUSED"
}

/** Informations relatives au transport du Bsdasri */
export type BsdasriTransport = {
  __typename?: "BsdasriTransport";
  wasteDetails?: Maybe<BsdasriTransportWasteDetails>;
  wasteAcceptation?: Maybe<BsdasriWasteAcceptation>;
  handedOverAt?: Maybe<Scalars["DateTime"]>;
  takenOverAt?: Maybe<Scalars["DateTime"]>;
  signature?: Maybe<BsdasriSignature>;
  mode: TransportMode;
};

/** Collecteur transporteur */
export type BsdasriTransporter = {
  __typename?: "BsdasriTransporter";
  /** Établissement de destination */
  company?: Maybe<FormCompany>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars["String"]>;
  /** Département */
  receiptDepartment?: Maybe<Scalars["String"]>;
  /** Limite de validité du récipissé */
  receiptValidityLimit?: Maybe<Scalars["DateTime"]>;
  /** Champ libre */
  customInfo?: Maybe<Scalars["String"]>;
};

export type BsdasriTransporterInput = {
  /** Établissement collecteur - transporteur */
  company?: Maybe<CompanyInput>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars["String"]>;
  /** Département */
  receiptDepartment?: Maybe<Scalars["String"]>;
  /** Limite de validité du récipissé */
  receiptValidityLimit?: Maybe<Scalars["DateTime"]>;
  /** Champ libre transporteur */
  customInfo?: Maybe<Scalars["String"]>;
};

export type BsdasriTransporterWhere = {
  company?: Maybe<BsdasriCompanyWhere>;
  signature?: Maybe<BsdasriSignatureWhere>;
};

export type BsdasriTransportInput = {
  wasteDetails?: Maybe<BsdasriWasteDetailTransportInput>;
  takenOverAt?: Maybe<Scalars["DateTime"]>;
  handedOverAt?: Maybe<Scalars["DateTime"]>;
  wasteAcceptation?: Maybe<BsdasriWasteAcceptationInput>;
  mode?: Maybe<TransportMode>;
};

/** Détail sur le déchet transporté */
export type BsdasriTransportWasteDetails = {
  __typename?: "BsdasriTransportWasteDetails";
  /** Quantité transportée */
  quantity?: Maybe<BsdasriQuantity>;
  volume?: Maybe<Scalars["Int"]>;
  packagingInfos?: Maybe<Array<BsdasriPackagingInfo>>;
};

export type BsdasriUpdateInput = {
  emitter?: Maybe<BsdasriEmitterInput>;
  emission?: Maybe<BsdasriEmissionInput>;
  transporter?: Maybe<BsdasriTransporterInput>;
  transport?: Maybe<BsdasriTransportInput>;
  recipient?: Maybe<BsdasriRecipientInput>;
  reception?: Maybe<BsdasriReceptionInput>;
  operation?: Maybe<BsdasriOperationInput>;
  regroupedBsdasris?: Maybe<Array<Maybe<RegroupedBsdasriInput>>>;
};

/** Informations relatives à l'acceptation ou au refus du déchet (Bsdasri) */
export type BsdasriWasteAcceptation = {
  __typename?: "BsdasriWasteAcceptation";
  status?: Maybe<Scalars["String"]>;
  refusalReason?: Maybe<Scalars["String"]>;
  refusedQuantity?: Maybe<Scalars["Int"]>;
};

export type BsdasriWasteAcceptationInput = {
  status?: Maybe<WasteAcceptationStatusInput>;
  refusalReason?: Maybe<Scalars["String"]>;
  refusedQuantity?: Maybe<Scalars["Int"]>;
};

export type BsdasriWasteDetailEmissionInput = {
  quantity?: Maybe<BsdasriQuantityInput>;
  packagingInfos?: Maybe<Array<BsdasriPackagingInfoInput>>;
  onuCode?: Maybe<Scalars["String"]>;
};

export type BsdasriWasteDetailTransportInput = {
  quantity?: Maybe<BsdasriQuantityInput>;
  packagingInfos?: Maybe<Array<BsdasriPackagingInfoInput>>;
};

export type BsdasriWhere = {
  /** (Optionnel) Permet de récupérer uniquement les bordereaux en brouillon */
  isDraft?: Maybe<Scalars["Boolean"]>;
  /**
   * (Optionnel) Filtre sur le statut des bordereaux
   * Si aucun filtre n'est passé, les bordereaux seront retournés quel que soit leur statut
   * Défaut à vide.
   */
  status?: Maybe<BsdasriStatus>;
  createdAt?: Maybe<DateFilter>;
  updatedAt?: Maybe<DateFilter>;
  emitter?: Maybe<BsdasriEmitterWhere>;
  transporter?: Maybe<BsdasriTransporterWhere>;
  recipient?: Maybe<BsdasriRecipientWhere>;
  processingOperation?: Maybe<Array<ProcessingOperationTypes>>;
  /**
   * (Optionnel) Filtre sur l'état de regroupement des bordereaux
   * Si aucun filtre n'est passé, les bordereaux seront retournés sans filtrage supplémentaire
   * Si groupable: true, les bordereaux retournés ne sont pas déjà regroupés et ne regroupent pas d'autres bordereaux
   * Si groupable: false, les bordereaux retournés ne sont déjà regroupés ou ne regroupent d'autres bordereaux
   */
  groupable?: Maybe<Scalars["Boolean"]>;
  _and?: Maybe<Array<BsdasriWhere>>;
  _or?: Maybe<Array<BsdasriWhere>>;
  _not?: Maybe<Array<BsdasriWhere>>;
};

export enum BsdaStatus {
  Initial = "INITIAL",
  SignedByProducer = "SIGNED_BY_PRODUCER",
  SignedByWorker = "SIGNED_BY_WORKER",
  Sent = "SENT",
  Processed = "PROCESSED",
  Refused = "REFUSED",
  AwaitingChild = "AWAITING_CHILD"
}

export type BsdaTransport = {
  __typename?: "BsdaTransport";
  signature?: Maybe<Signature>;
};

export type BsdaTransporter = {
  __typename?: "BsdaTransporter";
  /** Coordonnées de l'entreprise de transport */
  company?: Maybe<FormCompany>;
  /** Récépissé transporteur */
  recepisse?: Maybe<BsdaRecepisse>;
  /** Déclaration générale */
  transport?: Maybe<BsdaTransport>;
};

export type BsdaTransporterInput = {
  /** Entreprise de transport */
  company?: Maybe<CompanyInput>;
  recepisse?: Maybe<BsdaRecepisseInput>;
};

export type BsdaTransporterWhere = {
  company?: Maybe<BsdaCompanyWhere>;
  transport?: Maybe<BsdaTransportWhere>;
};

export type BsdaTransportWhere = {
  signature?: Maybe<BsdaSignatureWhere>;
};

/**
 * 4 types de bordereaux possibles:
 *   - Collecte dans un établissement 2710-1 (déchetterie)
 *   - Autres collectes
 *   - Regroupement
 *   - Ré-expédition
 */
export enum BsdaType {
  Collection_2710 = "COLLECTION_2710",
  OtherCollections = "OTHER_COLLECTIONS",
  Gathering = "GATHERING",
  Reshipment = "RESHIPMENT"
}

export type BsdaWaste = {
  __typename?: "BsdaWaste";
  /** Rubrique Déchet */
  code?: Maybe<Scalars["String"]>;
  /** Dénomination usuelle */
  name?: Maybe<Scalars["String"]>;
  /** Code famille */
  familyCode?: Maybe<Scalars["String"]>;
  /** Nom du matériau */
  materialName?: Maybe<Scalars["String"]>;
  /** Consistence */
  consistence?: Maybe<BsdaConsistence>;
  /** Numéros de scellés */
  sealNumbers?: Maybe<Array<Scalars["String"]>>;
  /** Mention ADR */
  adr?: Maybe<Scalars["String"]>;
};

export type BsdaWasteInput = {
  /** Rubrique Déchet */
  code?: Maybe<Scalars["String"]>;
  /** Dénomination usuelle */
  name?: Maybe<Scalars["String"]>;
  /** Code famille */
  familyCode?: Maybe<Scalars["String"]>;
  /** Nom du matériau */
  materialName?: Maybe<Scalars["String"]>;
  /** Consistence */
  consistence?: Maybe<BsdaConsistence>;
  /** Numéros de scellés */
  sealNumbers?: Maybe<Array<Scalars["String"]>>;
  /** Mention ADR */
  adr?: Maybe<Scalars["String"]>;
};

export type BsdaWhere = {
  isDraft?: Maybe<Scalars["Boolean"]>;
  status?: Maybe<BsdaStatus>;
  createdAt?: Maybe<DateFilter>;
  updatedAt?: Maybe<DateFilter>;
  emitter?: Maybe<BsdaEmitterWhere>;
  worker?: Maybe<BsdaWorkerWhere>;
  transporter?: Maybe<BsdaTransporterWhere>;
  destination?: Maybe<BsdaDestinationWhere>;
  _and?: Maybe<Array<BsdaWhere>>;
  _or?: Maybe<Array<BsdaWhere>>;
  _not?: Maybe<Array<BsdaWhere>>;
};

export type BsdaWork = {
  __typename?: "BsdaWork";
  /**
   * Indique si l'entreprise de travaux a une signature papier du MOA/détenteur du déchet
   * Remettre une signature papier permet au détenteur de ne pas à avoir à signer sur la plateforme
   */
  hasEmitterPaperSignature?: Maybe<Scalars["Boolean"]>;
  signature?: Maybe<Signature>;
};

export type BsdaWorker = {
  __typename?: "BsdaWorker";
  /** Entreprise de travaux */
  company?: Maybe<FormCompany>;
  /** Déclaration générale */
  work?: Maybe<BsdaWork>;
};

export type BsdaWorkerInput = {
  /** Entreprise de travaux */
  company?: Maybe<CompanyInput>;
  /** Déclaration générale */
  work?: Maybe<BsdaWorkInput>;
};

export type BsdaWorkerWhere = {
  company?: Maybe<BsdaCompanyWhere>;
  work?: Maybe<BsdaWorkWhere>;
};

export type BsdaWorkInput = {
  /**
   * Indique si l'entreprise de travaux a une signature papier du MOA/détenteur du déchet
   * Remettre une signature papier permet au détenteur de ne pas à avoir à signer sur la plateforme
   */
  hasEmitterPaperSignature?: Maybe<Scalars["Boolean"]>;
};

export type BsdaWorksite = {
  __typename?: "BsdaWorksite";
  name?: Maybe<Scalars["String"]>;
  address?: Maybe<Scalars["String"]>;
  city?: Maybe<Scalars["String"]>;
  postalCode?: Maybe<Scalars["String"]>;
  /** Autres informations, notamment le code chantier */
  infos?: Maybe<Scalars["String"]>;
};

export type BsdaWorksiteInput = {
  name?: Maybe<Scalars["String"]>;
  address?: Maybe<Scalars["String"]>;
  city?: Maybe<Scalars["String"]>;
  postalCode?: Maybe<Scalars["String"]>;
  /** Autres informations, notamment le code chantier */
  infos?: Maybe<Scalars["String"]>;
};

export type BsdaWorkWhere = {
  signature?: Maybe<BsdaSignatureWhere>;
};

export type BsdConnection = {
  __typename?: "BsdConnection";
  totalCount: Scalars["Int"];
  pageInfo: PageInfo;
  edges: Array<BsdEdge>;
};

export type BsdEdge = {
  __typename?: "BsdEdge";
  cursor: Scalars["String"];
  node: Bsd;
};

export enum BsdType {
  Bsdd = "BSDD",
  Bsdasri = "BSDASRI",
  Bsvhu = "BSVHU",
  Bsda = "BSDA"
}

export type BsdWhere = {
  readableId?: Maybe<Scalars["String"]>;
  emitter?: Maybe<Scalars["String"]>;
  recipient?: Maybe<Scalars["String"]>;
  waste?: Maybe<Scalars["String"]>;
  types?: Maybe<Array<BsdType>>;
  isDraftFor?: Maybe<Array<Scalars["String"]>>;
  isForActionFor?: Maybe<Array<Scalars["String"]>>;
  isFollowFor?: Maybe<Array<Scalars["String"]>>;
  isArchivedFor?: Maybe<Array<Scalars["String"]>>;
  isToCollectFor?: Maybe<Array<Scalars["String"]>>;
  isCollectedFor?: Maybe<Array<Scalars["String"]>>;
};

export type Bsff = {
  __typename?: "Bsff";
  /**
   * Identifiant unique assigné par Trackdéchets.
   * Il est à utiliser pour les échanges avec l'API.
   */
  id: Scalars["ID"];
  /**
   * Émetteur du déchet, qui n'est pas nécessairement le producteur.
   * Il s'agit par exemple de l'opérateur ayant collecté des fluides lors d'interventions,
   * ou alors d'une installation de collecte qui procède à la réexpédition pour traitement final.
   */
  emitter?: Maybe<BsffEmitter>;
  /** Liste des contenants utilisés pour le transport des fluides. */
  packagings: Array<BsffPackaging>;
  /** Description du déchet et ses mentions associées. */
  waste?: Maybe<BsffWaste>;
  /** Quantité totale du déchet, qu'elle soit réelle ou estimée. */
  quantity?: Maybe<BsffQuantity>;
  /**
   * Transporteur du déchet, effectue l'enlèvement du déchet auprès de l'émetteur et vers la destination.
   * À noter que l'émetteur peut également être transporteur,
   * par exemple dans le cas de l'opérateur qui dépose lui même ses contenants auprès d'une installation de collecte.
   */
  transporter?: Maybe<BsffTransporter>;
  /**
   * Destination du déchet, qui peut le réceptionner pour traitement, regroupement, reconditionnement ou réexpedition.
   * Un nouveau bordereau doit être créé si le déchet connaît un nouveau parcours,
   * par exemple si il quitte une installation de collecte pour un centre de traitement.
   */
  destination?: Maybe<BsffDestination>;
  /**
   * Liste des fiches d'intervention associés à ce bordereau.
   * Habituellement renseigné par un opérateur lors de son intervention.
   */
  ficheInterventions: Array<BsffFicheIntervention>;
  /** Liste des bordereaux que celui-ci regroupe, dans le cas d'un regroupement, reconditionnement ou d'une réexpédition. */
  bsffs: Array<Bsff>;
};

/** Résultats de bordereaux paginés. */
export type BsffConnection = {
  __typename?: "BsffConnection";
  totalCount: Scalars["Int"];
  pageInfo: PageInfo;
  edges: Array<BsffEdge>;
};

export type BsffDestination = {
  __typename?: "BsffDestination";
  /** Entreprise réceptionant le déchet. */
  company: FormCompany;
  /** Déclaration de réception du déchet. */
  reception?: Maybe<BsffReception>;
  /** Déclaration de traitement du déchet. */
  operation?: Maybe<BsffOperation>;
  /** Opération de traitement prévu initialement. */
  plannedOperation: BsffPlannedOperation;
  /** Numéro CAP. */
  cap?: Maybe<Scalars["String"]>;
};

export type BsffDestinationInput = {
  company: CompanyInput;
  cap?: Maybe<Scalars["String"]>;
  reception?: Maybe<BsffDestinationReceptionInput>;
  plannedOperation?: Maybe<BsffDestinationPlannedOperationInput>;
  operation?: Maybe<BsffDestinationOperationInput>;
};

export type BsffDestinationOperationInput = {
  code: BsffOperationCode;
  qualification: BsffOperationQualification;
  nextDestination?: Maybe<BsffOperationNextDestinationInput>;
};

export type BsffDestinationPlannedOperationInput = {
  code: BsffOperationCode;
  qualification: BsffOperationQualification;
};

export type BsffDestinationReceptionInput = {
  date: Scalars["DateTime"];
  kilos: Scalars["Float"];
  refusal?: Maybe<Scalars["String"]>;
};

export type BsffEdge = {
  __typename?: "BsffEdge";
  cursor: Scalars["String"];
  node: Bsff;
};

export type BsffEmission = {
  __typename?: "BsffEmission";
  /** Signature de l'émetteur lors de l'enlèvement par le transporteur. */
  signature: Signature;
};

export type BsffEmitter = {
  __typename?: "BsffEmitter";
  /** Entreprise émettant le déchet. */
  company: FormCompany;
  /** Déclaration de l'émetteur lors de l'enlèvement par le transporteur. */
  emission?: Maybe<BsffEmission>;
};

export type BsffEmitterInput = {
  company: CompanyInput;
};

export type BsffFicheIntervention = {
  __typename?: "BsffFicheIntervention";
  /** Numéro de la fiche d'intervention, habituellement renseigné par l'opérateur. */
  numero: Scalars["String"];
  /** Poids total des fluides récupérés lors de cette intervention. */
  kilos: Scalars["Float"];
  /**
   * Détenteur de l'équipement sur lequel est intervenu l'opérateur.
   * À noter que dû à la valeur commerciale de ces informations, leur visibilité est limité aux acteurs en contact direct.
   */
  owner?: Maybe<BsffOwner>;
  /** Code postal du lieu où l'intervention a eu lieu. */
  postalCode: Scalars["String"];
};

export type BsffFicheInterventionInput = {
  kilos: Scalars["Float"];
  owner: BsffOwnerInput;
  postalCode: Scalars["String"];
};

export type BsffInput = {
  emitter?: Maybe<BsffEmitterInput>;
  packagings?: Maybe<Array<BsffPackagingInput>>;
  waste?: Maybe<BsffWasteInput>;
  quantity?: Maybe<BsffQuantityInput>;
  transporter?: Maybe<BsffTransporterInput>;
  destination?: Maybe<BsffDestinationInput>;
  bsffs?: Maybe<Array<Scalars["ID"]>>;
};

export type BsffNextDestination = {
  __typename?: "BsffNextDestination";
  company: FormCompany;
};

export type BsffOperation = {
  __typename?: "BsffOperation";
  /** Code de l'opération de traitement. */
  code?: Maybe<BsffOperationCode>;
  /** Qualification plus précise du type d'opération réalisée. */
  qualification: BsffOperationQualification;
  /** Destination ultérieure prévue, dans le cas d'un envoi vers l'étranger. */
  nextDestination?: Maybe<BsffNextDestination>;
  /** Signature de la destination lors du traitement. */
  signature?: Maybe<Signature>;
};

/** Liste des codes de traitement possible. */
export enum BsffOperationCode {
  R2 = "R2",
  R12 = "R12",
  D10 = "D10",
  D13 = "D13",
  D14 = "D14"
}

export type BsffOperationNextDestinationInput = {
  company: CompanyInput;
};

/**
 * Liste des qualifications de traitement possible.
 * Attention, certaines combinaisons de code et qualification ne sont pas possibles.
 * Par exemple, seul le code D 10 peut être associé à une incinération.
 */
export enum BsffOperationQualification {
  RecuperationRegeneration = "RECUPERATION_REGENERATION",
  Incineration = "INCINERATION",
  Groupement = "GROUPEMENT",
  Reconditionnement = "RECONDITIONNEMENT",
  Reexpedition = "REEXPEDITION"
}

export type BsffOwner = {
  __typename?: "BsffOwner";
  /** Entreprise détentrice de l'équipement. */
  company: FormCompany;
};

export type BsffOwnerInput = {
  company: CompanyInput;
};

export type BsffPackaging = {
  __typename?: "BsffPackaging";
  /** Numéro du contenant. */
  numero: Scalars["String"];
  /** Type de contenant. */
  type: BsffPackagingType;
  /** Volume en litres des fluides à l'intérieur du contenant. */
  litres: Scalars["Float"];
};

export type BsffPackagingInput = {
  numero: Scalars["String"];
  type: BsffPackagingType;
  litres: Scalars["Float"];
};

export enum BsffPackagingType {
  Bouteille = "BOUTEILLE"
}

export type BsffPlannedOperation = {
  __typename?: "BsffPlannedOperation";
  /** Code de l'opération de traitement prévu. */
  code?: Maybe<BsffOperationCode>;
  /** Qualification plus précise du type d'opération prévu. */
  qualification: BsffOperationQualification;
};

export type BsffQuantity = {
  __typename?: "BsffQuantity";
  /** Poids total du déchet en kilos. */
  kilos: Scalars["Float"];
  /** Si il s'agit d'une estimation ou d'un poids réel. */
  isEstimate: Scalars["Boolean"];
};

export type BsffQuantityInput = {
  kilos: Scalars["Float"];
  isEstimate: Scalars["Boolean"];
};

export type BsffReception = {
  __typename?: "BsffReception";
  /** Date de réception du déchet. */
  date: Scalars["DateTime"];
  /** Quantité totale du déchet, qu'elle soit réelle ou estimée. */
  kilos: Scalars["Float"];
  /** En cas de refus, le motif. */
  refusal?: Maybe<Scalars["String"]>;
  /** Signature de la destination lors de l'acceptation ou du refus du déchet. */
  signature?: Maybe<Signature>;
};

export enum BsffSignatureType {
  Emission = "EMISSION",
  Transport = "TRANSPORT",
  Reception = "RECEPTION",
  Operation = "OPERATION"
}

export type BsffTransport = {
  __typename?: "BsffTransport";
  /** Mode de transport utilisé. */
  mode: TransportMode;
  /** Signature du transporteur lors de l'enlèvement auprès de l'émetteur. */
  signature: Signature;
};

export type BsffTransporter = {
  __typename?: "BsffTransporter";
  /** Entreprise responsable du transport du déchet. */
  company: FormCompany;
  /** Récépissé du transporteur, à moins d'être exempté. */
  recepisse?: Maybe<BsffTransporterRecepisse>;
  /** Déclaration du transporteur lors de l'enlèvement auprès de l'émetteur. */
  transport?: Maybe<BsffTransport>;
};

export type BsffTransporterInput = {
  company: CompanyInput;
  recepisse?: Maybe<BsffTransporterRecepisseInput>;
  transport?: Maybe<BsffTransporterTransportInput>;
};

export type BsffTransporterRecepisse = {
  __typename?: "BsffTransporterRecepisse";
  /** Numéro du récépissé. */
  number: Scalars["String"];
  /** Département auquel est lié le récépissé. */
  department: Scalars["String"];
  /** Date limite de validité du récépissé. */
  validityLimit: Scalars["DateTime"];
};

export type BsffTransporterRecepisseInput = {
  number: Scalars["String"];
  department: Scalars["String"];
  validityLimit: Scalars["DateTime"];
};

export type BsffTransporterTransportInput = {
  mode: TransportMode;
};

export type BsffWaste = {
  __typename?: "BsffWaste";
  /** Code déchet. */
  code: Scalars["String"];
  /** Nature du fluide, laisser vide lorsqu'il est inconnu. */
  nature?: Maybe<Scalars["String"]>;
  /** Description du déchet, permet de le qualifier de façon plus précise. */
  description: Scalars["String"];
  /** Mention ADR. */
  adr: Scalars["String"];
};

export type BsffWasteInput = {
  code: Scalars["String"];
  nature?: Maybe<Scalars["String"]>;
  description: Scalars["String"];
  adr: Scalars["String"];
};

/** Filtres possibles pour la récupération de bordereaux. */
export type BsffWhere = {
  /** Filtrer sur le champ emitter. */
  emitter?: Maybe<BsffWhereEmitter>;
  /** Filtrer sur le champ transporter. */
  transporter?: Maybe<BsffWhereTransporter>;
  /** Filtrer sur le champ destination. */
  destination?: Maybe<BsffWhereDestination>;
};

/** Filtres sur une entreprise. */
export type BsffWhereCompany = {
  siret: Scalars["String"];
};

/** Champs possible pour le filtre sur destination. */
export type BsffWhereDestination = {
  company?: Maybe<BsffWhereCompany>;
  operation?: Maybe<BsffWhereOperation>;
};

/** Champs possible pour le filtre sur l'emitter. */
export type BsffWhereEmitter = {
  company?: Maybe<BsffWhereCompany>;
};

/** Champs possible pour le filtre sur l'opération. */
export type BsffWhereOperation = {
  code?: Maybe<BsffOperationCode>;
  qualification?: Maybe<BsffOperationQualification>;
};

/** Champs possible pour le filtre sur transporter. */
export type BsffWhereTransporter = {
  company?: Maybe<BsffWhereCompany>;
};

export type Bsvhu = {
  __typename?: "Bsvhu";
  /** Numéro unique attribué par Trackdéchets */
  id: Scalars["ID"];
  /** Date de création */
  createdAt: Scalars["DateTime"];
  /** Date de dernière modification */
  updatedAt: Scalars["DateTime"];
  /** Indique si le bordereau est à l'état de brouillon */
  isDraft: Scalars["Boolean"];
  /** Status du bordereau */
  status: BsvhuStatus;
  /** Émetteur du bordereau */
  emitter?: Maybe<BsvhuEmitter>;
  /** Code déchet. Presque toujours 16 01 06 */
  wasteCode?: Maybe<Scalars["String"]>;
  /** Conditionnement du déchet */
  packaging?: Maybe<BsvhuPackaging>;
  /** Identification des VHUs */
  identification?: Maybe<BsvhuIdentification>;
  /** Quantité de VHUs */
  quantity?: Maybe<BsvhuQuantity>;
  /** Destinataire du bordereau */
  destination?: Maybe<BsvhuDestination>;
  /** Transporteur */
  transporter?: Maybe<BsvhuTransporter>;
  metadata: BsvhuMetadata;
};

export enum BsvhuAcceptationStatus {
  Accepted = "ACCEPTED",
  Refused = "REFUSED",
  PartiallyRefused = "PARTIALLY_REFUSED"
}

export type BsvhuCompanyWhere = {
  siret: Scalars["String"];
};

export type BsvhuConnection = {
  __typename?: "BsvhuConnection";
  totalCount: Scalars["Int"];
  pageInfo: PageInfo;
  edges: Array<BsvhuEdge>;
};

export type BsvhuDestination = {
  __typename?: "BsvhuDestination";
  /** Type de receveur: broyeur ou second centre VHU */
  type?: Maybe<BsvhuDestinationType>;
  /** Numéro d'agrément de receveur */
  agrementNumber?: Maybe<Scalars["String"]>;
  /** Coordonnées de l'entreprise qui recoit les déchets */
  company?: Maybe<FormCompany>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: Maybe<Scalars["String"]>;
  /** Informations de réception */
  reception?: Maybe<BsvhuReception>;
  /** Informations sur l'opétation de traitement */
  operation?: Maybe<BsvhuOperation>;
};

export type BsvhuDestinationInput = {
  /** Type de receveur: broyeur ou second centre VHU */
  type?: Maybe<BsvhuDestinationType>;
  /** Numéro d'agrément de receveur */
  agrementNumber?: Maybe<Scalars["String"]>;
  /** Coordonnées de l'entreprise qui recoit les déchets */
  company?: Maybe<CompanyInput>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: Maybe<Scalars["String"]>;
  /** Informations de réception */
  reception?: Maybe<BsvhuReceptionInput>;
  /** Informations sur l'opétation de traitement */
  operation?: Maybe<BsvhuOperationInput>;
};

export enum BsvhuDestinationType {
  Broyeur = "BROYEUR",
  Demolisseur = "DEMOLISSEUR"
}

export type BsvhuDestinationWhere = {
  company?: Maybe<BsvhuCompanyWhere>;
  operation?: Maybe<BsvhuOperationWhere>;
};

export type BsvhuEdge = {
  __typename?: "BsvhuEdge";
  cursor: Scalars["String"];
  node: Bsvhu;
};

export type BsvhuEmission = {
  __typename?: "BsvhuEmission";
  signature?: Maybe<Signature>;
};

export type BsvhuEmissionWhere = {
  signature?: Maybe<BsvhuSignatureWhere>;
};

export type BsvhuEmitter = {
  __typename?: "BsvhuEmitter";
  /** Numéro d'agrément émetteur */
  agrementNumber?: Maybe<Scalars["String"]>;
  /** Coordonnées de l'entreprise émétrice */
  company?: Maybe<FormCompany>;
  /** Déclaration générale de l'émetteur du bordereau */
  emission?: Maybe<BsvhuEmission>;
};

export type BsvhuEmitterInput = {
  /** Numéro d'agrément émetteur */
  agrementNumber?: Maybe<Scalars["String"]>;
  /** Coordonnées de l'entreprise émétrice */
  company?: Maybe<CompanyInput>;
};

export type BsvhuEmitterWhere = {
  company?: Maybe<BsvhuCompanyWhere>;
  emission?: Maybe<BsvhuEmissionWhere>;
};

export type BsvhuError = {
  __typename?: "BsvhuError";
  message: Scalars["String"];
  path: Scalars["String"];
  requiredFor: SignatureTypeInput;
};

export type BsvhuIdentification = {
  __typename?: "BsvhuIdentification";
  numbers?: Maybe<Array<Maybe<Scalars["String"]>>>;
  type?: Maybe<BsvhuIdentificationType>;
};

export type BsvhuIdentificationInput = {
  /** Numéros d'identification */
  numbers?: Maybe<Array<Maybe<Scalars["String"]>>>;
  /** Type de numéros d'indentification */
  type?: Maybe<BsvhuIdentificationType>;
};

export enum BsvhuIdentificationType {
  NumeroOrdreRegistrePolice = "NUMERO_ORDRE_REGISTRE_POLICE",
  NumeroOrdreLotsSortants = "NUMERO_ORDRE_LOTS_SORTANTS"
}

export type BsvhuInput = {
  /** Détails sur l'émetteur */
  emitter?: Maybe<BsvhuEmitterInput>;
  /** Code déchet. Presque toujours 16 01 06 */
  wasteCode?: Maybe<Scalars["String"]>;
  /** Conditionnement du déchet */
  packaging?: Maybe<BsvhuPackaging>;
  /** Identification des VHUs */
  identification?: Maybe<BsvhuIdentificationInput>;
  /** Quantité de VHUs */
  quantity?: Maybe<BsvhuQuantityInput>;
  /** Détails sur la destination */
  destination?: Maybe<BsvhuDestinationInput>;
  /** Détails sur le transporteur */
  transporter?: Maybe<BsvhuTransporterInput>;
};

export type BsvhuMetadata = {
  __typename?: "BsvhuMetadata";
  errors: Array<BsvhuError>;
};

export type BsvhuNextDestination = {
  __typename?: "BsvhuNextDestination";
  company?: Maybe<FormCompany>;
};

export type BsvhuNextDestinationInput = {
  company?: Maybe<CompanyInput>;
};

export type BsvhuOperation = {
  __typename?: "BsvhuOperation";
  /** Date de réalisation */
  date?: Maybe<Scalars["DateTime"]>;
  /** Opération de traitement réalisée (R4 ou R12) */
  code?: Maybe<Scalars["String"]>;
  /** Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU */
  nextDestination?: Maybe<BsvhuNextDestination>;
  signature?: Maybe<Signature>;
};

export type BsvhuOperationInput = {
  /** Date de réalisation */
  date?: Maybe<Scalars["DateTime"]>;
  /** Opération de traitement réalisée (R4 ou R12) */
  code?: Maybe<Scalars["String"]>;
  /** Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU */
  nextDestination?: Maybe<BsvhuNextDestinationInput>;
};

export type BsvhuOperationWhere = {
  signature?: Maybe<BsvhuSignatureWhere>;
};

export enum BsvhuPackaging {
  Unite = "UNITE",
  Lot = "LOT"
}

export type BsvhuQuantity = {
  __typename?: "BsvhuQuantity";
  number?: Maybe<Scalars["Int"]>;
  tons?: Maybe<Scalars["Float"]>;
};

export type BsvhuQuantityInput = {
  /** Quantité en nombre (nombre de lots ou nombre de numéros d'ordre) */
  number?: Maybe<Scalars["Int"]>;
  /** Quantité en tonnes */
  tons?: Maybe<Scalars["Float"]>;
};

export type BsvhuRecepisse = {
  __typename?: "BsvhuRecepisse";
  number?: Maybe<Scalars["String"]>;
  department?: Maybe<Scalars["String"]>;
  validityLimit?: Maybe<Scalars["DateTime"]>;
};

export type BsvhuRecepisseInput = {
  number?: Maybe<Scalars["String"]>;
  department?: Maybe<Scalars["String"]>;
  validityLimit?: Maybe<Scalars["DateTime"]>;
};

export type BsvhuReception = {
  __typename?: "BsvhuReception";
  /** Date de présentation sur site */
  date?: Maybe<Scalars["DateTime"]>;
  /** Quantité réelle reçue */
  quantity?: Maybe<BsvhuQuantity>;
  /** Lot accepté oui/non */
  acceptationStatus?: Maybe<BsvhuAcceptationStatus>;
  /** Motif de refus */
  refusalReason?: Maybe<Scalars["String"]>;
  /** Identification éventuelle des VHU à la reception (numéro de lots ou d'ordre) */
  identification?: Maybe<BsvhuIdentification>;
};

export type BsvhuReceptionInput = {
  /** Date de présentation sur site */
  date?: Maybe<Scalars["DateTime"]>;
  /** Quantité réelle reçue */
  quantity?: Maybe<BsvhuQuantityInput>;
  /** Lot accepté oui/non */
  acceptationStatus?: Maybe<WasteAcceptationStatusInput>;
  /** Motif de refus */
  refusalReason?: Maybe<Scalars["String"]>;
  /** Identification éventuelle des VHU à la reception (numéro de lots ou d'ordre) */
  identification?: Maybe<BsvhuIdentificationInput>;
};

export type BsvhuSignatureInput = {
  /** Type de signature apposé */
  type: SignatureTypeInput;
  /** Date de la signature */
  date?: Maybe<Scalars["DateTime"]>;
  /** Nom et prénom du signataire */
  author: Scalars["String"];
  /** Code de sécurité de l'entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel */
  securityCode?: Maybe<Scalars["Int"]>;
};

export type BsvhuSignatureWhere = {
  date: DateFilter;
};

export enum BsvhuStatus {
  Initial = "INITIAL",
  SignedByProducer = "SIGNED_BY_PRODUCER",
  Sent = "SENT",
  Processed = "PROCESSED",
  Refused = "REFUSED"
}

export type BsvhuTransport = {
  __typename?: "BsvhuTransport";
  /** Date de prise en charge */
  takenOverAt?: Maybe<Scalars["DateTime"]>;
  signature?: Maybe<Signature>;
};

export type BsvhuTransporter = {
  __typename?: "BsvhuTransporter";
  /** Coordonnées de l'entreprise de transport */
  company?: Maybe<FormCompany>;
  /** Récépissé transporteur */
  recepisse?: Maybe<BsvhuRecepisse>;
  /** Informations liés au transport */
  transport?: Maybe<BsvhuTransport>;
};

export type BsvhuTransporterInput = {
  /** Coordonnées de l'entreprise de transport */
  company?: Maybe<CompanyInput>;
  /** Récépissé transporteur */
  recepisse?: Maybe<BsvhuRecepisseInput>;
  /** Informations liés au transport */
  transport?: Maybe<BsvhuTransportInput>;
};

export type BsvhuTransporterWhere = {
  company?: Maybe<BsvhuCompanyWhere>;
  transport?: Maybe<BsvhuTransportWhere>;
};

export type BsvhuTransportInput = {
  /** Date de prise en charge */
  takenOverAt?: Maybe<Scalars["DateTime"]>;
};

export type BsvhuTransportWhere = {
  signature?: Maybe<BsvhuSignatureWhere>;
};

export type BsvhuWhere = {
  /** (Optionnel) Permet de récupérer uniquement les bordereaux en brouillon */
  isDraft?: Maybe<Scalars["Boolean"]>;
  /**
   * (Optionnel) Filtre sur le statut des bordereaux
   * Si aucun filtre n'est passé, les bordereaux seront retournés quel que soit leur statut
   * Défaut à vide.
   */
  status?: Maybe<BsvhuStatus>;
  createdAt?: Maybe<DateFilter>;
  updatedAt?: Maybe<DateFilter>;
  emitter?: Maybe<BsvhuEmitterWhere>;
  transporter?: Maybe<BsvhuTransporterWhere>;
  destination?: Maybe<BsvhuDestinationWhere>;
  _and?: Maybe<Array<BsvhuWhere>>;
  _or?: Maybe<Array<BsvhuWhere>>;
  _not?: Maybe<Array<BsvhuWhere>>;
};

/**
 * Information sur établissement accessible dans la liste des favoris
 * La liste des favoris est constituée à partir de l'historique des
 * BSD édités
 */
export type CompanyFavorite = {
  __typename?: "CompanyFavorite";
  /** Nom de l'établissement */
  name?: Maybe<Scalars["String"]>;
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars["String"]>;
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /** Nom du contact */
  contact?: Maybe<Scalars["String"]>;
  /** Numéro de téléphone */
  phone?: Maybe<Scalars["String"]>;
  /** Email de contact */
  mail?: Maybe<Scalars["String"]>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé courtier associé à cet établissement (le cas échant) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
};

export type CompanyForVerification = {
  __typename?: "CompanyForVerification";
  id: Scalars["ID"];
  siret: Scalars["String"];
  name: Scalars["String"];
  companyTypes: Array<CompanyType>;
  createdAt: Scalars["DateTime"];
  verificationStatus: CompanyVerificationStatus;
  verificationComment?: Maybe<Scalars["String"]>;
  verificationMode?: Maybe<CompanyVerificationMode>;
  verifiedAt?: Maybe<Scalars["DateTime"]>;
  admin?: Maybe<AdminForVerification>;
};

export type CompanyForVerificationConnection = {
  __typename?: "CompanyForVerificationConnection";
  totalCount: Scalars["Int"];
  companies: Array<CompanyForVerification>;
};

export type CompanyForVerificationWhere = {
  verificationStatus?: Maybe<CompanyVerificationStatus>;
};

/** Payload d'un établissement */
export type CompanyInput = {
  /** SIRET de l'établissement composé de 14 caractères numériques */
  siret?: Maybe<Scalars["String"]>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars["String"]>;
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /** Nom du contact dans l'établissement */
  contact?: Maybe<Scalars["String"]>;
  /** Email du contact dans l'établissement */
  mail?: Maybe<Scalars["String"]>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone?: Maybe<Scalars["String"]>;
  /** Numéro de TVA intracommunautaire */
  vatNumber?: Maybe<Scalars["String"]>;
};

/** Information sur utilisateur au sein d'un établissement */
export type CompanyMember = {
  __typename?: "CompanyMember";
  /** Identifiant opaque */
  id: Scalars["ID"];
  /** Email */
  email: Scalars["String"];
  /** Nom de l'utilisateur */
  name?: Maybe<Scalars["String"]>;
  /** Rôle de l'utilisateur dans l'établissement (admin ou membre) */
  role?: Maybe<UserRole>;
  /** Si oui ou non l'email de l'utilisateur a été confirmé */
  isActive?: Maybe<Scalars["Boolean"]>;
  /** Si oui ou non une une invitation à joindre l'établissement est en attente */
  isPendingInvitation?: Maybe<Scalars["Boolean"]>;
  /** Si oui ou non cet utilisateur correspond à l'utilisateur authentifié */
  isMe?: Maybe<Scalars["Boolean"]>;
};

/** Information sur un établissement accessible par un utilisateur membre */
export type CompanyPrivate = {
  __typename?: "CompanyPrivate";
  /** Identifiant opaque */
  id: Scalars["ID"];
  /** Profil de l'établissement */
  companyTypes: Array<CompanyType>;
  /** Identifiant GEREP */
  gerepId?: Maybe<Scalars["String"]>;
  /** Code de signature permettant de signer les BSD */
  securityCode: Scalars["Int"];
  /** État du processus de vérification de l'établissement */
  verificationStatus: CompanyVerificationStatus;
  /** Email de contact (visible sur la fiche entreprise) */
  contactEmail?: Maybe<Scalars["String"]>;
  /** Numéro de téléphone de contact (visible sur la fiche entreprise) */
  contactPhone?: Maybe<Scalars["String"]>;
  /** Site web (visible sur la fiche entreprise) */
  website?: Maybe<Scalars["String"]>;
  /** Liste des utilisateurs appartenant à cet établissement */
  users?: Maybe<Array<CompanyMember>>;
  /** Rôle de l'utilisateur authentifié cau sein de cet établissement */
  userRole?: Maybe<UserRole>;
  /**
   * Nom d'usage de l'entreprise qui permet de différencier
   * différents établissements ayant le même nom
   */
  givenName?: Maybe<Scalars["String"]>;
  /** SIRET de l'établissement */
  siret: Scalars["String"];
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars["String"]>;
  /** Code NAF de l'établissement */
  naf?: Maybe<Scalars["String"]>;
  /** Libellé NAF de l'établissement */
  libelleNaf?: Maybe<Scalars["String"]>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement (le cas échéant)
   */
  installation?: Maybe<Installation>;
  /** Récépissé transporteur (le cas échéant, pour les profils transporteur) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** Récépissé négociant (le cas échéant, pour les profils négociant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé courtier (le cas échéant, pour les profils courtier) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Agrément démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Agrément broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements: Array<Scalars["URL"]>;
  allowBsdasriTakeOverWithoutSignature: Scalars["Boolean"];
};

/** Information sur un établissement accessible publiquement */
export type CompanyPublic = {
  __typename?: "CompanyPublic";
  /** Email de contact */
  contactEmail?: Maybe<Scalars["String"]>;
  /** Numéro de téléphone de contact */
  contactPhone?: Maybe<Scalars["String"]>;
  /** Site web */
  website?: Maybe<Scalars["String"]>;
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars["String"]>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif?: Maybe<Scalars["String"]>;
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars["String"]>;
  /** Code NAF */
  naf?: Maybe<Scalars["String"]>;
  /** Libellé NAF */
  libelleNaf?: Maybe<Scalars["String"]>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement
   */
  installation?: Maybe<Installation>;
  /** Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets */
  isRegistered?: Maybe<Scalars["Boolean"]>;
  /**
   * Profil de l'établissement sur Trackdéchets
   * ayant pour valeur un tableau vide quand l'établissement
   * n'est pas inscrit sur la plateforme `isRegistered=false`
   */
  companyTypes: Array<CompanyType>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé courtier associé à cet établissement (le cas échant) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements: Array<Scalars["URL"]>;
};

/** Information sur un établissement accessible publiquement en recherche */
export type CompanySearchResult = {
  __typename?: "CompanySearchResult";
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars["String"]>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif?: Maybe<Scalars["String"]>;
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /** Code commune de l'établissement */
  codeCommune?: Maybe<Scalars["String"]>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars["String"]>;
  /** Code NAF */
  naf?: Maybe<Scalars["String"]>;
  /** Libellé NAF */
  libelleNaf?: Maybe<Scalars["String"]>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement
   */
  installation?: Maybe<Installation>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé courtier associé à cet établissement (le cas échant) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
};

/** Statistiques d'un établissement */
export type CompanyStat = {
  __typename?: "CompanyStat";
  /** Établissement */
  company?: Maybe<FormCompany>;
  /** Liste des statistiques */
  stats: Array<Stat>;
};

/** Profil entreprise */
export enum CompanyType {
  /** Producteur de déchet */
  Producer = "PRODUCER",
  /** Installation de Transit, regroupement ou tri de déchets */
  Collector = "COLLECTOR",
  /** Installation de traitement */
  Wasteprocessor = "WASTEPROCESSOR",
  /** Transporteur */
  Transporter = "TRANSPORTER",
  /** Installation de traitement de VHU (casse automobile et/ou broyeur agréé) */
  WasteVehicles = "WASTE_VEHICLES",
  /** Installation de collecte de déchets apportés par le producteur initial */
  WasteCenter = "WASTE_CENTER",
  /** Négociant */
  Trader = "TRADER",
  /** Courtier */
  Broker = "BROKER",
  /** Éco-organisme */
  EcoOrganisme = "ECO_ORGANISME"
}

export enum CompanyVerificationMode {
  Letter = "LETTER",
  Manual = "MANUAL"
}

/** État du processus de vérification de l'établissement */
export enum CompanyVerificationStatus {
  /** L'établissement est vérifié */
  Verified = "VERIFIED",
  /** L'établissement vient d'être crée, en attente de vérifications manuelles par l'équipe Trackdéchets */
  ToBeVerified = "TO_BE_VERIFIED",
  /**
   * Les vérifications manuelles n'ont pas abouties, une lettre a été envoyée à l'adresse enregistrée
   * auprès du registre du commerce et des sociétés
   */
  LetterSent = "LETTER_SENT"
}

/** Consistance du déchet */
export enum Consistence {
  /** Solide */
  Solid = "SOLID",
  /** Liquide */
  Liquid = "LIQUID",
  /** Gazeux */
  Gaseous = "GASEOUS",
  /** Pâteux */
  Doughy = "DOUGHY"
}

/** Payload de création d'un récépissé courtier */
export type CreateBrokerReceiptInput = {
  /** Numéro de récépissé courtier */
  receiptNumber: Scalars["String"];
  /** Limite de validité du récépissé */
  validityLimit: Scalars["DateTime"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

/** Payload de création d'un bordereau */
export type CreateFormInput = {
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: Maybe<Scalars["String"]>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: Maybe<EmitterInput>;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter?: Maybe<TransporterInput>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader?: Maybe<TraderInput>;
  /** Courtier */
  broker?: Maybe<BrokerInput>;
  /** Annexe 2 */
  appendix2Forms?: Maybe<Array<AppendixFormInput>>;
  ecoOrganisme?: Maybe<EcoOrganismeInput>;
  temporaryStorageDetail?: Maybe<TemporaryStorageDetailInput>;
};

/** Payload de création d'un récépissé négociant */
export type CreateTraderReceiptInput = {
  /** Numéro de récépissé négociant */
  receiptNumber: Scalars["String"];
  /** Limite de validité du récépissé */
  validityLimit: Scalars["DateTime"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

/** Payload de création d'un récépissé transporteur */
export type CreateTransporterReceiptInput = {
  /** Numéro de récépissé transporteur */
  receiptNumber: Scalars["String"];
  /** Limite de validité du récépissé */
  validityLimit: Scalars["DateTime"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

/** Payload de création d'un agrément VHU */
export type CreateVhuAgrementInput = {
  /** Numéro d'agrément VHU */
  agrementNumber: Scalars["String"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

export type DateFilter = {
  _gte?: Maybe<Scalars["DateTime"]>;
  _gt?: Maybe<Scalars["DateTime"]>;
  _lte?: Maybe<Scalars["DateTime"]>;
  _lt?: Maybe<Scalars["DateTime"]>;
  _eq?: Maybe<Scalars["DateTime"]>;
};

/** Représente une ligne dans une déclaration GEREP */
export type Declaration = {
  __typename?: "Declaration";
  /** Année de la déclaration */
  annee?: Maybe<Scalars["String"]>;
  /** Code du déchet */
  codeDechet?: Maybe<Scalars["String"]>;
  /** Description du déchet */
  libDechet?: Maybe<Scalars["String"]>;
  /** Type de déclaration GEREP: producteur ou traiteur */
  gerepType?: Maybe<GerepType>;
};

/** Payload de suppression d'un récépissé courtier */
export type DeleteBrokerReceiptInput = {
  /** The id of the broker receipt to delete */
  id: Scalars["ID"];
};

/** Payload de suppression d'un récépissé négociant */
export type DeleteTraderReceiptInput = {
  /** The id of the trader receipt to delete */
  id: Scalars["ID"];
};

/** Payload de suppression d'un récépissé transporteur */
export type DeleteTransporterReceiptInput = {
  /** The id of the transporter receipt to delete */
  id: Scalars["ID"];
};

/** Payload de suppression d'un agrément VHU */
export type DeleteVhuAgrementInput = {
  /** ID de l'agrément VHU à supprimer */
  id: Scalars["ID"];
};

export type Destination = {
  __typename?: "Destination";
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars["String"]>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: Maybe<Scalars["String"]>;
  /** Établissement de destination */
  company?: Maybe<FormCompany>;
  /** Indique si l'information a été saisie par l'émetteur du bordereau ou l'installation d'entreposage */
  isFilledByEmitter?: Maybe<Scalars["Boolean"]>;
};

export type DestinationInput = {
  /**
   * Installation de destination prévue (case 14)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  company?: Maybe<CompanyInput>;
  /** N° de CAP prévu (le cas échéant). Le champ CAP est obligatoire pour les déchets dangereux. */
  cap?: Maybe<Scalars["String"]>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: Maybe<Scalars["String"]>;
};

/**
 * Eco-organisme
 * Les éco-organismes n'apparaissent pas en case 1 du bordereau mais sont quand même responsables du déchet.
 * C'est l'entreprise de collecte de déchet qui apparait en case 1.
 * Pour pouvoir saisir un éco-organisme, le détenteur du déchet doit être défini comme 'Autre détenteur'.
 * Seul un éco-organisme enregistré dans Trackdéchet peut être associé.
 */
export type EcoOrganisme = {
  __typename?: "EcoOrganisme";
  id: Scalars["ID"];
  /** Nom de l'éco-organisme */
  name: Scalars["String"];
  /** Siret de l'éco-organisme */
  siret: Scalars["String"];
  /** Adresse de l'éco-organisme */
  address: Scalars["String"];
};

/** Payload de liaison d'un BSD à un eco-organisme */
export type EcoOrganismeInput = {
  name: Scalars["String"];
  /**
   * SIRET composé de 14 caractères correspondant à un éco-organisme. La liste des éco-organismes
   * est disponible via la [query ecoOrganismes](../user-company/queries#ecoorganismes)
   */
  siret: Scalars["String"];
};

/** Émetteur du BSD (case 1) */
export type Emitter = {
  __typename?: "Emitter";
  /** Type d'émetteur */
  type?: Maybe<EmitterType>;
  /** Adresse du chantier */
  workSite?: Maybe<WorkSite>;
  /**
   * DEPRECATED - Ancienne adresse chantier
   * @deprecated Migration vers `workSite` obligatoire
   */
  pickupSite?: Maybe<Scalars["String"]>;
  /** Établissement émetteur */
  company?: Maybe<FormCompany>;
};

/** Payload lié à un l'émetteur du BSD (case 1) */
export type EmitterInput = {
  /** Type d'émetteur. Le type d'émetteur doit être `OTHER` lorsqu'un éco-organisme est responsable du déchet */
  type?: Maybe<EmitterType>;
  /** Adresse du chantier */
  workSite?: Maybe<WorkSiteInput>;
  /** DEPRECATED - Ancienne adresse chantier */
  pickupSite?: Maybe<Scalars["String"]>;
  /** Établissement émetteur */
  company?: Maybe<CompanyInput>;
};

/** Types d'émetteur de déchet (choix multiple de la case 1) */
export enum EmitterType {
  /** Producetur de déchet */
  Producer = "PRODUCER",
  /** Autre détenteur */
  Other = "OTHER",
  /** Collecteur de petites quantités de déchets relevant de la même rubrique */
  Appendix1 = "APPENDIX1",
  /** Personne ayant transformé ou réalisé un traitement dont la provenance des déchets reste identifiable */
  Appendix2 = "APPENDIX2"
}

/** Type d'établissement favoris */
export enum FavoriteType {
  Emitter = "EMITTER",
  Transporter = "TRANSPORTER",
  Recipient = "RECIPIENT",
  Trader = "TRADER",
  Broker = "BROKER",
  NextDestination = "NEXT_DESTINATION",
  TemporaryStorageDetail = "TEMPORARY_STORAGE_DETAIL",
  Destination = "DESTINATION"
}

/**
 * URL de téléchargement accompagné d'un token
 * permettant de valider le téléchargement.
 */
export type FileDownload = {
  __typename?: "FileDownload";
  /** Token ayant une durée de validité de 10s */
  token?: Maybe<Scalars["String"]>;
  /** Lien de téléchargement */
  downloadLink?: Maybe<Scalars["String"]>;
};

/**
 * Bordereau de suivi de déchets (BSD)
 * Version dématérialisée du [CERFA n°12571*01](https://www.service-public.fr/professionnels-entreprises/vosdroits/R14334)
 */
export type Form = {
  __typename?: "Form";
  /** Identifiant unique du bordereau. */
  id: Scalars["ID"];
  /**
   * Identifiant lisible utilisé comme numéro sur le CERFA (case "Bordereau n°****").
   * Il est possible de l'utiliser pour récupérer l'identifiant unique du bordereau via la query form,
   * utilisé pour le reste des opérations.
   * Cet identifiant possède le format BSD-{yyyyMMdd}-{XXXXXXXX} où yyyyMMdd est la date du jour
   * et XXXXXXXXX une chaine de 9 caractères alphanumériques. Ex: BSD-20210101-HY87F54D1
   */
  readableId: Scalars["String"];
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: Maybe<Scalars["String"]>;
  /**
   * Permet de savoir si les données du BSD ont été importées depuis un
   * bordereau signé papier via la mutation `importPaperForm`
   */
  isImportedFromPaper: Scalars["Boolean"];
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: Maybe<Emitter>;
  /** Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2) */
  recipient?: Maybe<Recipient>;
  /** Transporteur du déchet (case 8) */
  transporter?: Maybe<Transporter>;
  /** Détails du déchet (case 3) */
  wasteDetails?: Maybe<WasteDetails>;
  /** Négociant (case 7) */
  trader?: Maybe<Trader>;
  /** Courtier */
  broker?: Maybe<Broker>;
  /** Date de création du BSD */
  createdAt?: Maybe<Scalars["DateTime"]>;
  /** Date de la dernière modification du BSD */
  updatedAt?: Maybe<Scalars["DateTime"]>;
  /** Statut du BSD (brouillon, envoyé, reçu, traité, etc) */
  status: FormStatus;
  /** Si oui ou non le BSD a été signé par un transporteur */
  signedByTransporter?: Maybe<Scalars["Boolean"]>;
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt?: Maybe<Scalars["DateTime"]>;
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy?: Maybe<Scalars["String"]>;
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus?: Maybe<Scalars["String"]>;
  /** Raison du refus (case 10) */
  wasteRefusalReason?: Maybe<Scalars["String"]>;
  /** Nom de la personne en charge de la réception du déchet (case 10) */
  receivedBy?: Maybe<Scalars["String"]>;
  /** Date à laquelle le déchet a été reçu (case 10) */
  receivedAt?: Maybe<Scalars["DateTime"]>;
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt?: Maybe<Scalars["DateTime"]>;
  /** Quantité réelle présentée (case 10) */
  quantityReceived?: Maybe<Scalars["Float"]>;
  /** Traitement réalisé (code D/R) */
  processingOperationDone?: Maybe<Scalars["String"]>;
  /** Description de l'opération d’élimination / valorisation (case 11) */
  processingOperationDescription?: Maybe<Scalars["String"]>;
  /** Personne en charge du traitement */
  processedBy?: Maybe<Scalars["String"]>;
  /** Date à laquelle le déchet a été traité */
  processedAt?: Maybe<Scalars["DateTime"]>;
  /** Si oui ou non il y a eu rupture de traçabilité */
  noTraceability?: Maybe<Scalars["Boolean"]>;
  /** Destination ultérieure prévue (case 12) */
  nextDestination?: Maybe<NextDestination>;
  /** Annexe 2 */
  appendix2Forms?: Maybe<Array<Appendix2Form>>;
  ecoOrganisme?: Maybe<FormEcoOrganisme>;
  /** BSD suite - détail des champs de la partie entreposage provisoire ou reconditionnement */
  temporaryStorageDetail?: Maybe<TemporaryStorageDetail>;
  /** Résumé des valeurs clés du bordereau à l'instant T */
  stateSummary?: Maybe<StateSummary>;
  transportSegments?: Maybe<Array<TransportSegment>>;
  currentTransporterSiret?: Maybe<Scalars["String"]>;
  nextTransporterSiret?: Maybe<Scalars["String"]>;
};

/** Information sur un établissement dans un BSD */
export type FormCompany = {
  __typename?: "FormCompany";
  /** Nom de l'établissement */
  name?: Maybe<Scalars["String"]>;
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars["String"]>;
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /**
   * Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
   * https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2
   *
   * Seul la destination ultérieure case 12 (`form.nextDestination.company`) peut être à l'étranger.
   */
  country?: Maybe<Scalars["String"]>;
  /** Nom du contact dans l'établissement */
  contact?: Maybe<Scalars["String"]>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone?: Maybe<Scalars["String"]>;
  /** Email du contact dans l'établissement */
  mail?: Maybe<Scalars["String"]>;
  /** Numéro de TVA intracommunautaire */
  vatNumber?: Maybe<Scalars["String"]>;
};

/** Information sur l'éco-organisme responsable du BSD */
export type FormEcoOrganisme = {
  __typename?: "FormEcoOrganisme";
  name: Scalars["String"];
  siret: Scalars["String"];
};

/** Payload de création d'un BSD */
export type FormInput = {
  /** Identifiant opaque */
  id?: Maybe<Scalars["ID"]>;
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: Maybe<Scalars["String"]>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: Maybe<EmitterInput>;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter?: Maybe<TransporterInput>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader?: Maybe<TraderInput>;
  /** Courtier */
  broker?: Maybe<BrokerInput>;
  /** Annexe 2 */
  appendix2Forms?: Maybe<Array<AppendixFormInput>>;
  ecoOrganisme?: Maybe<EcoOrganismeInput>;
  temporaryStorageDetail?: Maybe<TemporaryStorageDetailInput>;
};

export enum FormRole {
  /** Les BSD's dont je suis transporteur */
  Transporter = "TRANSPORTER",
  /** Les BSD's dont je suis la destination de traitement */
  Recipient = "RECIPIENT",
  /** Les BSD's dont je suis l'émetteur */
  Emitter = "EMITTER",
  /** Les BSD's dont je suis le négociant */
  Trader = "TRADER",
  /** Les BSD's dont je suis le courtier */
  Broker = "BROKER",
  /** Les BSD's dont je suis éco-organisme */
  EcoOrganisme = "ECO_ORGANISME"
}

/** Informations du cycle de vie des bordereaux */
export type FormsLifeCycleData = {
  __typename?: "formsLifeCycleData";
  /** Liste des changements de statuts */
  statusLogs: Array<StatusLog>;
  /** pagination, indique si d'autres pages existent après */
  hasNextPage?: Maybe<Scalars["Boolean"]>;
  /** pagination, indique si d'autres pages existent avant */
  hasPreviousPage?: Maybe<Scalars["Boolean"]>;
  /** Premier id de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle */
  startCursor?: Maybe<Scalars["ID"]>;
  /** Dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle */
  endCursor?: Maybe<Scalars["ID"]>;
  /** Nombre de changements de statuts renvoyés */
  count?: Maybe<Scalars["Int"]>;
};

/** Format de l'export du registre */
export enum FormsRegisterExportFormat {
  /** Fichier csv */
  Csv = "CSV",
  /** Fichier Excel */
  Xlsx = "XLSX"
}

/**
 * Modèle de registre réglementaire tels que décrits dans l'arrêté du 29 février 2012 fixant
 * le contenu des registres mnetionnées aux articles R. 541-43 et R. 541-46 du code de l'environnement
 * https://www.legifrance.gouv.fr/affichTexte.do?cidTexte=JORFTEXT000025454959&categorieLien=id
 */
export enum FormsRegisterExportType {
  /** Registre exhaustif, déchets entrants et sortants */
  All = "ALL",
  /**
   * Registre producteur, déchets sortants
   * Art 1: Les exploitants des établissements produisant ou expédiant des déchets tiennent à jour
   * un registre chronologique où sont consignés tous les déchets sortants.
   */
  Outgoing = "OUTGOING",
  /**
   * Registre traiteur, TTR
   * Art 2: Les exploitants des installations de transit, de regroupement ou de traitement de déchets,
   * notamment de tri, établissent et tiennent à jour un registre chronologique où sont consignés
   * tous les déchets entrants.
   */
  Incoming = "INCOMING",
  /**
   * Registre transporteur
   * Art 3: Les transporteurs et les collecteurs de déchets tiennent à jour un registre chronologique
   * des déchets transportés ou collectés.
   */
  Transported = "TRANSPORTED",
  /**
   * Registre négociants
   * Art 4: Les négociants tiennent à jour un registre chronologique des déchets détenus.
   */
  Traded = "TRADED",
  /** Registre courtier */
  Brokered = "BROKERED"
}

/** Différents statuts d'un BSD au cours de son cycle de vie */
export enum FormStatus {
  /**
   * BSD à l'état de brouillon
   * Des champs obligatoires peuvent manquer
   */
  Draft = "DRAFT",
  /**
   * BSD finalisé
   * Les champs sont validés pour détecter des valeurs manquantes ou erronnées
   */
  Sealed = "SEALED",
  /** BSD envoyé vers l'établissement de destination */
  Sent = "SENT",
  /** BSD reçu par l'établissement de destination */
  Received = "RECEIVED",
  /** BSD accepté par l'établissement de destination */
  Accepted = "ACCEPTED",
  /** BSD dont les déchets ont été traités */
  Processed = "PROCESSED",
  /** BSD en attente de regroupement */
  AwaitingGroup = "AWAITING_GROUP",
  /** Regroupement effectué */
  Grouped = "GROUPED",
  /** Perte de traçabalité */
  NoTraceability = "NO_TRACEABILITY",
  /** Déchet refusé */
  Refused = "REFUSED",
  /** Déchet arrivé sur le site d'entreposage ou reconditionnement */
  TempStored = "TEMP_STORED",
  /** Déchet accepté par le site d'entreposage ou reconditionnement */
  TempStorerAccepted = "TEMP_STORER_ACCEPTED",
  /** Déchet avec les cadres 14-19 complétées (si besoin), prêt à partir du site d'entreposage ou reconditionnement */
  Resealed = "RESEALED",
  /** Déchet envoyé du site d'entreposage ou reconditionnement vers sa destination de traitement */
  Resent = "RESENT"
}

/**
 * DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`
 *
 * Mise à jour d'un BSD
 */
export type FormSubscription = {
  __typename?: "FormSubscription";
  /** Type de mutation */
  mutation?: Maybe<Scalars["String"]>;
  /** BSD concerné */
  node?: Maybe<Form>;
  /** Liste des champs mis à jour */
  updatedFields?: Maybe<Array<Maybe<Scalars["String"]>>>;
  /** Ancienne valeurs */
  previousValues?: Maybe<Form>;
};

/** Type d'une déclaration GEREP */
export enum GerepType {
  Producteur = "Producteur",
  Traiteur = "Traiteur"
}

/** Payload d'import d'un BSD papier */
export type ImportPaperFormInput = {
  /**
   * Numéro de BSD Trackdéchets (uniquement dans le cas d'une mise à jour d'un
   * bordereau émis initialement dans Trackdéchets)
   */
  id?: Maybe<Scalars["ID"]>;
  /**
   * Identifiant libre qui peut éventuellement servir à faire le lien dans Trackdéchets
   * entre le BSD papier et le BSD numérique dans le cas de l'import d'un BSD n'ayant
   * pas été émis initialement dans Trackdéchets.
   */
  customId?: Maybe<Scalars["String"]>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: Maybe<EmitterInput>;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter?: Maybe<TransporterInput>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader?: Maybe<TraderInput>;
  /** Courtier */
  broker?: Maybe<BrokerInput>;
  /** Éco-organisme (apparait en case 1) */
  ecoOrganisme?: Maybe<EcoOrganismeInput>;
  /** Informations liées aux signatures transporteur et émetteur (case 8 et 9) */
  signingInfo: SignatureFormInput;
  /** Informations liées à la réception du déchet (case 10) */
  receivedInfo: ReceivedFormInput;
  /** Informations liées au traitement du déchet (case 11) */
  processedInfo: ProcessedFormInput;
};

/** Installation pour la protection de l'environnement (ICPE) */
export type Installation = {
  __typename?: "Installation";
  /** Identifiant S3IC */
  codeS3ic?: Maybe<Scalars["String"]>;
  /** URL de la fiche ICPE sur Géorisques */
  urlFiche?: Maybe<Scalars["String"]>;
  /** Liste des rubriques associées */
  rubriques?: Maybe<Array<Rubrique>>;
  /** Liste des déclarations GEREP */
  declarations?: Maybe<Array<Declaration>>;
};

/**
 * Payload d'un établissement pouvant se situer en France
 * ou à l'étranger
 */
export type InternationalCompanyInput = {
  /** SIRET de l'établissement, optionnel dans le cas d'un établissement à l'étranger */
  siret?: Maybe<Scalars["String"]>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars["String"]>;
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /**
   * Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
   * https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2
   *
   * En l'absence de code, l'entreprise est considérée comme résidant en France.
   */
  country?: Maybe<Scalars["String"]>;
  /** Nom du contact dans l'établissement */
  contact?: Maybe<Scalars["String"]>;
  /** Email du contact dans l'établissement */
  mail?: Maybe<Scalars["String"]>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone?: Maybe<Scalars["String"]>;
};

/**
 * Invitation à rejoindre une entreprise
 * lorsque l'utilisateur invité n'est pas encore inscrit
 * sur Trackdéchets
 */
export type Invitation = {
  __typename?: "Invitation";
  /** Identifiant unique */
  id: Scalars["ID"];
  /** Email de l'utilisateur invité */
  email: Scalars["String"];
  /** Siret de l'entreprise à laquelle l'utilisateur est invité */
  companySiret: Scalars["String"];
  /** Hash unique inclus dans le lien d'invitation envoyé par email */
  hash: Scalars["String"];
  /** Rôle de l'utilisateur au sein de l'entreprise */
  role: UserRole;
  /** Date when the invitation was accepted and the user joined */
  acceptedAt?: Maybe<Scalars["DateTime"]>;
};

/**
 * Demande de rattachement à un établissement effectué par
 * un utilisateur.
 */
export type MembershipRequest = {
  __typename?: "MembershipRequest";
  id: Scalars["ID"];
  /** Email de l'utilisateur faisant la demande */
  email: Scalars["String"];
  /** SIRET de l'établissement */
  siret: Scalars["String"];
  /** Nom de l'établissement */
  name: Scalars["String"];
  /** Statut de la demande de rattachement */
  status: MembershipRequestStatus;
  /**
   * Liste des adresses email correspondant aux comptes administrateurs à qui la demande
   * de rattachement a été envoyée. Les adresses emails sont partiellement masquées de la
   * façon suivante j********w@trackdechets.fr
   */
  sentTo: Array<Scalars["String"]>;
};

/**
 * Différents statuts possibles pour une demande de rattachement
 * à un établissement
 */
export enum MembershipRequestStatus {
  Pending = "PENDING",
  Accepted = "ACCEPTED",
  Refused = "REFUSED"
}

export type Mutation = {
  __typename?: "Mutation";
  /**
   * USAGE INTERNE
   * Accepte une demande de rattachement à un établissement
   * en spécifiant le rôle accordé au nouvel utilisateur
   */
  acceptMembershipRequest: CompanyPrivate;
  /** Mutation permettant d'ajouter une fiche d'intervention à un bordereau existant. */
  addFicheInterventionBsff: BsffFicheIntervention;
  /**
   * USAGE INTERNE
   * Modifie le mot de passe d'un utilisateur
   */
  changePassword: User;
  /**
   * USAGE INTERNE
   * Crée un récépissé courtier
   */
  createBrokerReceipt?: Maybe<BrokerReceipt>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Crée un Bsda
   */
  createBsda?: Maybe<Bsda>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Crée un nouveau dasri
   */
  createBsdasri: Bsdasri;
  /** Mutation permettant de créer un nouveau bordereau de suivi de fluides frigorigènes. */
  createBsff: Bsff;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Crée un BSVHU
   */
  createBsvhu?: Maybe<Bsvhu>;
  /**
   * USAGE INTERNE
   * Rattache un établissement à l'utilisateur authentifié
   */
  createCompany: CompanyPrivate;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Crée un Bsda en brouillon
   */
  createDraftBsda?: Maybe<Bsda>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Crée un nouveau dasri en brouillon
   */
  createDraftBsdasri: Bsdasri;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Crée un BSVHU en brouillon
   */
  createDraftBsvhu?: Maybe<Bsvhu>;
  /** Crée un nouveau bordereau */
  createForm: Form;
  /**
   * USAGE INTERNE
   * Crée un récépissé négociant
   */
  createTraderReceipt?: Maybe<TraderReceipt>;
  /**
   * USAGE INTERNE
   * Crée un récépissé transporteur
   */
  createTransporterReceipt?: Maybe<TransporterReceipt>;
  /**
   * USAGE INTERNE
   * Récupère une URL signé pour l'upload d'un fichier
   */
  createUploadLink: UploadLink;
  /**
   * USAGE INTERNE
   * Crée un agrément VHU
   */
  createVhuAgrement?: Maybe<VhuAgrement>;
  /**
   * USAGE INTERNE
   * Supprime un récépissé courtier
   */
  deleteBrokerReceipt?: Maybe<BrokerReceipt>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Supprime un Bsda
   */
  deleteBsda?: Maybe<Bsda>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Supprime un BSDASRI
   */
  deleteBsdasri?: Maybe<Bsdasri>;
  /**
   * Mutation permettant de supprimer un bordereau existant de suivi de fluides frigorigènes.
   * À condition qu'il n'ait pas encore été signé.
   */
  deleteBsff: Bsff;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Supprime un BSVHU
   */
  deleteBsvhu?: Maybe<Bsvhu>;
  /** Mutation permettant de supprimer une fiche d'intervention lié à un bordereau existant. */
  deleteFicheInterventionBsff: BsffFicheIntervention;
  /** Supprime un BSD */
  deleteForm?: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Supprime une invitation à un établissement
   */
  deleteInvitation: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Supprime un récépissé négociant
   */
  deleteTraderReceipt?: Maybe<TraderReceipt>;
  /**
   * USAGE INTERNE
   * Supprime un récépissé transporteur
   */
  deleteTransporterReceipt?: Maybe<TransporterReceipt>;
  /**
   * USAGE INTERNE
   * Supprime un agrément VHU
   */
  deleteVhuAgrement?: Maybe<VhuAgrement>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Duplique un Bsda
   */
  duplicateBsda?: Maybe<Bsda>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Duplique un bordereau Dasri
   */
  duplicateBsdasri?: Maybe<Bsdasri>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Duplique un BSVHU
   */
  duplicateBsvhu?: Maybe<Bsvhu>;
  /** Duplique un BSD */
  duplicateForm?: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Met à jour les informations de l'utilisateur
   */
  editProfile: User;
  /** Édite un segment existant */
  editSegment?: Maybe<TransportSegment>;
  /**
   * Permet d'importer les informations d'un BSD papier dans Trackdéchet après la réalisation de l'opération
   * de traitement. Le BSD signé papier original doit être conservé à l'installation de destination qui doit
   * être en mesure de retrouver le bordereau papier correspondant à un bordereau numérique. Le champ `customId`
   * de l'input peut-être utilisé pour faire le lien.
   */
  importPaperForm?: Maybe<Form>;
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
  /** Valide l'acceptation du BSD */
  markAsAccepted?: Maybe<Form>;
  /** Valide le traitement d'un BSD */
  markAsProcessed?: Maybe<Form>;
  /** Valide la réception d'un BSD */
  markAsReceived?: Maybe<Form>;
  /** Valide la complétion des cadres 14 à 19 lors d'un entreposage provisoire ou reconditionnement */
  markAsResealed?: Maybe<Form>;
  /**
   * Valide l'envoi du BSD après un entreposage provisoire ou reconditionnement
   * @deprecated Utiliser la mutation signedByTransporter permettant d'apposer les signatures du collecteur-transporteur (case 18) et de l'exploitant du site d'entreposage provisoire ou de reconditionnement (case 19)
   */
  markAsResent?: Maybe<Form>;
  /**
   * Finalise un BSD
   * Les champs suivants sont obligatoires pour pouvoir finaliser un bordereau et
   * doivent avoir été renseignés au préalable
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
   *   cap // requis pour les déchets dangereux uniquement
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
   *   isExemptedOfReceipt
   *   receipt
   *   department // non requis si isExemptedOfReceipt=true
   *   validityLimit // peut-être omis si isExemptedOfReceipt=true
   *   numberPlate // peut-être omis si isExemptedOfReceipt=true
   * }
   * wasteDetails: {
   *   code
   *   onuCode // requis pour les déchets dangereux uniquement
   *   name
   *   packagings {
   *     type
   *     other // requis si type=OTHER
   *     quantity
   *   }
   *   quantity
   *   quantityType
   *   consistence
   *   pop
   * }
   * ```
   */
  markAsSealed?: Maybe<Form>;
  /**
   * Valide l'envoi d'un BSD
   * @deprecated Utiliser la mutation signedByTransporter permettant d'apposer les signatures collecteur-transporteur (case 8) et émetteur (case 9)
   */
  markAsSent?: Maybe<Form>;
  /** Valide la réception d'un BSD d'un entreposage provisoire ou reconditionnement */
  markAsTempStored?: Maybe<Form>;
  /** Valide l'acceptation ou le refus d'un BSD d'un entreposage provisoire ou reconditionnement */
  markAsTempStorerAccepted?: Maybe<Form>;
  /** Marque un segment de transport comme prêt à être emporté */
  markSegmentAsReadyToTakeOver?: Maybe<TransportSegment>;
  /** Prépare un nouveau segment de transport multimodal */
  prepareSegment?: Maybe<TransportSegment>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Permet de publier un brouillon pour le marquer comme prêt à être envoyé
   */
  publishBsda?: Maybe<Bsda>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Marque un dasri brouillon comme publié (isDraft=false)
   */
  publishBsdasri?: Maybe<Bsdasri>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Permet de publier un brouillon pour le marquer comme prêt à être envoyé
   */
  publishBsvhu?: Maybe<Bsvhu>;
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
   * Renouvelle le code de signature de l'établissement
   */
  renewSecurityCode: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Renvoie un email d'activation
   */
  resendActivationEmail: Scalars["Boolean"];
  /**
   * USAGE INTERNE
   * Renvoie l'email d'invitation à un établissement
   */
  resendInvitation: Scalars["Boolean"];
  /**
   * USAGE INTERNE
   * Envoie un email pour la réinitialisation du mot de passe
   */
  resetPassword: Scalars["Boolean"];
  /**
   * DEPRECATED - Sauvegarde un BSD (création ou modification, si `FormInput` contient un ID)
   * @deprecated Utiliser createForm / updateForm selon le besoin
   */
  saveForm?: Maybe<Form>;
  /**
   * Envoie une demande de rattachement de l'utilisateur courant
   * à rejoindre l'établissement dont le siret est précisé en paramètre.
   * Cette demande est communiquée à l'ensemble des administrateurs de
   * l'établissement qui ont le choix de l'accepter ou de la refuser.
   */
  sendMembershipRequest?: Maybe<MembershipRequest>;
  sendVerificationCodeLetter: CompanyForVerification;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Signe un Bsda
   */
  signBsda?: Maybe<Bsda>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Appose une signature sur un Bsdasri, verrouille les cadres correspondant
   *
   * Une signature ne peut être apposée que par un membre de l'entreprise figurant sur le cadre concerné
   * Ex: la signature TRANSPORT ne peut être apposée que par un membre de l'entreprise de transport
   *
   * Pour signer l'emission avec un compte transpoteur (cas de lasignature sur device transporteur),
   * utiliser la mutation signBsdasriEmissionWithSecretCode
   */
  signBsdasri?: Maybe<Bsdasri>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Appose une signature de type EMISSION via un compte n'appartenant pas à l'émetteur.
   * Permet de signer un enlèvement sur le device transporteur grâce au code de sécurité de l'émetteur du dasri
   */
  signBsdasriEmissionWithSecretCode?: Maybe<Bsdasri>;
  /** Mutation permettant d'apposer une signature sur le bordereau. */
  signBsff: Bsff;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Signe un BSVHU
   */
  signBsvhu?: Maybe<Bsvhu>;
  /**
   * Permet de transférer le déchet à un transporteur lors de la collecte initiale (signatures en case 8 et 9)
   * ou après une étape d'entreposage provisoire ou de reconditionnement (signatures en case 18 et 19).
   * Cette mutation doit être appelée avec le token du collecteur-transporteur.
   * L'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement) est authentifié quant à lui
   * grâce à son code de signature disponible sur le tableau de bord Trackdéchets (Mon Compte > Établissements > Sécurité).
   * D'un point de vue pratique, cela implique qu'un responsable de l'établissement
   * émetteur (resp. d'entreposage provisoire ou de reconditionnement)
   * renseigne le code de signature sur le terminal du collecteur-transporteur.
   * Dans le cas où un éco-organisme figure sur le BSD, il est également possible
   * de signer avec son code plutôt que celui de l'émetteur.
   * Il faut alors fournir le code de l'éco-organisme en indiquant qu'il est
   * l'auteur de la signature (signingInfo.signatureAuthor doit valoir
   * ECO_ORGANISME).
   */
  signedByTransporter?: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Permet de créer un nouvel utilisateur
   */
  signup: User;
  /** Marque un segment comme pris en charge par le nouveau transporteur */
  takeOverSegment?: Maybe<TransportSegment>;
  /**
   * USAGE INTERNE
   * Édite les informations d'un récépissé courtier
   */
  updateBrokerReceipt?: Maybe<BrokerReceipt>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Met à jour un Bsda
   */
  updateBsda?: Maybe<Bsda>;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Met à jour un dasri existant
   * Par défaut, tous les champs sont modifiables.
   */
  updateBsdasri: Bsdasri;
  /** Mutation permettant de modifier un bordereau existant de suivi de fluides frigorigènes. */
  updateBsff: Bsff;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Met à jour un BSVHU
   */
  updateBsvhu?: Maybe<Bsvhu>;
  /**
   * USAGE INTERNE
   * Édite les informations d'un établissement
   */
  updateCompany: CompanyPrivate;
  /** Mutation permettant de mettre à jour une fiche d'intervention lié à un bordereau existant. */
  updateFicheInterventionBsff: BsffFicheIntervention;
  /** Met à jour un bordereau existant */
  updateForm: Form;
  /**
   * USAGE INTERNE
   * Édite les informations d'un récépissé négociant
   */
  updateTraderReceipt?: Maybe<TraderReceipt>;
  /** Met à jour la plaque d'immatriculation ou le champ libre du transporteur */
  updateTransporterFields?: Maybe<Form>;
  /**
   * USAGE INTERNE
   * Édite les informations d'un récépissé transporteur
   */
  updateTransporterReceipt?: Maybe<TransporterReceipt>;
  /**
   * USAGE INTERNE
   * Édite un agrément VHU
   */
  updateVhuAgrement?: Maybe<VhuAgrement>;
  /**
   * USAGE INTERNE
   * Permet de vérifier un établissement à partir du code de vérification
   * envoyé par courrier à l'adresse de l'établissement renseigné au
   * registre du commerce et des sociétés
   */
  verifyCompany: CompanyPrivate;
  /** Verify a company manually */
  verifyCompanyByAdmin: CompanyForVerification;
};

export type MutationAcceptMembershipRequestArgs = {
  id: Scalars["ID"];
  role: UserRole;
};

export type MutationAddFicheInterventionBsffArgs = {
  id: Scalars["ID"];
  numero: Scalars["String"];
  input: BsffFicheInterventionInput;
};

export type MutationChangePasswordArgs = {
  oldPassword: Scalars["String"];
  newPassword: Scalars["String"];
};

export type MutationCreateBrokerReceiptArgs = {
  input: CreateBrokerReceiptInput;
};

export type MutationCreateBsdaArgs = {
  input: BsdaInput;
};

export type MutationCreateBsdasriArgs = {
  input: BsdasriCreateInput;
};

export type MutationCreateBsffArgs = {
  input: BsffInput;
};

export type MutationCreateBsvhuArgs = {
  input: BsvhuInput;
};

export type MutationCreateCompanyArgs = {
  companyInput: PrivateCompanyInput;
};

export type MutationCreateDraftBsdaArgs = {
  input: BsdaInput;
};

export type MutationCreateDraftBsdasriArgs = {
  input: BsdasriCreateInput;
};

export type MutationCreateDraftBsvhuArgs = {
  input: BsvhuInput;
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
  fileName: Scalars["String"];
  fileType: Scalars["String"];
};

export type MutationCreateVhuAgrementArgs = {
  input: CreateVhuAgrementInput;
};

export type MutationDeleteBrokerReceiptArgs = {
  input: DeleteBrokerReceiptInput;
};

export type MutationDeleteBsdaArgs = {
  id: Scalars["ID"];
};

export type MutationDeleteBsdasriArgs = {
  id: Scalars["ID"];
};

export type MutationDeleteBsffArgs = {
  id: Scalars["ID"];
};

export type MutationDeleteBsvhuArgs = {
  id: Scalars["ID"];
};

export type MutationDeleteFicheInterventionBsffArgs = {
  id: Scalars["ID"];
  numero: Scalars["String"];
};

export type MutationDeleteFormArgs = {
  id: Scalars["ID"];
};

export type MutationDeleteInvitationArgs = {
  email: Scalars["String"];
  siret: Scalars["String"];
};

export type MutationDeleteTraderReceiptArgs = {
  input: DeleteTraderReceiptInput;
};

export type MutationDeleteTransporterReceiptArgs = {
  input: DeleteTransporterReceiptInput;
};

export type MutationDeleteVhuAgrementArgs = {
  input: DeleteVhuAgrementInput;
};

export type MutationDuplicateBsdaArgs = {
  id: Scalars["ID"];
};

export type MutationDuplicateBsdasriArgs = {
  id: Scalars["ID"];
};

export type MutationDuplicateBsvhuArgs = {
  id: Scalars["ID"];
};

export type MutationDuplicateFormArgs = {
  id: Scalars["ID"];
};

export type MutationEditProfileArgs = {
  name?: Maybe<Scalars["String"]>;
  phone?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["String"]>;
};

export type MutationEditSegmentArgs = {
  id: Scalars["ID"];
  siret: Scalars["String"];
  nextSegmentInfo: NextSegmentInfoInput;
};

export type MutationImportPaperFormArgs = {
  input: ImportPaperFormInput;
};

export type MutationInviteUserToCompanyArgs = {
  email: Scalars["String"];
  siret: Scalars["String"];
  role: UserRole;
};

export type MutationJoinWithInviteArgs = {
  inviteHash: Scalars["String"];
  name: Scalars["String"];
  password: Scalars["String"];
};

export type MutationLoginArgs = {
  email: Scalars["String"];
  password: Scalars["String"];
};

export type MutationMarkAsAcceptedArgs = {
  id: Scalars["ID"];
  acceptedInfo: AcceptedFormInput;
};

export type MutationMarkAsProcessedArgs = {
  id: Scalars["ID"];
  processedInfo: ProcessedFormInput;
};

export type MutationMarkAsReceivedArgs = {
  id: Scalars["ID"];
  receivedInfo: ReceivedFormInput;
};

export type MutationMarkAsResealedArgs = {
  id: Scalars["ID"];
  resealedInfos: ResealedFormInput;
};

export type MutationMarkAsResentArgs = {
  id: Scalars["ID"];
  resentInfos: ResentFormInput;
};

export type MutationMarkAsSealedArgs = {
  id: Scalars["ID"];
};

export type MutationMarkAsSentArgs = {
  id: Scalars["ID"];
  sentInfo: SentFormInput;
};

export type MutationMarkAsTempStoredArgs = {
  id: Scalars["ID"];
  tempStoredInfos: TempStoredFormInput;
};

export type MutationMarkAsTempStorerAcceptedArgs = {
  id: Scalars["ID"];
  tempStorerAcceptedInfo: TempStorerAcceptedFormInput;
};

export type MutationMarkSegmentAsReadyToTakeOverArgs = {
  id: Scalars["ID"];
};

export type MutationPrepareSegmentArgs = {
  id: Scalars["ID"];
  siret: Scalars["String"];
  nextSegmentInfo: NextSegmentInfoInput;
};

export type MutationPublishBsdaArgs = {
  id: Scalars["ID"];
};

export type MutationPublishBsdasriArgs = {
  id: Scalars["ID"];
};

export type MutationPublishBsvhuArgs = {
  id: Scalars["ID"];
};

export type MutationRefuseMembershipRequestArgs = {
  id: Scalars["ID"];
};

export type MutationRemoveUserFromCompanyArgs = {
  userId: Scalars["ID"];
  siret: Scalars["String"];
};

export type MutationRenewSecurityCodeArgs = {
  siret: Scalars["String"];
};

export type MutationResendActivationEmailArgs = {
  email: Scalars["String"];
};

export type MutationResendInvitationArgs = {
  email: Scalars["String"];
  siret: Scalars["String"];
};

export type MutationResetPasswordArgs = {
  email: Scalars["String"];
};

export type MutationSaveFormArgs = {
  formInput: FormInput;
};

export type MutationSendMembershipRequestArgs = {
  siret: Scalars["String"];
};

export type MutationSendVerificationCodeLetterArgs = {
  input: SendVerificationCodeLetterInput;
};

export type MutationSignBsdaArgs = {
  id: Scalars["ID"];
  input: BsdaSignatureInput;
};

export type MutationSignBsdasriArgs = {
  id: Scalars["ID"];
  input: BsdasriSignatureInput;
};

export type MutationSignBsdasriEmissionWithSecretCodeArgs = {
  id: Scalars["ID"];
  input: BsdasriSignatureWithSecretCodeInput;
};

export type MutationSignBsffArgs = {
  id: Scalars["ID"];
  type: BsffSignatureType;
  signature: SignatureInput;
  securityCode?: Maybe<Scalars["Int"]>;
};

export type MutationSignBsvhuArgs = {
  id: Scalars["ID"];
  input: BsvhuSignatureInput;
};

export type MutationSignedByTransporterArgs = {
  id: Scalars["ID"];
  signingInfo: TransporterSignatureFormInput;
};

export type MutationSignupArgs = {
  userInfos: SignupInput;
};

export type MutationTakeOverSegmentArgs = {
  id: Scalars["ID"];
  takeOverInfo: TakeOverInput;
};

export type MutationUpdateBrokerReceiptArgs = {
  input: UpdateBrokerReceiptInput;
};

export type MutationUpdateBsdaArgs = {
  id: Scalars["ID"];
  input: BsdaInput;
};

export type MutationUpdateBsdasriArgs = {
  id: Scalars["ID"];
  input: BsdasriUpdateInput;
};

export type MutationUpdateBsffArgs = {
  id: Scalars["ID"];
  input: BsffInput;
};

export type MutationUpdateBsvhuArgs = {
  id: Scalars["ID"];
  input: BsvhuInput;
};

export type MutationUpdateCompanyArgs = {
  siret: Scalars["String"];
  gerepId?: Maybe<Scalars["String"]>;
  contactEmail?: Maybe<Scalars["String"]>;
  contactPhone?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
  companyTypes?: Maybe<Array<Maybe<CompanyType>>>;
  givenName?: Maybe<Scalars["String"]>;
  transporterReceiptId?: Maybe<Scalars["String"]>;
  traderReceiptId?: Maybe<Scalars["String"]>;
  brokerReceiptId?: Maybe<Scalars["String"]>;
  vhuAgrementDemolisseurId?: Maybe<Scalars["String"]>;
  vhuAgrementBroyeurId?: Maybe<Scalars["String"]>;
  ecoOrganismeAgreements?: Maybe<Array<Scalars["URL"]>>;
  allowBsdasriTakeOverWithoutSignature?: Maybe<Scalars["Boolean"]>;
};

export type MutationUpdateFicheInterventionBsffArgs = {
  id: Scalars["ID"];
  numero: Scalars["String"];
  input: BsffFicheInterventionInput;
};

export type MutationUpdateFormArgs = {
  updateFormInput: UpdateFormInput;
};

export type MutationUpdateTraderReceiptArgs = {
  input: UpdateTraderReceiptInput;
};

export type MutationUpdateTransporterFieldsArgs = {
  id: Scalars["ID"];
  transporterNumberPlate?: Maybe<Scalars["String"]>;
  transporterCustomInfo?: Maybe<Scalars["String"]>;
};

export type MutationUpdateTransporterReceiptArgs = {
  input: UpdateTransporterReceiptInput;
};

export type MutationUpdateVhuAgrementArgs = {
  input: UpdateVhuAgrementInput;
};

export type MutationVerifyCompanyArgs = {
  input: VerifyCompanyInput;
};

export type MutationVerifyCompanyByAdminArgs = {
  input: VerifyCompanyByAdminInput;
};

/** Destination ultérieure prévue (case 12) */
export type NextDestination = {
  __typename?: "NextDestination";
  /** Traitement prévue (code D/R) */
  processingOperation?: Maybe<Scalars["String"]>;
  /** Établissement ultérieure */
  company?: Maybe<FormCompany>;
};

export type NextDestinationInput = {
  /** Traitement prévue (code D/R) */
  processingOperation: Scalars["String"];
  /** Établissement de destination ultérieur */
  company: InternationalCompanyInput;
};

/** Payload lié à l'ajout de segment de transport multimodal (case 20 à 21) */
export type NextSegmentInfoInput = {
  transporter?: Maybe<TransporterInput>;
  mode: TransportMode;
};

export type OrderBy = {
  type?: Maybe<OrderType>;
  readableId?: Maybe<OrderType>;
  emitter?: Maybe<OrderType>;
  recipient?: Maybe<OrderType>;
  waste?: Maybe<OrderType>;
};

export enum OrderType {
  Asc = "ASC",
  Desc = "DESC"
}

/** Informations sur le conditionnement */
export type PackagingInfo = {
  __typename?: "PackagingInfo";
  /** Type de conditionnement */
  type: Packagings;
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars["String"]>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars["Int"];
};

/** Payload lié à un élément de conditionnement */
export type PackagingInfoInput = {
  /** Type de conditionnement */
  type: Packagings;
  /** Description du conditionnement dans le cas où le type de conditionnement est `OTHER` */
  other?: Maybe<Scalars["String"]>;
  /**
   * Nombre de colis associés à ce conditionnement. Dans le cas d'un conditionnemt BENNE ou CITERNE,
   * le nombre de colis ne peut être supérieur à 2.
   */
  quantity: Scalars["Int"];
};

/** Type de packaging du déchet */
export enum Packagings {
  /** Fut */
  Fut = "FUT",
  /** GRV */
  Grv = "GRV",
  /** Citerne */
  Citerne = "CITERNE",
  /** Benne */
  Benne = "BENNE",
  /** Autre */
  Autre = "AUTRE"
}

export type PageInfo = {
  __typename?: "PageInfo";
  startCursor?: Maybe<Scalars["String"]>;
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
};

/** Payload permettant le rattachement d'un établissement à un utilisateur */
export type PrivateCompanyInput = {
  /** SIRET de l'établissement */
  siret: Scalars["String"];
  /** Identifiant GEREP de l'établissement */
  gerepId?: Maybe<Scalars["String"]>;
  /** Profil de l'établissement */
  companyTypes: Array<CompanyType>;
  /** Code NAF */
  codeNaf?: Maybe<Scalars["String"]>;
  /** Nom de l'établissement */
  companyName?: Maybe<Scalars["String"]>;
  /** Nom d'usage de l'établissement */
  givenName?: Maybe<Scalars["String"]>;
  /** Adresse de l'établissement */
  address?: Maybe<Scalars["String"]>;
  /** Récipissé transporteur (le cas échéant, pour les profils transporteur) */
  transporterReceiptId?: Maybe<Scalars["String"]>;
  /** Récipissé négociant (le cas échéant, pour les profils négociant) */
  traderReceiptId?: Maybe<Scalars["String"]>;
  /** Récipissé courtier (le cas échéant, pour les profils courtier) */
  brokerReceiptId?: Maybe<Scalars["String"]>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseurId?: Maybe<Scalars["String"]>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeurId?: Maybe<Scalars["String"]>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements?: Maybe<Array<Scalars["URL"]>>;
};

/** Payload de traitement d'un BSD */
export type ProcessedFormInput = {
  /** Traitement réalisé (code D/R) */
  processingOperationDone: Scalars["String"];
  /**
   * Description de l'opération d’élimination / valorisation (case 11)
   * Elle se complète automatiquement lorsque non fournie
   */
  processingOperationDescription?: Maybe<Scalars["String"]>;
  /** Personne en charge du traitement */
  processedBy: Scalars["String"];
  /** Date à laquelle le déchet a été traité */
  processedAt: Scalars["DateTime"];
  /** Destination ultérieure prévue (case 12) */
  nextDestination?: Maybe<NextDestinationInput>;
  /** Si oui ou non il y a eu perte de traçabalité */
  noTraceability?: Maybe<Scalars["Boolean"]>;
};

export enum ProcessingOperationTypes {
  D9 = "D9",
  D10 = "D10",
  D12 = "D12",
  R1 = "R1",
  R12 = "R12"
}

/** Type de quantité lors de l'émission */
export enum QuantityType {
  /** Quntité réelle */
  Real = "REAL",
  /** Quantité estimée */
  Estimated = "ESTIMATED"
}

/** Views of the Company ressource for the admin panel */
export type Query = {
  __typename?: "Query";
  /**
   * USAGE INTERNE > Mon Compte > Générer un token
   * Renvoie un token permettant de s'authentifier à l'API Trackdéchets
   */
  apiKey: Scalars["String"];
  /** Renvoie des BSD candidats à un regroupement dans une annexe 2 */
  appendixForms: Array<Form>;
  /** EXPERIMENTAL - Ne pas utiliser dans un contexte de production */
  bsda: Bsda;
  /**
   * Renvoie un token pour télécharger un pdf de bordereau
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  bsdaPdf: FileDownload;
  /** EXPERIMENTAL - Ne pas utiliser dans un contexte de production */
  bsdas: BsdaConnection;
  /** EXPERIMENTAL - Ne pas utiliser dans un contexte de production */
  bsdasri: Bsdasri;
  /**
   * Renvoie un token pour télécharger un pdf de bordereau
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  bsdasriPdf: FileDownload;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Renvoie les Bsdasris.
   * Par défaut, les dasris des différentes companies de l'utilisateur sont renvoyés.
   */
  bsdasris: BsdasriConnection;
  bsds: BsdConnection;
  /** Retourne un bordereau avec l'identifiant donné. */
  bsff: Bsff;
  /** Retourne un lien de téléchargement au format PDF du bordereau avec l'identifiant donné. */
  bsffPdf: FileDownload;
  /** Retourne tous les bordereaux de l'utilisateur connecté, en respectant les différents filtres. */
  bsffs: BsffConnection;
  /** EXPERIMENTAL - Ne pas utiliser dans un contexte de production */
  bsvhu: Bsvhu;
  /**
   * Renvoie un token pour télécharger un pdf de bordereau
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  bsvhuPdf: FileDownload;
  /**
   * EXPERIMENTAL - Ne pas utiliser dans un contexte de production
   * Tous les arguments sont optionnels.
   * Par défaut, retourne les 50 premiers bordereaux associés à entreprises dont vous êtes membres
   */
  bsvhus: BsvhuConnection;
  /** List companies for the company verfication table of the admin panel */
  companiesForVerification: CompanyForVerificationConnection;
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
  form: Form;
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
  invitation?: Maybe<Invitation>;
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
  membershipRequest?: Maybe<MembershipRequest>;
  /**
   * Effectue une recherche floue sur la base SIRENE et enrichit
   * les résultats avec des informations provenant de Trackdéchets
   */
  searchCompanies: Array<CompanySearchResult>;
  /** Renvoie des statistiques sur le volume de déchets entrant et sortant */
  stats: Array<CompanyStat>;
};

/** Views of the Company ressource for the admin panel */
export type QueryAppendixFormsArgs = {
  siret: Scalars["String"];
  wasteCode?: Maybe<Scalars["String"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsdaArgs = {
  id: Scalars["ID"];
};

/** Views of the Company ressource for the admin panel */
export type QueryBsdaPdfArgs = {
  id?: Maybe<Scalars["ID"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsdasArgs = {
  after?: Maybe<Scalars["ID"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["ID"]>;
  last?: Maybe<Scalars["Int"]>;
  where?: Maybe<BsdaWhere>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsdasriArgs = {
  id: Scalars["ID"];
};

/** Views of the Company ressource for the admin panel */
export type QueryBsdasriPdfArgs = {
  id?: Maybe<Scalars["ID"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsdasrisArgs = {
  after?: Maybe<Scalars["ID"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["ID"]>;
  last?: Maybe<Scalars["Int"]>;
  where?: Maybe<BsdasriWhere>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsdsArgs = {
  clue?: Maybe<Scalars["String"]>;
  where?: Maybe<BsdWhere>;
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  orderBy?: Maybe<OrderBy>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsffArgs = {
  id: Scalars["ID"];
};

/** Views of the Company ressource for the admin panel */
export type QueryBsffPdfArgs = {
  id: Scalars["ID"];
};

/** Views of the Company ressource for the admin panel */
export type QueryBsffsArgs = {
  after?: Maybe<Scalars["ID"]>;
  before?: Maybe<Scalars["ID"]>;
  first?: Maybe<Scalars["Int"]>;
  last?: Maybe<Scalars["Int"]>;
  where?: Maybe<BsffWhere>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsvhuArgs = {
  id: Scalars["ID"];
};

/** Views of the Company ressource for the admin panel */
export type QueryBsvhuPdfArgs = {
  id?: Maybe<Scalars["ID"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryBsvhusArgs = {
  after?: Maybe<Scalars["ID"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["ID"]>;
  last?: Maybe<Scalars["Int"]>;
  where?: Maybe<BsvhuWhere>;
};

/** Views of the Company ressource for the admin panel */
export type QueryCompaniesForVerificationArgs = {
  first?: Maybe<Scalars["Int"]>;
  last?: Maybe<Scalars["Int"]>;
  skip?: Maybe<Scalars["Int"]>;
  where?: Maybe<CompanyForVerificationWhere>;
};

/** Views of the Company ressource for the admin panel */
export type QueryCompanyInfosArgs = {
  siret: Scalars["String"];
};

/** Views of the Company ressource for the admin panel */
export type QueryFavoritesArgs = {
  siret: Scalars["String"];
  type: FavoriteType;
};

/** Views of the Company ressource for the admin panel */
export type QueryFormArgs = {
  id?: Maybe<Scalars["ID"]>;
  readableId?: Maybe<Scalars["String"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryFormPdfArgs = {
  id?: Maybe<Scalars["ID"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryFormsArgs = {
  siret?: Maybe<Scalars["String"]>;
  skip?: Maybe<Scalars["Int"]>;
  cursorAfter?: Maybe<Scalars["ID"]>;
  first?: Maybe<Scalars["Int"]>;
  cursorBefore?: Maybe<Scalars["ID"]>;
  last?: Maybe<Scalars["Int"]>;
  sentAfter?: Maybe<Scalars["String"]>;
  updatedAfter?: Maybe<Scalars["String"]>;
  status?: Maybe<Array<FormStatus>>;
  roles?: Maybe<Array<FormRole>>;
  hasNextStep?: Maybe<Scalars["Boolean"]>;
  siretPresentOnForm?: Maybe<Scalars["String"]>;
  wasteCode?: Maybe<Scalars["String"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryFormsLifeCycleArgs = {
  siret?: Maybe<Scalars["String"]>;
  loggedBefore?: Maybe<Scalars["String"]>;
  loggedAfter?: Maybe<Scalars["String"]>;
  cursorAfter?: Maybe<Scalars["String"]>;
  cursorBefore?: Maybe<Scalars["String"]>;
  formId?: Maybe<Scalars["ID"]>;
};

/** Views of the Company ressource for the admin panel */
export type QueryFormsRegisterArgs = {
  sirets: Array<Scalars["String"]>;
  exportType?: Maybe<FormsRegisterExportType>;
  startDate?: Maybe<Scalars["DateTime"]>;
  endDate?: Maybe<Scalars["DateTime"]>;
  wasteCode?: Maybe<Scalars["String"]>;
  exportFormat?: Maybe<FormsRegisterExportFormat>;
};

/** Views of the Company ressource for the admin panel */
export type QueryInvitationArgs = {
  hash: Scalars["String"];
};

/** Views of the Company ressource for the admin panel */
export type QueryMembershipRequestArgs = {
  id?: Maybe<Scalars["ID"]>;
  siret?: Maybe<Scalars["String"]>;
};

/** Views of the Company ressource for the admin panel */
export type QuerySearchCompaniesArgs = {
  clue: Scalars["String"];
  department?: Maybe<Scalars["String"]>;
};

/** Payload de réception d'un BSD */
export type ReceivedFormInput = {
  /** Nom de la personne en charge de la réception du déchet (case 10) */
  receivedBy: Scalars["String"];
  /** Date à laquelle le déchet a été reçu (case 10) */
  receivedAt: Scalars["DateTime"];
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus?: Maybe<WasteAcceptationStatusInput>;
  /** Raison du refus (case 10). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: Maybe<Scalars["String"]>;
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt?: Maybe<Scalars["DateTime"]>;
  /**
   * Quantité réelle présentée (case 10).
   *  Doit être supérieure à 0 lorsque le déchet est accepté.
   *  Doit être égale à 0 lorsque le déchet est refusé.
   */
  quantityReceived?: Maybe<Scalars["Float"]>;
};

/**
 * Installation de destination ou d'entreprosage
 * ou de reconditionnement prévue (case 2)
 */
export type Recipient = {
  __typename?: "Recipient";
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars["String"]>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: Maybe<Scalars["String"]>;
  /** Établissement de destination */
  company?: Maybe<FormCompany>;
  /** Indique si c'est un établissement d'entreposage temporaire ou de reocnditionnement */
  isTempStorage?: Maybe<Scalars["Boolean"]>;
};

/**
 * Payload lié à l'installation de destination ou d'entreprosage
 * ou de reconditionnement prévue (case 2)
 */
export type RecipientInput = {
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars["String"]>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: Maybe<Scalars["String"]>;
  /** Établissement de destination */
  company?: Maybe<CompanyInput>;
  /** Si c'est un entreprosage provisoire ou reconditionnement */
  isTempStorage?: Maybe<Scalars["Boolean"]>;
};

/** Payload de regroupement */
export type RegroupedBsdasriInput = {
  /** Identifiant unique du bordereau */
  id?: Maybe<Scalars["ID"]>;
};

/** Payload lié au détails du déchet du BSD suite (case 14 à 19) */
export type ResealedFormInput = {
  /** Destination finale du déchet (case 14) */
  destination?: Maybe<DestinationInput>;
  /** Détail du déchet en cas de reconditionnement (case 15 à 19) */
  wasteDetails?: Maybe<WasteDetailsRepackagingInput>;
  /** Transporteur du déchet reconditionné */
  transporter?: Maybe<TransporterInput>;
};

/** Payload lié au détails du déchet du BSD suite et à la signature de l'envoi (case 14 à 20) */
export type ResentFormInput = {
  /** Destination finale du déchet (case 14) */
  destination?: Maybe<DestinationInput>;
  /** Détail du déchet en cas de reconditionnement (case 15 à 19) */
  wasteDetails?: Maybe<WasteDetailsRepackagingInput>;
  /** Transporteur du déchet reconditionné */
  transporter?: Maybe<TransporterInput>;
  /** Nom du signataire du BSD suite  (case 19) */
  signedBy: Scalars["String"];
  /** Date de signature du BSD suite (case 19). Défaut à la date d'aujourd'hui. */
  signedAt: Scalars["DateTime"];
};

/**
 * Rubrique ICPE d'un établissement avec les autorisations associées
 * Pour plus de détails, se référer à la
 * [nomenclature des ICPE](https://www.georisques.gouv.fr/articles-risques/les-installations-classees-pour-la-protection-de-lenvironnement#nomenclature-des-installations-classees)
 */
export type Rubrique = {
  __typename?: "Rubrique";
  /**
   * Numéro de rubrique tel que défini dans la nomenclature des ICPE
   * Ex: 2710
   */
  rubrique: Scalars["String"];
  /** Alinéa pour la rubrique concerné */
  alinea?: Maybe<Scalars["String"]>;
  /** État de l'activité, ex: 'En fonct', 'À l'arrêt' */
  etatActivite?: Maybe<Scalars["String"]>;
  /** Régime autorisé pour la rubrique: déclaratif, autorisation, seveso, etc */
  regimeAutorise?: Maybe<Scalars["String"]>;
  /**
   * Description de l'activité:
   * Ex: traitement thermique de déchets dangereux
   */
  activite?: Maybe<Scalars["String"]>;
  /** Catégorie d'établissement associé: TTR, VHU, Traitement */
  category: Scalars["String"];
  /** Volume autorisé */
  volume?: Maybe<Scalars["String"]>;
  /** Unité utilisé pour le volume autorisé */
  unite?: Maybe<Scalars["String"]>;
  /** Type de déchets autorisé */
  wasteType?: Maybe<WasteType>;
};

export type SendVerificationCodeLetterInput = {
  siret: Scalars["String"];
};

/** Payload de signature d'un BSD */
export type SentFormInput = {
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt: Scalars["DateTime"];
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars["String"];
};

export type Signature = {
  __typename?: "Signature";
  date?: Maybe<Scalars["DateTime"]>;
  author?: Maybe<Scalars["String"]>;
};

/** Dénomination de l'auteur de la signature */
export enum SignatureAuthor {
  /** L'auteur de la signature est l'émetteur du déchet */
  Emitter = "EMITTER",
  /** L'auteur de la signature est l'éco-organisme figurant sur le BSD */
  EcoOrganisme = "ECO_ORGANISME"
}

/** Payload simplifié de signature d'un BSD par un transporteur */
export type SignatureFormInput = {
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt: Scalars["DateTime"];
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars["String"];
};

export type SignatureInput = {
  date: Scalars["DateTime"];
  author: Scalars["String"];
};

export enum SignatureTypeInput {
  Emission = "EMISSION",
  Transport = "TRANSPORT",
  Operation = "OPERATION"
}

export type SignupInput = {
  /** Email de l'utilisateur */
  email: Scalars["String"];
  /** Mot de passe de l'utilisateur */
  password: Scalars["String"];
  /** Nom de l'utilisateur */
  name: Scalars["String"];
  /** Numéro de téléphone de l'utilisateur */
  phone?: Maybe<Scalars["String"]>;
};

/** Statistiques */
export type Stat = {
  __typename?: "Stat";
  /** Code déchet */
  wasteCode: Scalars["String"];
  /** Quantité entrante */
  incoming: Scalars["Float"];
  /** Qantité sortante */
  outgoing: Scalars["Float"];
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
  __typename?: "StateSummary";
  /** Quantité la plus à jour */
  quantity?: Maybe<Scalars["Float"]>;
  /**
   * DEPRECATED Packaging le plus à jour
   * @deprecated Utiliser packagingInfos
   */
  packagings: Array<Packagings>;
  /** Packaging le plus à jour */
  packagingInfos: Array<PackagingInfo>;
  /** Code ONU le plus à jour */
  onuCode?: Maybe<Scalars["String"]>;
  /** Prochaine entreprise à transporter le déchet (entreprise en case 8 ou 18) */
  transporter?: Maybe<FormCompany>;
  /** Numéro de plaque d'immatriculation */
  transporterNumberPlate?: Maybe<Scalars["String"]>;
  /** Information libre, destinée aux transporteurs */
  transporterCustomInfo?: Maybe<Scalars["String"]>;
  /** Prochaine entreprise à recevoir le déchet (entreprise en case 2 ou 14) */
  recipient?: Maybe<FormCompany>;
  /** Prochaine entreprise à émettre le déchet (entreprise en case 1 ou 13) */
  emitter?: Maybe<FormCompany>;
  /** Date de la dernière action sur le bordereau */
  lastActionOn?: Maybe<Scalars["DateTime"]>;
};

/** Changement de statut d'un bordereau */
export type StatusLog = {
  __typename?: "StatusLog";
  /** Identifiant du log */
  id?: Maybe<Scalars["ID"]>;
  /** Statut du bordereau après le changement de statut */
  status?: Maybe<FormStatus>;
  /** Date à laquelle le changement de statut a été effectué */
  loggedAt?: Maybe<Scalars["DateTime"]>;
  /** Valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription) */
  updatedFields?: Maybe<Scalars["JSON"]>;
  /** BSD concerné */
  form?: Maybe<StatusLogForm>;
  /** Utilisateur à l'origine de la modification */
  user?: Maybe<StatusLogUser>;
};

/** Information sur un BSD dans les logs de modifications de statuts */
export type StatusLogForm = {
  __typename?: "StatusLogForm";
  /** Identifiant du BSD */
  id?: Maybe<Scalars["ID"]>;
  /**
   * N° du bordereau
   * @deprecated Le readableId apparaît sur le CERFA mais l'id doit être utilisé comme identifiant.
   */
  readableId?: Maybe<Scalars["String"]>;
};

/** Utilisateur ayant modifié le BSD */
export type StatusLogUser = {
  __typename?: "StatusLogUser";
  id?: Maybe<Scalars["ID"]>;
  email?: Maybe<Scalars["String"]>;
};

export type Subscription = {
  __typename?: "Subscription";
  /**
   * DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`
   *
   * Permet de s'abonner aux changements de statuts d'un BSD
   */
  forms?: Maybe<FormSubscription>;
};

export type SubscriptionFormsArgs = {
  token: Scalars["String"];
};

/** Payload de prise en charge de segment */
export type TakeOverInput = {
  takenOverAt: Scalars["DateTime"];
  takenOverBy: Scalars["String"];
};

/** Données du BSD suite sur la partie entreposage provisoire ou reconditionnement, rattachées à un BSD existant */
export type TemporaryStorageDetail = {
  __typename?: "TemporaryStorageDetail";
  /** Établissement qui stocke temporairement le déchet (case 13) */
  temporaryStorer?: Maybe<TemporaryStorer>;
  /**
   * Installation de destination prévue (case 14) à remplir par le producteur ou
   * le site d'entreposage provisoire
   */
  destination?: Maybe<Destination>;
  /** Détails du déchet (cases 15, 16 et 17) */
  wasteDetails?: Maybe<WasteDetails>;
  /** Transporteur du déchet (case 18) */
  transporter?: Maybe<Transporter>;
  /** Nom du signataire du BSD suite  (case 19) */
  signedBy?: Maybe<Scalars["String"]>;
  /** Date de signature du BSD suite (case 19) */
  signedAt?: Maybe<Scalars["DateTime"]>;
};

export type TemporaryStorageDetailInput = {
  destination?: Maybe<DestinationInput>;
};

export type TemporaryStorer = {
  __typename?: "TemporaryStorer";
  quantityType?: Maybe<QuantityType>;
  quantityReceived?: Maybe<Scalars["Float"]>;
  wasteAcceptationStatus?: Maybe<Scalars["String"]>;
  wasteRefusalReason?: Maybe<Scalars["String"]>;
  receivedAt?: Maybe<Scalars["DateTime"]>;
  receivedBy?: Maybe<Scalars["String"]>;
};

export type TempStoredFormInput = {
  /** Statut d'acceptation du déchet (case 13) */
  wasteAcceptationStatus?: Maybe<WasteAcceptationStatusInput>;
  /** Raison du refus (case 13). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: Maybe<Scalars["String"]>;
  /** Nom de la personne en charge de la réception du déchet (case 13) */
  receivedBy: Scalars["String"];
  /** Date à laquelle le déchet a été reçu (case 13) */
  receivedAt: Scalars["DateTime"];
  /** Date à laquelle le déchet a été accepté ou refusé (case 13). Défaut à la date d'aujourd'hui. */
  signedAt?: Maybe<Scalars["DateTime"]>;
  /**
   * Quantité réelle présentée (case 13)
   *  Doit être supérieure à 0 lorsque le déchet est accepté.
   *  Doit être égale à 0 lorsque le déchet est refusé.
   */
  quantityReceived: Scalars["Float"];
  /** Réelle ou estimée */
  quantityType: QuantityType;
};

export type TempStorerAcceptedFormInput = {
  /** Date à laquelle le déchet a été accepté ou refusé (case 13). */
  signedAt: Scalars["DateTime"];
  /** Nom de la personne en charge de l'acceptation du déchet (case 13) */
  signedBy: Scalars["String"];
  /** Statut d'acceptation du déchet (case 13) */
  wasteAcceptationStatus: WasteAcceptationStatusInput;
  /** Raison du refus (case 13). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: Maybe<Scalars["String"]>;
  /**
   * Quantité réelle présentée (case 13)
   *  Doit être supérieure à 0 lorsque le déchet est accepté.
   *  Doit être égale à 0 lorsque le déchet est refusé.
   */
  quantityReceived: Scalars["Float"];
  /** Réelle ou estimée */
  quantityType: QuantityType;
};

/** Négociant (case 7) */
export type Trader = {
  __typename?: "Trader";
  /** Établissement négociant */
  company?: Maybe<FormCompany>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars["String"]>;
  /** Département */
  department?: Maybe<Scalars["String"]>;
  /** Limite de validité */
  validityLimit?: Maybe<Scalars["DateTime"]>;
};

/** Payload lié au négociant */
export type TraderInput = {
  /** N° de récipissé */
  receipt?: Maybe<Scalars["String"]>;
  /** Département */
  department?: Maybe<Scalars["String"]>;
  /** Limite de validité */
  validityLimit?: Maybe<Scalars["DateTime"]>;
  /** Établissement négociant */
  company?: Maybe<CompanyInput>;
};

/** Récépissé négociant */
export type TraderReceipt = {
  __typename?: "TraderReceipt";
  id: Scalars["ID"];
  /** Numéro de récépissé négociant */
  receiptNumber: Scalars["String"];
  /** Limite de validité du récépissé */
  validityLimit: Scalars["DateTime"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

/** Collecteur - transporteur (case 8) */
export type Transporter = {
  __typename?: "Transporter";
  /** Établissement collecteur - transporteur */
  company?: Maybe<FormCompany>;
  /** Exemption de récipissé */
  isExemptedOfReceipt?: Maybe<Scalars["Boolean"]>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars["String"]>;
  /** Département */
  department?: Maybe<Scalars["String"]>;
  /** Limite de validité du récipissé */
  validityLimit?: Maybe<Scalars["DateTime"]>;
  /** Numéro de plaque d'immatriculation */
  numberPlate?: Maybe<Scalars["String"]>;
  /** Information libre, destinée aux transporteurs */
  customInfo?: Maybe<Scalars["String"]>;
};

/** Collecteur - transporteur (case 8) */
export type TransporterInput = {
  /** Établissement collecteur - transporteur */
  company?: Maybe<CompanyInput>;
  /** Exemption de récépissé */
  isExemptedOfReceipt?: Maybe<Scalars["Boolean"]>;
  /** N° de récipissé. Obligatoire lorsque l'exemption de récépissé n'est pas précisée */
  receipt?: Maybe<Scalars["String"]>;
  /** Département du récépissé. Obligatoire lorsque l'exemption de récépissé n'est pas précisée */
  department?: Maybe<Scalars["String"]>;
  /** Limite de validité du récépissé. Obligatoire lorsque l'exemption de récépissé n'est pas précisée */
  validityLimit?: Maybe<Scalars["DateTime"]>;
  /** Numéro de plaque d'immatriculation */
  numberPlate?: Maybe<Scalars["String"]>;
  /** Information libre, destinée aux transporteurs */
  customInfo?: Maybe<Scalars["String"]>;
};

/** Récépissé transporteur */
export type TransporterReceipt = {
  __typename?: "TransporterReceipt";
  id: Scalars["ID"];
  /** Numéro de récépissé transporteur */
  receiptNumber: Scalars["String"];
  /** Limite de validité du récépissé */
  validityLimit: Scalars["DateTime"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

/** Payload de signature d'un BSD par un transporteur */
export type TransporterSignatureFormInput = {
  /** Date de l'envoi du déchet par l'émetteur (case 9) */
  sentAt: Scalars["DateTime"];
  /** Si oui ou non le BSD a été signé par un transporteur */
  signedByTransporter: Scalars["Boolean"];
  /** Code de signature permettant d'authentifier l'émetteur */
  securityCode: Scalars["Int"];
  /** Dénomination de l'auteur de la signature, par défaut il s'agit de l'émetteur */
  signatureAuthor?: Maybe<SignatureAuthor>;
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars["String"];
  /** Si oui on non le BSD a été signé par l'émetteur */
  signedByProducer: Scalars["Boolean"];
  /** Conditionnements */
  packagingInfos?: Maybe<Array<PackagingInfoInput>>;
  /** DEPRECATED - Conditionnement */
  packagings?: Maybe<Array<Maybe<Packagings>>>;
  /** Quantité en tonnes */
  quantity: Scalars["Float"];
  /** Code ONU */
  onuCode?: Maybe<Scalars["String"]>;
};

export enum TransportMode {
  Road = "ROAD",
  Rail = "RAIL",
  Air = "AIR",
  River = "RIVER",
  Sea = "SEA"
}

export type TransportSegment = {
  __typename?: "TransportSegment";
  id: Scalars["ID"];
  /** Siret du transporteur précédent */
  previousTransporterCompanySiret?: Maybe<Scalars["String"]>;
  /** Transporteur du segment */
  transporter?: Maybe<Transporter>;
  /** Mode de transport */
  mode?: Maybe<TransportMode>;
  /** Date de prise en charge */
  takenOverAt?: Maybe<Scalars["DateTime"]>;
  /** Reponsable de la prise en charge */
  takenOverBy?: Maybe<Scalars["String"]>;
  /** Prêt à être pris en charge */
  readyToTakeOver?: Maybe<Scalars["Boolean"]>;
  /** Numéro du segment */
  segmentNumber?: Maybe<Scalars["Int"]>;
};

/** Payload d'édition d'un récépissé courtier */
export type UpdateBrokerReceiptInput = {
  /** The id of the broker receipt to modify */
  id: Scalars["ID"];
  /** Numéro de récépissé courtier */
  receiptNumber?: Maybe<Scalars["String"]>;
  /** Limite de validité du récépissé */
  validityLimit?: Maybe<Scalars["DateTime"]>;
  /** Département ayant enregistré la déclaration */
  department?: Maybe<Scalars["String"]>;
};

/** Payload de mise à jour d'un bordereau */
export type UpdateFormInput = {
  /** Identifiant opaque */
  id: Scalars["ID"];
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: Maybe<Scalars["String"]>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: Maybe<EmitterInput>;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: Maybe<RecipientInput>;
  /** Transporteur du déchet (case 8) */
  transporter?: Maybe<TransporterInput>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: Maybe<WasteDetailsInput>;
  /** Négociant (case 7) */
  trader?: Maybe<TraderInput>;
  /** Courtier */
  broker?: Maybe<BrokerInput>;
  /** Annexe 2 */
  appendix2Forms?: Maybe<Array<AppendixFormInput>>;
  ecoOrganisme?: Maybe<EcoOrganismeInput>;
  temporaryStorageDetail?: Maybe<TemporaryStorageDetailInput>;
};

/** Payload d'édition d'un récépissé négociant */
export type UpdateTraderReceiptInput = {
  /** The id of the trader receipt to modify */
  id: Scalars["ID"];
  /** Numéro de récépissé négociant */
  receiptNumber?: Maybe<Scalars["String"]>;
  /** Limite de validité du récépissé */
  validityLimit?: Maybe<Scalars["DateTime"]>;
  /** Département ayant enregistré la déclaration */
  department?: Maybe<Scalars["String"]>;
};

/** Payload d'édition d'un récépissé transporteur */
export type UpdateTransporterReceiptInput = {
  /** The id of the transporter receipt to modify */
  id: Scalars["ID"];
  /** Numéro de récépissé transporteur */
  receiptNumber?: Maybe<Scalars["String"]>;
  /** Limite de validité du récépissé */
  validityLimit?: Maybe<Scalars["DateTime"]>;
  /** Département ayant enregistré la déclaration */
  department?: Maybe<Scalars["String"]>;
};

/** Payload d'édition d'un agrément VHU */
export type UpdateVhuAgrementInput = {
  /** ID de l'agrément VHU à modifier */
  id: Scalars["ID"];
  /** Numéro d'agrément VHU */
  agrementNumber?: Maybe<Scalars["String"]>;
  /** Département ayant enregistré la déclaration */
  department?: Maybe<Scalars["String"]>;
};

/** Lien d'upload */
export type UploadLink = {
  __typename?: "UploadLink";
  /** URL signé permettant d'uploader un fichier */
  signedUrl?: Maybe<Scalars["String"]>;
  /** Clé permettant l'upload du fichier */
  key?: Maybe<Scalars["String"]>;
};

/** Représente un utilisateur sur la plateforme Trackdéchets */
export type User = {
  __typename?: "User";
  /** Identifiant opaque */
  id: Scalars["ID"];
  /** Email de l'utiliateur */
  email: Scalars["String"];
  /** Nom de l'utilisateur */
  name?: Maybe<Scalars["String"]>;
  /** Qualité d'administrateur. Rôle reservé aux agents de l'administration */
  isAdmin?: Maybe<Scalars["Boolean"]>;
  /** Numéro de téléphone de l'utilisateur */
  phone?: Maybe<Scalars["String"]>;
  /** Liste des établissements dont l'utilisateur est membre */
  companies: Array<CompanyPrivate>;
};

/**
 * Liste les différents rôles d'un utilisateur au sein
 * d'un établissement.
 * Les admins peuvent:
 * * consulter/éditer les bordereaux
 * * gérer les utilisateurs de l'établissement
 * * éditer les informations de la fiche entreprise
 * * demander le renouvellement du code de signature
 * * Éditer les informations de la fiche entreprise
 * Les membres peuvent:
 * * consulter/éditer les bordereaux
 * * consulter le reste des informations
 * Vous pouvez consulter [cette page](https://docs.google.com/spreadsheets/d/12K9Bd2k5l4uqXhS0h5uI00lNEzW7C-1t-NDOyxy8aKk/edit#gid=0)
 * pour le détail de chacun des rôles
 */
export enum UserRole {
  Member = "MEMBER",
  Admin = "ADMIN"
}

export type VerifyCompanyByAdminInput = {
  siret: Scalars["String"];
  verificationComment?: Maybe<Scalars["String"]>;
};

export type VerifyCompanyInput = {
  /** Le SIRET de l'établissement à vérifier */
  siret: Scalars["String"];
  /** Le code de vérification de l'établissement envoyé par courrier */
  code: Scalars["String"];
};

/** Agrément VHU */
export type VhuAgrement = {
  __typename?: "VhuAgrement";
  id: Scalars["ID"];
  /** Numéro d'agrément VHU */
  agrementNumber: Scalars["String"];
  /** Département ayant enregistré la déclaration */
  department: Scalars["String"];
};

/** Statut d'acceptation d'un déchet */
export enum WasteAcceptationStatusInput {
  /** Accepté en totalité */
  Accepted = "ACCEPTED",
  /** Refusé */
  Refused = "REFUSED",
  /** Refus partiel */
  PartiallyRefused = "PARTIALLY_REFUSED"
}

/** Détails du déchet (case 3, 4, 5, 6) */
export type WasteDetails = {
  __typename?: "WasteDetails";
  /** Rubrique déchet au format |_|_| |_|_| |_|_| (*) */
  code?: Maybe<Scalars["String"]>;
  /** Dénomination usuelle */
  name?: Maybe<Scalars["String"]>;
  /** Code ONU */
  onuCode?: Maybe<Scalars["String"]>;
  /** Conditionnements */
  packagingInfos?: Maybe<Array<PackagingInfo>>;
  /**
   * Conditionnement
   * @deprecated Utiliser `packagingInfos`
   */
  packagings?: Maybe<Array<Packagings>>;
  /**
   * Autre packaging (préciser)
   * @deprecated Utiliser `packagingInfos`
   */
  otherPackaging?: Maybe<Scalars["String"]>;
  /**
   * Nombre de colis
   * @deprecated Utiliser `packagingInfos`
   */
  numberOfPackages?: Maybe<Scalars["Int"]>;
  /** Quantité en tonnes */
  quantity?: Maybe<Scalars["Float"]>;
  /** Réelle ou estimée */
  quantityType?: Maybe<QuantityType>;
  /** Consistance */
  consistence?: Maybe<Consistence>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: Maybe<Scalars["Boolean"]>;
};

/** Payload lié au détails du déchet (case 3 à 6) */
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
  code?: Maybe<Scalars["String"]>;
  /** Dénomination usuelle */
  name?: Maybe<Scalars["String"]>;
  /** Code ONU. Obligatoire pour les déchets dangereux. Merci d'indiquer 'non soumis' si nécessaire. */
  onuCode?: Maybe<Scalars["String"]>;
  /** Liste de conditionnements. Les conditionnements CITERNE et BENNE ne peuvent pas être associés à un autre conditionnement */
  packagingInfos?: Maybe<Array<PackagingInfoInput>>;
  /** DEPRECATED - Conditionnement */
  packagings?: Maybe<Array<Maybe<Packagings>>>;
  /** DEPRECATED - Autre packaging (préciser) */
  otherPackaging?: Maybe<Scalars["String"]>;
  /** DEPRECATED - Nombre de colis */
  numberOfPackages?: Maybe<Scalars["Int"]>;
  /** Quantité en tonnes */
  quantity?: Maybe<Scalars["Float"]>;
  /** Réelle ou estimée */
  quantityType?: Maybe<QuantityType>;
  /** Consistance */
  consistence?: Maybe<Consistence>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: Maybe<Scalars["Boolean"]>;
};

/** Payload lié au reconditionnement (case 15 à 17) */
export type WasteDetailsRepackagingInput = {
  /** Code ONU */
  onuCode?: Maybe<Scalars["String"]>;
  /** Conditionnements */
  packagingInfos?: Maybe<Array<PackagingInfoInput>>;
  /** Quantité en tonnes */
  quantity?: Maybe<Scalars["Float"]>;
  /** Réelle ou estimée */
  quantityType?: Maybe<QuantityType>;
};

/** Type de déchets autorisé pour une rubrique */
export enum WasteType {
  /** Déchet inerte */
  Inerte = "INERTE",
  /** Déchet non dangereux */
  NotDangerous = "NOT_DANGEROUS",
  /** Déchet dangereux */
  Dangerous = "DANGEROUS"
}

/** Informations sur une adresse chantier */
export type WorkSite = {
  __typename?: "WorkSite";
  name?: Maybe<Scalars["String"]>;
  address?: Maybe<Scalars["String"]>;
  city?: Maybe<Scalars["String"]>;
  postalCode?: Maybe<Scalars["String"]>;
  infos?: Maybe<Scalars["String"]>;
};

/** Payload d'une adresse chantier */
export type WorkSiteInput = {
  address?: Maybe<Scalars["String"]>;
  city?: Maybe<Scalars["String"]>;
  infos?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  postalCode?: Maybe<Scalars["String"]>;
};

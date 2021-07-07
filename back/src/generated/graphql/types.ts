import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig
} from "graphql";
import { GraphQLContext } from "../../types";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = {
  [X in Exclude<keyof T, K>]?: T[X];
} &
  { [P in K]-?: NonNullable<T[P]> };
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
  DateTime: Date;
  /** Chaîne de caractère au format URL, débutant par un protocole http(s). */
  URL: URL;
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

export type Bsd = Form | Bsdasri | Bsvhu | Bsda | Bsff;

export type Bsda = {
  __typename?: "Bsda";
  /** Bordereau n° */
  id: Scalars["ID"];
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

export type BsdaAcceptationStatus =
  | "ACCEPTED"
  | "REFUSED"
  | "PARTIALLY_REFUSED";

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

export type BsdaConsistence = "SOLIDE" | "PULVERULENT" | "OTHER";

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

export type BsdaPackagingType =
  | "PALETTE_FILME"
  | "BIG_BAG"
  | "DEPOT_BAG"
  | "SAC_RENFORCE"
  | "BODY_BENNE"
  | "OTHER";

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

export type BsdaQuantityType = "REAL" | "ESTIMATED";

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

export type BsdaSignatureType = "EMISSION" | "WORK" | "TRANSPORT" | "OPERATION";

export type BsdaSignatureWhere = {
  date: DateFilter;
};

/** Bordereau Bsdasri */
export type Bsdasri = {
  __typename?: "Bsdasri";
  id: Scalars["ID"];
  status: BsdasriStatus;
  bsdasriType: BsdasriType;
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
export type BsdasriEmitterType =
  /** Producteur */
  | "PRODUCER"
  /** Installation de regroupement */
  | "COLLECTOR";

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
  /**
   * Code de traitement
   * Les codes R12 et D12 ne sont autorisé que si le destinataire est une installation TTR (tri transit regroupement).
   */
  processingOperation?: Maybe<Scalars["String"]>;
  processedAt?: Maybe<Scalars["DateTime"]>;
};

export type BsdasriOperationQuantity = {
  __typename?: "BsdasriOperationQuantity";
  /** Quantité en kg */
  value?: Maybe<Scalars["Float"]>;
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
export type BsdasriPackagings =
  /** Caisse en carton avec sac en plastique */
  | "BOITE_CARTON"
  /** Fûts ou jerrican à usage unique */
  | "FUT"
  /** Boîtes et Mini-collecteurs pour déchets perforants */
  | "BOITE_PERFORANTS"
  /** Grand emballage */
  | "GRAND_EMBALLAGE"
  /** Grand récipient pour vrac */
  | "GRV"
  /** Autre */
  | "AUTRE";

export type BsdasriQuantity = {
  __typename?: "BsdasriQuantity";
  /** Quantité en kg */
  value?: Maybe<Scalars["Float"]>;
  /** Quantité réélle (pesée ou estimée) */
  type?: Maybe<QuantityType>;
};

export type BsdasriQuantityInput = {
  value?: Maybe<Scalars["Float"]>;
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

export type BsdasriRole =
  /** Les Bsdasri dont je suis transporteur */
  | "TRANSPORTER"
  /** Les Bsdasri dont je suis la destination de traitement */
  | "RECIPIENT"
  /** Les Bsdasri dont je suis l'émetteur */
  | "EMITTER";

export type BsdasriSignature = {
  __typename?: "BsdasriSignature";
  date?: Maybe<Scalars["DateTime"]>;
  author?: Maybe<Scalars["String"]>;
};

export type BsdasriSignatureInput = {
  type: BsdasriSignatureType;
  author: Scalars["String"];
};

export type BsdasriSignatureType =
  /** Signature du cadre émetteur (PRED) */
  | "EMISSION"
  /** Signature du cadre collecteur transporteur */
  | "TRANSPORT"
  /** Signature de la réception du déchet */
  | "RECEPTION"
  /** Signature du traitement du déchet */
  | "OPERATION";

export type BsdasriSignatureWhere = {
  date: DateFilter;
};

export type BsdasriSignatureWithSecretCodeInput = {
  author: Scalars["String"];
  securityCode?: Maybe<Scalars["Int"]>;
};

export type BsdasriStatus =
  /** Bsdasri dans son état initial */
  | "INITIAL"
  /** Optionnel, Bsdasri signé par la PRED (émetteur) */
  | "SIGNED_BY_PRODUCER"
  /** Bsdasri envoyé vers l'établissement de destination */
  | "SENT"
  /** Bsdasri reçu par l'établissement de destination */
  | "RECEIVED"
  /** Bsdasri dont les déchets ont été traités */
  | "PROCESSED"
  /** Déchet refusé */
  | "REFUSED";

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

export type BsdasriType =
  /** Bordereau dasri simple */
  | "SIMPLE"
  /** Bordereau dasri de groupement */
  | "GROUPING"
  /** (Bientôt disponible) - Bordereau dasri de synthèse */
  | "SYNTHESIS";

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
  refusedQuantity?: Maybe<Scalars["Float"]>;
};

export type BsdasriWasteAcceptationInput = {
  status?: Maybe<WasteAcceptationStatusInput>;
  refusalReason?: Maybe<Scalars["String"]>;
  refusedQuantity?: Maybe<Scalars["Float"]>;
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
  /** Expérimental : Filtre le résultat sur l'ID des bordereaux */
  id_in?: Maybe<Array<Scalars["ID"]>>;
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

export type BsdaStatus =
  | "INITIAL"
  | "SIGNED_BY_PRODUCER"
  | "SIGNED_BY_WORKER"
  | "SENT"
  | "PROCESSED"
  | "REFUSED"
  | "AWAITING_CHILD";

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
export type BsdaType =
  | "COLLECTION_2710"
  | "OTHER_COLLECTIONS"
  | "GATHERING"
  | "RESHIPMENT";

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

export type BsdType = "BSDD" | "BSDASRI" | "BSVHU" | "BSDA" | "BSFF";

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
  /** Statut qui synthétise où en est le déchet dans son cheminement. */
  status: BsffStatus;
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
  company?: Maybe<FormCompany>;
  /** Déclaration de réception du déchet. */
  reception?: Maybe<BsffReception>;
  /** Déclaration de traitement du déchet. */
  operation?: Maybe<BsffOperation>;
  /** Opération de traitement prévu initialement. */
  plannedOperation?: Maybe<BsffPlannedOperation>;
  /** Numéro CAP. */
  cap?: Maybe<Scalars["String"]>;
};

export type BsffDestinationInput = {
  company?: Maybe<CompanyInput>;
  cap?: Maybe<Scalars["String"]>;
  reception?: Maybe<BsffDestinationReceptionInput>;
  plannedOperation?: Maybe<BsffDestinationPlannedOperationInput>;
  operation?: Maybe<BsffDestinationOperationInput>;
};

export type BsffDestinationOperationInput = {
  code: BsffOperationCode;
  nextDestination?: Maybe<BsffOperationNextDestinationInput>;
};

export type BsffDestinationPlannedOperationInput = {
  code: BsffOperationCode;
};

export type BsffDestinationReceptionInput = {
  date: Scalars["DateTime"];
  kilos: Scalars["Float"];
  refusal?: Maybe<Scalars["String"]>;
};

export type BsffDetenteur = {
  __typename?: "BsffDetenteur";
  /** Entreprise détentrice de l'équipement. */
  company: FormCompany;
};

export type BsffDetenteurInput = {
  company: CompanyInput;
};

export type BsffEdge = {
  __typename?: "BsffEdge";
  cursor: Scalars["String"];
  node: Bsff;
};

export type BsffEmission = {
  __typename?: "BsffEmission";
  /** Signature de l'émetteur lors de l'enlèvement par le transporteur. */
  signature?: Maybe<Signature>;
};

export type BsffEmitter = {
  __typename?: "BsffEmitter";
  /** Entreprise émettant le déchet. */
  company?: Maybe<FormCompany>;
  /** Déclaration de l'émetteur lors de l'enlèvement par le transporteur. */
  emission?: Maybe<BsffEmission>;
};

export type BsffEmitterInput = {
  company?: Maybe<CompanyInput>;
};

export type BsffFicheIntervention = {
  __typename?: "BsffFicheIntervention";
  /** Identifiant unique de la fiche d'intervention. */
  id: Scalars["ID"];
  /** Numéro de la fiche d'intervention, habituellement renseigné par l'opérateur. */
  numero: Scalars["String"];
  /** Poids total des fluides récupérés lors de cette intervention. */
  kilos: Scalars["Float"];
  /** Détenteur de l'équipement sur lequel est intervenu l'opérateur. */
  detenteur?: Maybe<BsffDetenteur>;
  /** Opérateur à l'origine de l'intervention. */
  operateur?: Maybe<BsffOperateur>;
  /** Code postal du lieu où l'intervention a eu lieu. */
  postalCode: Scalars["String"];
};

export type BsffFicheInterventionInput = {
  numero: Scalars["String"];
  kilos: Scalars["Float"];
  detenteur: BsffDetenteurInput;
  operateur: BsffOperateurInput;
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

export type BsffOperateur = {
  __typename?: "BsffOperateur";
  /** Entreprise dont l'opérateur fait partie. */
  company: FormCompany;
};

export type BsffOperateurInput = {
  company: CompanyInput;
};

export type BsffOperation = {
  __typename?: "BsffOperation";
  /** Code de l'opération de traitement. */
  code?: Maybe<BsffOperationCode>;
  /** Destination ultérieure prévue, dans le cas d'un envoi vers l'étranger. */
  nextDestination?: Maybe<BsffNextDestination>;
  /** Signature de la destination lors du traitement. */
  signature?: Maybe<Signature>;
};

/** Liste des codes de traitement possible. */
export type BsffOperationCode = "R2" | "R12" | "D10" | "D13" | "D14";

export type BsffOperationNextDestinationInput = {
  company: CompanyInput;
};

export type BsffPackaging = {
  __typename?: "BsffPackaging";
  /** Dénomination du contenant. */
  name: Scalars["String"];
  /** Numéro du contenant. */
  numero: Scalars["String"];
  /** Poids en kilos. */
  kilos: Scalars["Float"];
};

export type BsffPackagingInput = {
  /** Dénomination du contenant. */
  name: Scalars["String"];
  /** Numéro du contenant. */
  numero: Scalars["String"];
  /** Poids en kilos. */
  kilos: Scalars["Float"];
};

export type BsffPlannedOperation = {
  __typename?: "BsffPlannedOperation";
  /** Code de l'opération de traitement prévu. */
  code?: Maybe<BsffOperationCode>;
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

export type BsffSignatureType =
  | "EMISSION"
  | "TRANSPORT"
  | "RECEPTION"
  | "OPERATION";

export type BsffStatus =
  /** Le bordereau ne comporte aucune signature. */
  | "INITIAL"
  /** Le bordereau a été signé par l'emitter. */
  | "SIGNED_BY_EMITTER"
  /** Le bordereau a été signé par le transporteur. */
  | "SENT"
  /** Le bordereau a été reçu par l'installation de destination. */
  | "RECEIVED"
  /** Le déchet a été traité par l'installation de destination. */
  | "PROCESSED"
  /** Le déchet a été refusé par l'installation de traitement. */
  | "REFUSED";

export type BsffTransport = {
  __typename?: "BsffTransport";
  /** Mode de transport utilisé. */
  mode: TransportMode;
  /** Signature du transporteur lors de l'enlèvement auprès de l'émetteur. */
  signature?: Maybe<Signature>;
};

export type BsffTransporter = {
  __typename?: "BsffTransporter";
  /** Entreprise responsable du transport du déchet. */
  company?: Maybe<FormCompany>;
  /** Récépissé du transporteur, à moins d'être exempté. */
  recepisse?: Maybe<BsffTransporterRecepisse>;
  /** Déclaration du transporteur lors de l'enlèvement auprès de l'émetteur. */
  transport?: Maybe<BsffTransport>;
};

export type BsffTransporterInput = {
  company?: Maybe<CompanyInput>;
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
  /** Mention ADR. */
  adr: Scalars["String"];
};

export type BsffWasteInput = {
  code: Scalars["String"];
  nature?: Maybe<Scalars["String"]>;
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
  createdAt?: Maybe<Scalars["DateTime"]>;
  /** Date de dernière modification */
  updatedAt?: Maybe<Scalars["DateTime"]>;
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

export type BsvhuAcceptationStatus =
  | "ACCEPTED"
  | "REFUSED"
  | "PARTIALLY_REFUSED";

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

export type BsvhuDestinationType = "BROYEUR" | "DEMOLISSEUR";

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

export type BsvhuIdentificationType =
  | "NUMERO_ORDRE_REGISTRE_POLICE"
  | "NUMERO_ORDRE_LOTS_SORTANTS";

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

export type BsvhuPackaging = "UNITE" | "LOT";

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

export type BsvhuStatus =
  | "INITIAL"
  | "SIGNED_BY_PRODUCER"
  | "SENT"
  | "PROCESSED"
  | "REFUSED";

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
  /** L'entreprise autorise l'enlèvement d'un Dasri sans sa signature */
  allowBsdasriTakeOverWithoutSignature?: Maybe<Scalars["Boolean"]>;
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
export type CompanyType =
  /** Producteur de déchet */
  | "PRODUCER"
  /** Installation de Transit, regroupement ou tri de déchets */
  | "COLLECTOR"
  /** Installation de traitement */
  | "WASTEPROCESSOR"
  /** Transporteur */
  | "TRANSPORTER"
  /** Installation de traitement de VHU (casse automobile et/ou broyeur agréé) */
  | "WASTE_VEHICLES"
  /** Installation de collecte de déchets apportés par le producteur initial */
  | "WASTE_CENTER"
  /** Négociant */
  | "TRADER"
  /** Courtier */
  | "BROKER"
  /** Éco-organisme */
  | "ECO_ORGANISME";

export type CompanyVerificationMode = "LETTER" | "MANUAL";

/** État du processus de vérification de l'établissement */
export type CompanyVerificationStatus =
  /** L'établissement est vérifié */
  | "VERIFIED"
  /** L'établissement vient d'être crée, en attente de vérifications manuelles par l'équipe Trackdéchets */
  | "TO_BE_VERIFIED"
  /**
   * Les vérifications manuelles n'ont pas abouties, une lettre a été envoyée à l'adresse enregistrée
   * auprès du registre du commerce et des sociétés
   */
  | "LETTER_SENT";

/** Consistance du déchet */
export type Consistence =
  /** Solide */
  | "SOLID"
  /** Liquide */
  | "LIQUID"
  /** Gazeux */
  | "GASEOUS"
  /** Pâteux */
  | "DOUGHY";

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
export type EmitterType =
  /** Producetur de déchet */
  | "PRODUCER"
  /** Autre détenteur */
  | "OTHER"
  /** Collecteur de petites quantités de déchets relevant de la même rubrique */
  | "APPENDIX1"
  /** Personne ayant transformé ou réalisé un traitement dont la provenance des déchets reste identifiable */
  | "APPENDIX2";

/** Type d'établissement favoris */
export type FavoriteType =
  | "EMITTER"
  | "TRANSPORTER"
  | "RECIPIENT"
  | "TRADER"
  | "BROKER"
  | "NEXT_DESTINATION"
  | "TEMPORARY_STORAGE_DETAIL"
  | "DESTINATION";

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

export type FormRole =
  /** Les BSD's dont je suis transporteur */
  | "TRANSPORTER"
  /** Les BSD's dont je suis la destination de traitement */
  | "RECIPIENT"
  /** Les BSD's dont je suis l'émetteur */
  | "EMITTER"
  /** Les BSD's dont je suis le négociant */
  | "TRADER"
  /** Les BSD's dont je suis le courtier */
  | "BROKER"
  /** Les BSD's dont je suis éco-organisme */
  | "ECO_ORGANISME";

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
export type FormsRegisterExportFormat =
  /** Fichier csv */
  | "CSV"
  /** Fichier Excel */
  | "XLSX";

/**
 * Modèle de registre réglementaire tels que décrits dans l'arrêté du 29 février 2012 fixant
 * le contenu des registres mnetionnées aux articles R. 541-43 et R. 541-46 du code de l'environnement
 * https://www.legifrance.gouv.fr/affichTexte.do?cidTexte=JORFTEXT000025454959&categorieLien=id
 */
export type FormsRegisterExportType =
  /** Registre exhaustif, déchets entrants et sortants */
  | "ALL"
  /**
   * Registre producteur, déchets sortants
   * Art 1: Les exploitants des établissements produisant ou expédiant des déchets tiennent à jour
   * un registre chronologique où sont consignés tous les déchets sortants.
   */
  | "OUTGOING"
  /**
   * Registre traiteur, TTR
   * Art 2: Les exploitants des installations de transit, de regroupement ou de traitement de déchets,
   * notamment de tri, établissent et tiennent à jour un registre chronologique où sont consignés
   * tous les déchets entrants.
   */
  | "INCOMING"
  /**
   * Registre transporteur
   * Art 3: Les transporteurs et les collecteurs de déchets tiennent à jour un registre chronologique
   * des déchets transportés ou collectés.
   */
  | "TRANSPORTED"
  /**
   * Registre négociants
   * Art 4: Les négociants tiennent à jour un registre chronologique des déchets détenus.
   */
  | "TRADED"
  /** Registre courtier */
  | "BROKERED";

/** Différents statuts d'un BSD au cours de son cycle de vie */
export type FormStatus =
  /**
   * BSD à l'état de brouillon
   * Des champs obligatoires peuvent manquer
   */
  | "DRAFT"
  /**
   * BSD finalisé
   * Les champs sont validés pour détecter des valeurs manquantes ou erronnées
   */
  | "SEALED"
  /** BSD envoyé vers l'établissement de destination */
  | "SENT"
  /** BSD reçu par l'établissement de destination */
  | "RECEIVED"
  /** BSD accepté par l'établissement de destination */
  | "ACCEPTED"
  /** BSD dont les déchets ont été traités */
  | "PROCESSED"
  /** BSD en attente de regroupement */
  | "AWAITING_GROUP"
  /** Regroupement effectué */
  | "GROUPED"
  /** Perte de traçabalité */
  | "NO_TRACEABILITY"
  /** Déchet refusé */
  | "REFUSED"
  /** Déchet arrivé sur le site d'entreposage ou reconditionnement */
  | "TEMP_STORED"
  /** Déchet accepté par le site d'entreposage ou reconditionnement */
  | "TEMP_STORER_ACCEPTED"
  /** Déchet avec les cadres 14-19 complétées (si besoin), prêt à partir du site d'entreposage ou reconditionnement */
  | "RESEALED"
  /** Déchet envoyé du site d'entreposage ou reconditionnement vers sa destination de traitement */
  | "RESENT";

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
export type GerepType = "Producteur" | "Traiteur";

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
export type MembershipRequestStatus = "PENDING" | "ACCEPTED" | "REFUSED";

export type Mutation = {
  __typename?: "Mutation";
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
  /** Mutation permettant de créer une fiche d'intervention. */
  createFicheInterventionBsff: BsffFicheIntervention;
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
  /** Mutation permettant de mettre à jour une fiche d'intervention. */
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

export type MutationCreateFicheInterventionBsffArgs = {
  input: BsffFicheInterventionInput;
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

export type OrderType = "ASC" | "DESC";

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
export type Packagings =
  /** Fut */
  | "FUT"
  /** GRV */
  | "GRV"
  /** Citerne */
  | "CITERNE"
  /** Benne */
  | "BENNE"
  /** Autre */
  | "AUTRE";

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

export type ProcessingOperationTypes = "D9" | "D10" | "D12" | "R1" | "R12";

/** Type de quantité lors de l'émission */
export type QuantityType =
  /** Quntité réelle */
  | "REAL"
  /** Quantité estimée */
  | "ESTIMATED";

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
export type SignatureAuthor =
  /** L'auteur de la signature est l'émetteur du déchet */
  | "EMITTER"
  /** L'auteur de la signature est l'éco-organisme figurant sur le BSD */
  | "ECO_ORGANISME";

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

export type SignatureTypeInput = "EMISSION" | "TRANSPORT" | "OPERATION";

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

export type TransportMode = "ROAD" | "RAIL" | "AIR" | "RIVER" | "SEA";

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
export type UserRole = "MEMBER" | "ADMIN";

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
export type WasteAcceptationStatusInput =
  /** Accepté en totalité */
  | "ACCEPTED"
  /** Refusé */
  | "REFUSED"
  /** Refus partiel */
  | "PARTIALLY_REFUSED";

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
export type WasteType =
  /** Déchet inerte */
  | "INERTE"
  /** Déchet non dangereux */
  | "NOT_DANGEROUS"
  /** Déchet dangereux */
  | "DANGEROUS";

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

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> =
  | LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
  | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {}
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars["String"]>;
  Form: ResolverTypeWrapper<Form>;
  ID: ResolverTypeWrapper<Scalars["ID"]>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>;
  Emitter: ResolverTypeWrapper<Emitter>;
  EmitterType: EmitterType;
  WorkSite: ResolverTypeWrapper<WorkSite>;
  FormCompany: ResolverTypeWrapper<FormCompany>;
  Recipient: ResolverTypeWrapper<Recipient>;
  Transporter: ResolverTypeWrapper<Transporter>;
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]>;
  WasteDetails: ResolverTypeWrapper<WasteDetails>;
  PackagingInfo: ResolverTypeWrapper<PackagingInfo>;
  Packagings: Packagings;
  Int: ResolverTypeWrapper<Scalars["Int"]>;
  Float: ResolverTypeWrapper<Scalars["Float"]>;
  QuantityType: QuantityType;
  Consistence: Consistence;
  Trader: ResolverTypeWrapper<Trader>;
  Broker: ResolverTypeWrapper<Broker>;
  FormStatus: FormStatus;
  NextDestination: ResolverTypeWrapper<NextDestination>;
  Appendix2Form: ResolverTypeWrapper<Appendix2Form>;
  FormEcoOrganisme: ResolverTypeWrapper<FormEcoOrganisme>;
  TemporaryStorageDetail: ResolverTypeWrapper<TemporaryStorageDetail>;
  TemporaryStorer: ResolverTypeWrapper<TemporaryStorer>;
  Destination: ResolverTypeWrapper<Destination>;
  StateSummary: ResolverTypeWrapper<StateSummary>;
  TransportSegment: ResolverTypeWrapper<TransportSegment>;
  TransportMode: TransportMode;
  Bsda: ResolverTypeWrapper<Bsda>;
  BsdaStatus: BsdaStatus;
  BsdaType: BsdaType;
  BsdaEmitter: ResolverTypeWrapper<BsdaEmitter>;
  BsdaWorksite: ResolverTypeWrapper<BsdaWorksite>;
  BsdaEmission: ResolverTypeWrapper<BsdaEmission>;
  Signature: ResolverTypeWrapper<Signature>;
  BsdaWaste: ResolverTypeWrapper<BsdaWaste>;
  BsdaConsistence: BsdaConsistence;
  BsdaPackaging: ResolverTypeWrapper<BsdaPackaging>;
  BsdaPackagingType: BsdaPackagingType;
  BsdaQuantity: ResolverTypeWrapper<BsdaQuantity>;
  BsdaQuantityType: BsdaQuantityType;
  BsdaDestination: ResolverTypeWrapper<BsdaDestination>;
  BsdaReception: ResolverTypeWrapper<BsdaReception>;
  BsdaAcceptationStatus: BsdaAcceptationStatus;
  BsdaOperation: ResolverTypeWrapper<BsdaOperation>;
  BsdaWorker: ResolverTypeWrapper<BsdaWorker>;
  BsdaWork: ResolverTypeWrapper<BsdaWork>;
  BsdaTransporter: ResolverTypeWrapper<BsdaTransporter>;
  BsdaRecepisse: ResolverTypeWrapper<BsdaRecepisse>;
  BsdaTransport: ResolverTypeWrapper<BsdaTransport>;
  BsdaAssociation: ResolverTypeWrapper<BsdaAssociation>;
  FileDownload: ResolverTypeWrapper<FileDownload>;
  BsdaWhere: BsdaWhere;
  DateFilter: DateFilter;
  BsdaEmitterWhere: BsdaEmitterWhere;
  BsdaCompanyWhere: BsdaCompanyWhere;
  BsdaEmissionWhere: BsdaEmissionWhere;
  BsdaSignatureWhere: BsdaSignatureWhere;
  BsdaWorkerWhere: BsdaWorkerWhere;
  BsdaWorkWhere: BsdaWorkWhere;
  BsdaTransporterWhere: BsdaTransporterWhere;
  BsdaTransportWhere: BsdaTransportWhere;
  BsdaDestinationWhere: BsdaDestinationWhere;
  BsdaOperationWhere: BsdaOperationWhere;
  BsdaConnection: ResolverTypeWrapper<BsdaConnection>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  BsdaEdge: ResolverTypeWrapper<BsdaEdge>;
  Bsdasri: ResolverTypeWrapper<Bsdasri>;
  BsdasriStatus: BsdasriStatus;
  BsdasriType: BsdasriType;
  BsdasriEmitter: ResolverTypeWrapper<BsdasriEmitter>;
  BsdasriEmitterType: BsdasriEmitterType;
  BsdasriEmission: ResolverTypeWrapper<BsdasriEmission>;
  BsdasriEmissionWasteDetails: ResolverTypeWrapper<BsdasriEmissionWasteDetails>;
  BsdasriQuantity: ResolverTypeWrapper<BsdasriQuantity>;
  BsdasriPackagingInfo: ResolverTypeWrapper<BsdasriPackagingInfo>;
  BsdasriPackagings: BsdasriPackagings;
  BsdasriSignature: ResolverTypeWrapper<BsdasriSignature>;
  BsdasriTransporter: ResolverTypeWrapper<BsdasriTransporter>;
  BsdasriTransport: ResolverTypeWrapper<BsdasriTransport>;
  BsdasriTransportWasteDetails: ResolverTypeWrapper<
    BsdasriTransportWasteDetails
  >;
  BsdasriWasteAcceptation: ResolverTypeWrapper<BsdasriWasteAcceptation>;
  BsdasriRecipient: ResolverTypeWrapper<BsdasriRecipient>;
  BsdasriReception: ResolverTypeWrapper<BsdasriReception>;
  BsdasriReceptionWasteDetails: ResolverTypeWrapper<
    BsdasriReceptionWasteDetails
  >;
  BsdasriOperation: ResolverTypeWrapper<BsdasriOperation>;
  BsdasriOperationQuantity: ResolverTypeWrapper<BsdasriOperationQuantity>;
  BsdasriMetadata: ResolverTypeWrapper<BsdasriMetadata>;
  BsdasriError: ResolverTypeWrapper<BsdasriError>;
  BsdasriSignatureType: BsdasriSignatureType;
  BsdasriWhere: BsdasriWhere;
  BsdasriEmitterWhere: BsdasriEmitterWhere;
  BsdasriCompanyWhere: BsdasriCompanyWhere;
  BsdasriSignatureWhere: BsdasriSignatureWhere;
  BsdasriTransporterWhere: BsdasriTransporterWhere;
  BsdasriRecipientWhere: BsdasriRecipientWhere;
  processingOperationTypes: ProcessingOperationTypes;
  BsdasriConnection: ResolverTypeWrapper<BsdasriConnection>;
  BsdasriEdge: ResolverTypeWrapper<BsdasriEdge>;
  BsdWhere: BsdWhere;
  BsdType: BsdType;
  OrderBy: OrderBy;
  OrderType: OrderType;
  BsdConnection: ResolverTypeWrapper<BsdConnection>;
  BsdEdge: ResolverTypeWrapper<
    Omit<BsdEdge, "node"> & { node: ResolversTypes["Bsd"] }
  >;
  Bsd:
    | ResolversTypes["Form"]
    | ResolversTypes["Bsdasri"]
    | ResolversTypes["Bsvhu"]
    | ResolversTypes["Bsda"]
    | ResolversTypes["Bsff"];
  Bsvhu: ResolverTypeWrapper<Bsvhu>;
  BsvhuStatus: BsvhuStatus;
  BsvhuEmitter: ResolverTypeWrapper<BsvhuEmitter>;
  BsvhuEmission: ResolverTypeWrapper<BsvhuEmission>;
  BsvhuPackaging: BsvhuPackaging;
  BsvhuIdentification: ResolverTypeWrapper<BsvhuIdentification>;
  BsvhuIdentificationType: BsvhuIdentificationType;
  BsvhuQuantity: ResolverTypeWrapper<BsvhuQuantity>;
  BsvhuDestination: ResolverTypeWrapper<BsvhuDestination>;
  BsvhuDestinationType: BsvhuDestinationType;
  BsvhuReception: ResolverTypeWrapper<BsvhuReception>;
  BsvhuAcceptationStatus: BsvhuAcceptationStatus;
  BsvhuOperation: ResolverTypeWrapper<BsvhuOperation>;
  BsvhuNextDestination: ResolverTypeWrapper<BsvhuNextDestination>;
  BsvhuTransporter: ResolverTypeWrapper<BsvhuTransporter>;
  BsvhuRecepisse: ResolverTypeWrapper<BsvhuRecepisse>;
  BsvhuTransport: ResolverTypeWrapper<BsvhuTransport>;
  BsvhuMetadata: ResolverTypeWrapper<BsvhuMetadata>;
  BsvhuError: ResolverTypeWrapper<BsvhuError>;
  SignatureTypeInput: SignatureTypeInput;
  Bsff: ResolverTypeWrapper<Bsff>;
  BsffStatus: BsffStatus;
  BsffEmitter: ResolverTypeWrapper<BsffEmitter>;
  BsffEmission: ResolverTypeWrapper<BsffEmission>;
  BsffPackaging: ResolverTypeWrapper<BsffPackaging>;
  BsffWaste: ResolverTypeWrapper<BsffWaste>;
  BsffQuantity: ResolverTypeWrapper<BsffQuantity>;
  BsffTransporter: ResolverTypeWrapper<BsffTransporter>;
  BsffTransporterRecepisse: ResolverTypeWrapper<BsffTransporterRecepisse>;
  BsffTransport: ResolverTypeWrapper<BsffTransport>;
  BsffDestination: ResolverTypeWrapper<BsffDestination>;
  BsffReception: ResolverTypeWrapper<BsffReception>;
  BsffOperation: ResolverTypeWrapper<BsffOperation>;
  BsffOperationCode: BsffOperationCode;
  BsffNextDestination: ResolverTypeWrapper<BsffNextDestination>;
  BsffPlannedOperation: ResolverTypeWrapper<BsffPlannedOperation>;
  BsffFicheIntervention: ResolverTypeWrapper<BsffFicheIntervention>;
  BsffDetenteur: ResolverTypeWrapper<BsffDetenteur>;
  BsffOperateur: ResolverTypeWrapper<BsffOperateur>;
  BsffWhere: BsffWhere;
  BsffWhereEmitter: BsffWhereEmitter;
  BsffWhereCompany: BsffWhereCompany;
  BsffWhereTransporter: BsffWhereTransporter;
  BsffWhereDestination: BsffWhereDestination;
  BsffWhereOperation: BsffWhereOperation;
  BsffConnection: ResolverTypeWrapper<BsffConnection>;
  BsffEdge: ResolverTypeWrapper<BsffEdge>;
  BsvhuWhere: BsvhuWhere;
  BsvhuEmitterWhere: BsvhuEmitterWhere;
  BsvhuCompanyWhere: BsvhuCompanyWhere;
  BsvhuEmissionWhere: BsvhuEmissionWhere;
  BsvhuSignatureWhere: BsvhuSignatureWhere;
  BsvhuTransporterWhere: BsvhuTransporterWhere;
  BsvhuTransportWhere: BsvhuTransportWhere;
  BsvhuDestinationWhere: BsvhuDestinationWhere;
  BsvhuOperationWhere: BsvhuOperationWhere;
  BsvhuConnection: ResolverTypeWrapper<BsvhuConnection>;
  BsvhuEdge: ResolverTypeWrapper<BsvhuEdge>;
  CompanyForVerificationWhere: CompanyForVerificationWhere;
  CompanyVerificationStatus: CompanyVerificationStatus;
  CompanyForVerificationConnection: ResolverTypeWrapper<
    CompanyForVerificationConnection
  >;
  CompanyForVerification: ResolverTypeWrapper<CompanyForVerification>;
  CompanyType: CompanyType;
  CompanyVerificationMode: CompanyVerificationMode;
  AdminForVerification: ResolverTypeWrapper<AdminForVerification>;
  CompanyPublic: ResolverTypeWrapper<CompanyPublic>;
  Installation: ResolverTypeWrapper<Installation>;
  Rubrique: ResolverTypeWrapper<Rubrique>;
  WasteType: WasteType;
  Declaration: ResolverTypeWrapper<Declaration>;
  GerepType: GerepType;
  TransporterReceipt: ResolverTypeWrapper<TransporterReceipt>;
  TraderReceipt: ResolverTypeWrapper<TraderReceipt>;
  BrokerReceipt: ResolverTypeWrapper<BrokerReceipt>;
  VhuAgrement: ResolverTypeWrapper<VhuAgrement>;
  URL: ResolverTypeWrapper<Scalars["URL"]>;
  EcoOrganisme: ResolverTypeWrapper<EcoOrganisme>;
  FavoriteType: FavoriteType;
  CompanyFavorite: ResolverTypeWrapper<CompanyFavorite>;
  FormRole: FormRole;
  formsLifeCycleData: ResolverTypeWrapper<FormsLifeCycleData>;
  StatusLog: ResolverTypeWrapper<StatusLog>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]>;
  StatusLogForm: ResolverTypeWrapper<StatusLogForm>;
  StatusLogUser: ResolverTypeWrapper<StatusLogUser>;
  FormsRegisterExportType: FormsRegisterExportType;
  FormsRegisterExportFormat: FormsRegisterExportFormat;
  Invitation: ResolverTypeWrapper<Invitation>;
  UserRole: UserRole;
  User: ResolverTypeWrapper<User>;
  CompanyPrivate: ResolverTypeWrapper<CompanyPrivate>;
  CompanyMember: ResolverTypeWrapper<CompanyMember>;
  MembershipRequest: ResolverTypeWrapper<MembershipRequest>;
  MembershipRequestStatus: MembershipRequestStatus;
  CompanySearchResult: ResolverTypeWrapper<CompanySearchResult>;
  CompanyStat: ResolverTypeWrapper<CompanyStat>;
  Stat: ResolverTypeWrapper<Stat>;
  Mutation: ResolverTypeWrapper<{}>;
  CreateBrokerReceiptInput: CreateBrokerReceiptInput;
  BsdaInput: BsdaInput;
  BsdaEmitterInput: BsdaEmitterInput;
  CompanyInput: CompanyInput;
  BsdaWorksiteInput: BsdaWorksiteInput;
  BsdaWasteInput: BsdaWasteInput;
  BsdaPackagingInput: BsdaPackagingInput;
  BsdaQuantityInput: BsdaQuantityInput;
  BsdaDestinationInput: BsdaDestinationInput;
  BsdaReceptionInput: BsdaReceptionInput;
  BsdaOperationInput: BsdaOperationInput;
  BsdaWorkerInput: BsdaWorkerInput;
  BsdaWorkInput: BsdaWorkInput;
  BsdaTransporterInput: BsdaTransporterInput;
  BsdaRecepisseInput: BsdaRecepisseInput;
  BsdasriCreateInput: BsdasriCreateInput;
  BsdasriEmitterInput: BsdasriEmitterInput;
  WorkSiteInput: WorkSiteInput;
  BsdasriEmissionInput: BsdasriEmissionInput;
  BsdasriWasteDetailEmissionInput: BsdasriWasteDetailEmissionInput;
  BsdasriQuantityInput: BsdasriQuantityInput;
  BsdasriPackagingInfoInput: BsdasriPackagingInfoInput;
  BsdasriTransporterInput: BsdasriTransporterInput;
  BsdasriTransportInput: BsdasriTransportInput;
  BsdasriWasteDetailTransportInput: BsdasriWasteDetailTransportInput;
  BsdasriWasteAcceptationInput: BsdasriWasteAcceptationInput;
  WasteAcceptationStatusInput: WasteAcceptationStatusInput;
  BsdasriRecipientInput: BsdasriRecipientInput;
  BsdasriReceptionInput: BsdasriReceptionInput;
  BsdasriRecipientWasteDetailInput: BsdasriRecipientWasteDetailInput;
  BsdasriOperationInput: BsdasriOperationInput;
  RegroupedBsdasriInput: RegroupedBsdasriInput;
  BsffInput: BsffInput;
  BsffEmitterInput: BsffEmitterInput;
  BsffPackagingInput: BsffPackagingInput;
  BsffWasteInput: BsffWasteInput;
  BsffQuantityInput: BsffQuantityInput;
  BsffTransporterInput: BsffTransporterInput;
  BsffTransporterRecepisseInput: BsffTransporterRecepisseInput;
  BsffTransporterTransportInput: BsffTransporterTransportInput;
  BsffDestinationInput: BsffDestinationInput;
  BsffDestinationReceptionInput: BsffDestinationReceptionInput;
  BsffDestinationPlannedOperationInput: BsffDestinationPlannedOperationInput;
  BsffDestinationOperationInput: BsffDestinationOperationInput;
  BsffOperationNextDestinationInput: BsffOperationNextDestinationInput;
  BsvhuInput: BsvhuInput;
  BsvhuEmitterInput: BsvhuEmitterInput;
  BsvhuIdentificationInput: BsvhuIdentificationInput;
  BsvhuQuantityInput: BsvhuQuantityInput;
  BsvhuDestinationInput: BsvhuDestinationInput;
  BsvhuReceptionInput: BsvhuReceptionInput;
  BsvhuOperationInput: BsvhuOperationInput;
  BsvhuNextDestinationInput: BsvhuNextDestinationInput;
  BsvhuTransporterInput: BsvhuTransporterInput;
  BsvhuRecepisseInput: BsvhuRecepisseInput;
  BsvhuTransportInput: BsvhuTransportInput;
  PrivateCompanyInput: PrivateCompanyInput;
  BsffFicheInterventionInput: BsffFicheInterventionInput;
  BsffDetenteurInput: BsffDetenteurInput;
  BsffOperateurInput: BsffOperateurInput;
  CreateFormInput: CreateFormInput;
  EmitterInput: EmitterInput;
  RecipientInput: RecipientInput;
  TransporterInput: TransporterInput;
  WasteDetailsInput: WasteDetailsInput;
  PackagingInfoInput: PackagingInfoInput;
  TraderInput: TraderInput;
  BrokerInput: BrokerInput;
  AppendixFormInput: AppendixFormInput;
  EcoOrganismeInput: EcoOrganismeInput;
  TemporaryStorageDetailInput: TemporaryStorageDetailInput;
  DestinationInput: DestinationInput;
  CreateTraderReceiptInput: CreateTraderReceiptInput;
  CreateTransporterReceiptInput: CreateTransporterReceiptInput;
  UploadLink: ResolverTypeWrapper<UploadLink>;
  CreateVhuAgrementInput: CreateVhuAgrementInput;
  DeleteBrokerReceiptInput: DeleteBrokerReceiptInput;
  DeleteTraderReceiptInput: DeleteTraderReceiptInput;
  DeleteTransporterReceiptInput: DeleteTransporterReceiptInput;
  DeleteVhuAgrementInput: DeleteVhuAgrementInput;
  NextSegmentInfoInput: NextSegmentInfoInput;
  ImportPaperFormInput: ImportPaperFormInput;
  SignatureFormInput: SignatureFormInput;
  ReceivedFormInput: ReceivedFormInput;
  ProcessedFormInput: ProcessedFormInput;
  NextDestinationInput: NextDestinationInput;
  InternationalCompanyInput: InternationalCompanyInput;
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  AcceptedFormInput: AcceptedFormInput;
  ResealedFormInput: ResealedFormInput;
  WasteDetailsRepackagingInput: WasteDetailsRepackagingInput;
  ResentFormInput: ResentFormInput;
  SentFormInput: SentFormInput;
  TempStoredFormInput: TempStoredFormInput;
  TempStorerAcceptedFormInput: TempStorerAcceptedFormInput;
  FormInput: FormInput;
  SendVerificationCodeLetterInput: SendVerificationCodeLetterInput;
  BsdaSignatureInput: BsdaSignatureInput;
  BsdaSignatureType: BsdaSignatureType;
  BsdasriSignatureInput: BsdasriSignatureInput;
  BsdasriSignatureWithSecretCodeInput: BsdasriSignatureWithSecretCodeInput;
  BsffSignatureType: BsffSignatureType;
  SignatureInput: SignatureInput;
  BsvhuSignatureInput: BsvhuSignatureInput;
  TransporterSignatureFormInput: TransporterSignatureFormInput;
  SignatureAuthor: SignatureAuthor;
  SignupInput: SignupInput;
  TakeOverInput: TakeOverInput;
  UpdateBrokerReceiptInput: UpdateBrokerReceiptInput;
  BsdasriUpdateInput: BsdasriUpdateInput;
  UpdateFormInput: UpdateFormInput;
  UpdateTraderReceiptInput: UpdateTraderReceiptInput;
  UpdateTransporterReceiptInput: UpdateTransporterReceiptInput;
  UpdateVhuAgrementInput: UpdateVhuAgrementInput;
  VerifyCompanyInput: VerifyCompanyInput;
  VerifyCompanyByAdminInput: VerifyCompanyByAdminInput;
  Subscription: ResolverTypeWrapper<{}>;
  FormSubscription: ResolverTypeWrapper<FormSubscription>;
  BsdasriInput: BsdasriInput;
  BsdasriRole: BsdasriRole;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {};
  String: Scalars["String"];
  Form: Form;
  ID: Scalars["ID"];
  Boolean: Scalars["Boolean"];
  Emitter: Emitter;
  WorkSite: WorkSite;
  FormCompany: FormCompany;
  Recipient: Recipient;
  Transporter: Transporter;
  DateTime: Scalars["DateTime"];
  WasteDetails: WasteDetails;
  PackagingInfo: PackagingInfo;
  Int: Scalars["Int"];
  Float: Scalars["Float"];
  Trader: Trader;
  Broker: Broker;
  NextDestination: NextDestination;
  Appendix2Form: Appendix2Form;
  FormEcoOrganisme: FormEcoOrganisme;
  TemporaryStorageDetail: TemporaryStorageDetail;
  TemporaryStorer: TemporaryStorer;
  Destination: Destination;
  StateSummary: StateSummary;
  TransportSegment: TransportSegment;
  Bsda: Bsda;
  BsdaEmitter: BsdaEmitter;
  BsdaWorksite: BsdaWorksite;
  BsdaEmission: BsdaEmission;
  Signature: Signature;
  BsdaWaste: BsdaWaste;
  BsdaPackaging: BsdaPackaging;
  BsdaQuantity: BsdaQuantity;
  BsdaDestination: BsdaDestination;
  BsdaReception: BsdaReception;
  BsdaOperation: BsdaOperation;
  BsdaWorker: BsdaWorker;
  BsdaWork: BsdaWork;
  BsdaTransporter: BsdaTransporter;
  BsdaRecepisse: BsdaRecepisse;
  BsdaTransport: BsdaTransport;
  BsdaAssociation: BsdaAssociation;
  FileDownload: FileDownload;
  BsdaWhere: BsdaWhere;
  DateFilter: DateFilter;
  BsdaEmitterWhere: BsdaEmitterWhere;
  BsdaCompanyWhere: BsdaCompanyWhere;
  BsdaEmissionWhere: BsdaEmissionWhere;
  BsdaSignatureWhere: BsdaSignatureWhere;
  BsdaWorkerWhere: BsdaWorkerWhere;
  BsdaWorkWhere: BsdaWorkWhere;
  BsdaTransporterWhere: BsdaTransporterWhere;
  BsdaTransportWhere: BsdaTransportWhere;
  BsdaDestinationWhere: BsdaDestinationWhere;
  BsdaOperationWhere: BsdaOperationWhere;
  BsdaConnection: BsdaConnection;
  PageInfo: PageInfo;
  BsdaEdge: BsdaEdge;
  Bsdasri: Bsdasri;
  BsdasriEmitter: BsdasriEmitter;
  BsdasriEmission: BsdasriEmission;
  BsdasriEmissionWasteDetails: BsdasriEmissionWasteDetails;
  BsdasriQuantity: BsdasriQuantity;
  BsdasriPackagingInfo: BsdasriPackagingInfo;
  BsdasriSignature: BsdasriSignature;
  BsdasriTransporter: BsdasriTransporter;
  BsdasriTransport: BsdasriTransport;
  BsdasriTransportWasteDetails: BsdasriTransportWasteDetails;
  BsdasriWasteAcceptation: BsdasriWasteAcceptation;
  BsdasriRecipient: BsdasriRecipient;
  BsdasriReception: BsdasriReception;
  BsdasriReceptionWasteDetails: BsdasriReceptionWasteDetails;
  BsdasriOperation: BsdasriOperation;
  BsdasriOperationQuantity: BsdasriOperationQuantity;
  BsdasriMetadata: BsdasriMetadata;
  BsdasriError: BsdasriError;
  BsdasriWhere: BsdasriWhere;
  BsdasriEmitterWhere: BsdasriEmitterWhere;
  BsdasriCompanyWhere: BsdasriCompanyWhere;
  BsdasriSignatureWhere: BsdasriSignatureWhere;
  BsdasriTransporterWhere: BsdasriTransporterWhere;
  BsdasriRecipientWhere: BsdasriRecipientWhere;
  BsdasriConnection: BsdasriConnection;
  BsdasriEdge: BsdasriEdge;
  BsdWhere: BsdWhere;
  OrderBy: OrderBy;
  BsdConnection: BsdConnection;
  BsdEdge: Omit<BsdEdge, "node"> & { node: ResolversParentTypes["Bsd"] };
  Bsd:
    | ResolversParentTypes["Form"]
    | ResolversParentTypes["Bsdasri"]
    | ResolversParentTypes["Bsvhu"]
    | ResolversParentTypes["Bsda"]
    | ResolversParentTypes["Bsff"];
  Bsvhu: Bsvhu;
  BsvhuEmitter: BsvhuEmitter;
  BsvhuEmission: BsvhuEmission;
  BsvhuIdentification: BsvhuIdentification;
  BsvhuQuantity: BsvhuQuantity;
  BsvhuDestination: BsvhuDestination;
  BsvhuReception: BsvhuReception;
  BsvhuOperation: BsvhuOperation;
  BsvhuNextDestination: BsvhuNextDestination;
  BsvhuTransporter: BsvhuTransporter;
  BsvhuRecepisse: BsvhuRecepisse;
  BsvhuTransport: BsvhuTransport;
  BsvhuMetadata: BsvhuMetadata;
  BsvhuError: BsvhuError;
  Bsff: Bsff;
  BsffEmitter: BsffEmitter;
  BsffEmission: BsffEmission;
  BsffPackaging: BsffPackaging;
  BsffWaste: BsffWaste;
  BsffQuantity: BsffQuantity;
  BsffTransporter: BsffTransporter;
  BsffTransporterRecepisse: BsffTransporterRecepisse;
  BsffTransport: BsffTransport;
  BsffDestination: BsffDestination;
  BsffReception: BsffReception;
  BsffOperation: BsffOperation;
  BsffNextDestination: BsffNextDestination;
  BsffPlannedOperation: BsffPlannedOperation;
  BsffFicheIntervention: BsffFicheIntervention;
  BsffDetenteur: BsffDetenteur;
  BsffOperateur: BsffOperateur;
  BsffWhere: BsffWhere;
  BsffWhereEmitter: BsffWhereEmitter;
  BsffWhereCompany: BsffWhereCompany;
  BsffWhereTransporter: BsffWhereTransporter;
  BsffWhereDestination: BsffWhereDestination;
  BsffWhereOperation: BsffWhereOperation;
  BsffConnection: BsffConnection;
  BsffEdge: BsffEdge;
  BsvhuWhere: BsvhuWhere;
  BsvhuEmitterWhere: BsvhuEmitterWhere;
  BsvhuCompanyWhere: BsvhuCompanyWhere;
  BsvhuEmissionWhere: BsvhuEmissionWhere;
  BsvhuSignatureWhere: BsvhuSignatureWhere;
  BsvhuTransporterWhere: BsvhuTransporterWhere;
  BsvhuTransportWhere: BsvhuTransportWhere;
  BsvhuDestinationWhere: BsvhuDestinationWhere;
  BsvhuOperationWhere: BsvhuOperationWhere;
  BsvhuConnection: BsvhuConnection;
  BsvhuEdge: BsvhuEdge;
  CompanyForVerificationWhere: CompanyForVerificationWhere;
  CompanyForVerificationConnection: CompanyForVerificationConnection;
  CompanyForVerification: CompanyForVerification;
  AdminForVerification: AdminForVerification;
  CompanyPublic: CompanyPublic;
  Installation: Installation;
  Rubrique: Rubrique;
  Declaration: Declaration;
  TransporterReceipt: TransporterReceipt;
  TraderReceipt: TraderReceipt;
  BrokerReceipt: BrokerReceipt;
  VhuAgrement: VhuAgrement;
  URL: Scalars["URL"];
  EcoOrganisme: EcoOrganisme;
  CompanyFavorite: CompanyFavorite;
  formsLifeCycleData: FormsLifeCycleData;
  StatusLog: StatusLog;
  JSON: Scalars["JSON"];
  StatusLogForm: StatusLogForm;
  StatusLogUser: StatusLogUser;
  Invitation: Invitation;
  User: User;
  CompanyPrivate: CompanyPrivate;
  CompanyMember: CompanyMember;
  MembershipRequest: MembershipRequest;
  CompanySearchResult: CompanySearchResult;
  CompanyStat: CompanyStat;
  Stat: Stat;
  Mutation: {};
  CreateBrokerReceiptInput: CreateBrokerReceiptInput;
  BsdaInput: BsdaInput;
  BsdaEmitterInput: BsdaEmitterInput;
  CompanyInput: CompanyInput;
  BsdaWorksiteInput: BsdaWorksiteInput;
  BsdaWasteInput: BsdaWasteInput;
  BsdaPackagingInput: BsdaPackagingInput;
  BsdaQuantityInput: BsdaQuantityInput;
  BsdaDestinationInput: BsdaDestinationInput;
  BsdaReceptionInput: BsdaReceptionInput;
  BsdaOperationInput: BsdaOperationInput;
  BsdaWorkerInput: BsdaWorkerInput;
  BsdaWorkInput: BsdaWorkInput;
  BsdaTransporterInput: BsdaTransporterInput;
  BsdaRecepisseInput: BsdaRecepisseInput;
  BsdasriCreateInput: BsdasriCreateInput;
  BsdasriEmitterInput: BsdasriEmitterInput;
  WorkSiteInput: WorkSiteInput;
  BsdasriEmissionInput: BsdasriEmissionInput;
  BsdasriWasteDetailEmissionInput: BsdasriWasteDetailEmissionInput;
  BsdasriQuantityInput: BsdasriQuantityInput;
  BsdasriPackagingInfoInput: BsdasriPackagingInfoInput;
  BsdasriTransporterInput: BsdasriTransporterInput;
  BsdasriTransportInput: BsdasriTransportInput;
  BsdasriWasteDetailTransportInput: BsdasriWasteDetailTransportInput;
  BsdasriWasteAcceptationInput: BsdasriWasteAcceptationInput;
  BsdasriRecipientInput: BsdasriRecipientInput;
  BsdasriReceptionInput: BsdasriReceptionInput;
  BsdasriRecipientWasteDetailInput: BsdasriRecipientWasteDetailInput;
  BsdasriOperationInput: BsdasriOperationInput;
  RegroupedBsdasriInput: RegroupedBsdasriInput;
  BsffInput: BsffInput;
  BsffEmitterInput: BsffEmitterInput;
  BsffPackagingInput: BsffPackagingInput;
  BsffWasteInput: BsffWasteInput;
  BsffQuantityInput: BsffQuantityInput;
  BsffTransporterInput: BsffTransporterInput;
  BsffTransporterRecepisseInput: BsffTransporterRecepisseInput;
  BsffTransporterTransportInput: BsffTransporterTransportInput;
  BsffDestinationInput: BsffDestinationInput;
  BsffDestinationReceptionInput: BsffDestinationReceptionInput;
  BsffDestinationPlannedOperationInput: BsffDestinationPlannedOperationInput;
  BsffDestinationOperationInput: BsffDestinationOperationInput;
  BsffOperationNextDestinationInput: BsffOperationNextDestinationInput;
  BsvhuInput: BsvhuInput;
  BsvhuEmitterInput: BsvhuEmitterInput;
  BsvhuIdentificationInput: BsvhuIdentificationInput;
  BsvhuQuantityInput: BsvhuQuantityInput;
  BsvhuDestinationInput: BsvhuDestinationInput;
  BsvhuReceptionInput: BsvhuReceptionInput;
  BsvhuOperationInput: BsvhuOperationInput;
  BsvhuNextDestinationInput: BsvhuNextDestinationInput;
  BsvhuTransporterInput: BsvhuTransporterInput;
  BsvhuRecepisseInput: BsvhuRecepisseInput;
  BsvhuTransportInput: BsvhuTransportInput;
  PrivateCompanyInput: PrivateCompanyInput;
  BsffFicheInterventionInput: BsffFicheInterventionInput;
  BsffDetenteurInput: BsffDetenteurInput;
  BsffOperateurInput: BsffOperateurInput;
  CreateFormInput: CreateFormInput;
  EmitterInput: EmitterInput;
  RecipientInput: RecipientInput;
  TransporterInput: TransporterInput;
  WasteDetailsInput: WasteDetailsInput;
  PackagingInfoInput: PackagingInfoInput;
  TraderInput: TraderInput;
  BrokerInput: BrokerInput;
  AppendixFormInput: AppendixFormInput;
  EcoOrganismeInput: EcoOrganismeInput;
  TemporaryStorageDetailInput: TemporaryStorageDetailInput;
  DestinationInput: DestinationInput;
  CreateTraderReceiptInput: CreateTraderReceiptInput;
  CreateTransporterReceiptInput: CreateTransporterReceiptInput;
  UploadLink: UploadLink;
  CreateVhuAgrementInput: CreateVhuAgrementInput;
  DeleteBrokerReceiptInput: DeleteBrokerReceiptInput;
  DeleteTraderReceiptInput: DeleteTraderReceiptInput;
  DeleteTransporterReceiptInput: DeleteTransporterReceiptInput;
  DeleteVhuAgrementInput: DeleteVhuAgrementInput;
  NextSegmentInfoInput: NextSegmentInfoInput;
  ImportPaperFormInput: ImportPaperFormInput;
  SignatureFormInput: SignatureFormInput;
  ReceivedFormInput: ReceivedFormInput;
  ProcessedFormInput: ProcessedFormInput;
  NextDestinationInput: NextDestinationInput;
  InternationalCompanyInput: InternationalCompanyInput;
  AuthPayload: AuthPayload;
  AcceptedFormInput: AcceptedFormInput;
  ResealedFormInput: ResealedFormInput;
  WasteDetailsRepackagingInput: WasteDetailsRepackagingInput;
  ResentFormInput: ResentFormInput;
  SentFormInput: SentFormInput;
  TempStoredFormInput: TempStoredFormInput;
  TempStorerAcceptedFormInput: TempStorerAcceptedFormInput;
  FormInput: FormInput;
  SendVerificationCodeLetterInput: SendVerificationCodeLetterInput;
  BsdaSignatureInput: BsdaSignatureInput;
  BsdasriSignatureInput: BsdasriSignatureInput;
  BsdasriSignatureWithSecretCodeInput: BsdasriSignatureWithSecretCodeInput;
  SignatureInput: SignatureInput;
  BsvhuSignatureInput: BsvhuSignatureInput;
  TransporterSignatureFormInput: TransporterSignatureFormInput;
  SignupInput: SignupInput;
  TakeOverInput: TakeOverInput;
  UpdateBrokerReceiptInput: UpdateBrokerReceiptInput;
  BsdasriUpdateInput: BsdasriUpdateInput;
  UpdateFormInput: UpdateFormInput;
  UpdateTraderReceiptInput: UpdateTraderReceiptInput;
  UpdateTransporterReceiptInput: UpdateTransporterReceiptInput;
  UpdateVhuAgrementInput: UpdateVhuAgrementInput;
  VerifyCompanyInput: VerifyCompanyInput;
  VerifyCompanyByAdminInput: VerifyCompanyByAdminInput;
  Subscription: {};
  FormSubscription: FormSubscription;
  BsdasriInput: BsdasriInput;
};

export type AdminForVerificationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["AdminForVerification"] = ResolversParentTypes["AdminForVerification"]
> = {
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Appendix2FormResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Appendix2Form"] = ResolversParentTypes["Appendix2Form"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  readableId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  wasteDetails?: Resolver<
    Maybe<ResolversTypes["WasteDetails"]>,
    ParentType,
    ContextType
  >;
  emitter?: Resolver<Maybe<ResolversTypes["Emitter"]>, ParentType, ContextType>;
  emitterPostalCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  signedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  quantityReceived?: Resolver<
    Maybe<ResolversTypes["Float"]>,
    ParentType,
    ContextType
  >;
  processingOperationDone?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthPayloadResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["AuthPayload"] = ResolversParentTypes["AuthPayload"]
> = {
  token?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  user?: Resolver<ResolversTypes["User"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BrokerResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Broker"] = ResolversParentTypes["Broker"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  receipt?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  department?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  validityLimit?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BrokerReceiptResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BrokerReceipt"] = ResolversParentTypes["BrokerReceipt"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  receiptNumber?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  validityLimit?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  department?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Bsd"] = ResolversParentTypes["Bsd"]
> = {
  __resolveType: TypeResolveFn<
    "Form" | "Bsdasri" | "Bsvhu" | "Bsda" | "Bsff",
    ParentType,
    ContextType
  >;
};

export type BsdaResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Bsda"] = ResolversParentTypes["Bsda"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  isDraft?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["BsdaStatus"], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes["BsdaType"]>, ParentType, ContextType>;
  emitter?: Resolver<
    Maybe<ResolversTypes["BsdaEmitter"]>,
    ParentType,
    ContextType
  >;
  waste?: Resolver<Maybe<ResolversTypes["BsdaWaste"]>, ParentType, ContextType>;
  packagings?: Resolver<
    Maybe<Array<ResolversTypes["BsdaPackaging"]>>,
    ParentType,
    ContextType
  >;
  quantity?: Resolver<
    Maybe<ResolversTypes["BsdaQuantity"]>,
    ParentType,
    ContextType
  >;
  destination?: Resolver<
    Maybe<ResolversTypes["BsdaDestination"]>,
    ParentType,
    ContextType
  >;
  worker?: Resolver<
    Maybe<ResolversTypes["BsdaWorker"]>,
    ParentType,
    ContextType
  >;
  transporter?: Resolver<
    Maybe<ResolversTypes["BsdaTransporter"]>,
    ParentType,
    ContextType
  >;
  associations?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["BsdaAssociation"]>>>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaAssociationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaAssociation"] = ResolversParentTypes["BsdaAssociation"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["BsdaStatus"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaConnection"] = ResolversParentTypes["BsdaConnection"]
> = {
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  edges?: Resolver<Array<ResolversTypes["BsdaEdge"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaDestinationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaDestination"] = ResolversParentTypes["BsdaDestination"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  cap?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  plannedOperationCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  reception?: Resolver<
    Maybe<ResolversTypes["BsdaReception"]>,
    ParentType,
    ContextType
  >;
  operation?: Resolver<
    Maybe<ResolversTypes["BsdaOperation"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaEdge"] = ResolversParentTypes["BsdaEdge"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["Bsda"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaEmissionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaEmission"] = ResolversParentTypes["BsdaEmission"]
> = {
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaEmitterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaEmitter"] = ResolversParentTypes["BsdaEmitter"]
> = {
  isPrivateIndividual?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  worksite?: Resolver<
    Maybe<ResolversTypes["BsdaWorksite"]>,
    ParentType,
    ContextType
  >;
  emission?: Resolver<
    Maybe<ResolversTypes["BsdaEmission"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaOperationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaOperation"] = ResolversParentTypes["BsdaOperation"]
> = {
  code?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  date?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaPackagingResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaPackaging"] = ResolversParentTypes["BsdaPackaging"]
> = {
  type?: Resolver<ResolversTypes["BsdaPackagingType"], ParentType, ContextType>;
  other?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaQuantityResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaQuantity"] = ResolversParentTypes["BsdaQuantity"]
> = {
  type?: Resolver<
    Maybe<ResolversTypes["BsdaQuantityType"]>,
    ParentType,
    ContextType
  >;
  value?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaRecepisseResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaRecepisse"] = ResolversParentTypes["BsdaRecepisse"]
> = {
  number?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  department?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  validityLimit?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaReceptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaReception"] = ResolversParentTypes["BsdaReception"]
> = {
  date?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  quantity?: Resolver<
    Maybe<ResolversTypes["BsdaQuantity"]>,
    ParentType,
    ContextType
  >;
  acceptationStatus?: Resolver<
    Maybe<ResolversTypes["BsdaAcceptationStatus"]>,
    ParentType,
    ContextType
  >;
  refusalReason?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Bsdasri"] = ResolversParentTypes["Bsdasri"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["BsdasriStatus"], ParentType, ContextType>;
  bsdasriType?: Resolver<
    ResolversTypes["BsdasriType"],
    ParentType,
    ContextType
  >;
  createdAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  updatedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  isDraft?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  emitter?: Resolver<
    Maybe<ResolversTypes["BsdasriEmitter"]>,
    ParentType,
    ContextType
  >;
  emission?: Resolver<
    Maybe<ResolversTypes["BsdasriEmission"]>,
    ParentType,
    ContextType
  >;
  transporter?: Resolver<
    Maybe<ResolversTypes["BsdasriTransporter"]>,
    ParentType,
    ContextType
  >;
  transport?: Resolver<
    Maybe<ResolversTypes["BsdasriTransport"]>,
    ParentType,
    ContextType
  >;
  recipient?: Resolver<
    Maybe<ResolversTypes["BsdasriRecipient"]>,
    ParentType,
    ContextType
  >;
  reception?: Resolver<
    Maybe<ResolversTypes["BsdasriReception"]>,
    ParentType,
    ContextType
  >;
  operation?: Resolver<
    Maybe<ResolversTypes["BsdasriOperation"]>,
    ParentType,
    ContextType
  >;
  regroupedBsdasris?: Resolver<
    Maybe<Array<ResolversTypes["ID"]>>,
    ParentType,
    ContextType
  >;
  metadata?: Resolver<
    ResolversTypes["BsdasriMetadata"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriConnection"] = ResolversParentTypes["BsdasriConnection"]
> = {
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  edges?: Resolver<
    Array<ResolversTypes["BsdasriEdge"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriEdge"] = ResolversParentTypes["BsdasriEdge"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["Bsdasri"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriEmissionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriEmission"] = ResolversParentTypes["BsdasriEmission"]
> = {
  wasteCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  wasteDetails?: Resolver<
    Maybe<ResolversTypes["BsdasriEmissionWasteDetails"]>,
    ParentType,
    ContextType
  >;
  handedOverAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["BsdasriSignature"]>,
    ParentType,
    ContextType
  >;
  isTakenOverWithoutEmitterSignature?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  isTakenOverWithSecretCode?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriEmissionWasteDetailsResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriEmissionWasteDetails"] = ResolversParentTypes["BsdasriEmissionWasteDetails"]
> = {
  quantity?: Resolver<
    Maybe<ResolversTypes["BsdasriQuantity"]>,
    ParentType,
    ContextType
  >;
  volume?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  packagingInfos?: Resolver<
    Maybe<Array<ResolversTypes["BsdasriPackagingInfo"]>>,
    ParentType,
    ContextType
  >;
  onuCode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriEmitterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriEmitter"] = ResolversParentTypes["BsdasriEmitter"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  workSite?: Resolver<
    Maybe<ResolversTypes["WorkSite"]>,
    ParentType,
    ContextType
  >;
  handOverToTransporterAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  customInfo?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  type?: Resolver<
    Maybe<ResolversTypes["BsdasriEmitterType"]>,
    ParentType,
    ContextType
  >;
  onBehalfOfEcoorganisme?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriErrorResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriError"] = ResolversParentTypes["BsdasriError"]
> = {
  message?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  path?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  requiredFor?: Resolver<
    Array<ResolversTypes["BsdasriSignatureType"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriMetadataResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriMetadata"] = ResolversParentTypes["BsdasriMetadata"]
> = {
  errors?: Resolver<
    Array<Maybe<ResolversTypes["BsdasriError"]>>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriOperationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriOperation"] = ResolversParentTypes["BsdasriOperation"]
> = {
  quantity?: Resolver<
    Maybe<ResolversTypes["BsdasriOperationQuantity"]>,
    ParentType,
    ContextType
  >;
  processingOperation?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  processedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["BsdasriSignature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriOperationQuantityResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriOperationQuantity"] = ResolversParentTypes["BsdasriOperationQuantity"]
> = {
  value?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriPackagingInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriPackagingInfo"] = ResolversParentTypes["BsdasriPackagingInfo"]
> = {
  type?: Resolver<ResolversTypes["BsdasriPackagings"], ParentType, ContextType>;
  other?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  volume?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriQuantityResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriQuantity"] = ResolversParentTypes["BsdasriQuantity"]
> = {
  value?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  type?: Resolver<
    Maybe<ResolversTypes["QuantityType"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriReceptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriReception"] = ResolversParentTypes["BsdasriReception"]
> = {
  wasteDetails?: Resolver<
    Maybe<ResolversTypes["BsdasriReceptionWasteDetails"]>,
    ParentType,
    ContextType
  >;
  wasteAcceptation?: Resolver<
    Maybe<ResolversTypes["BsdasriWasteAcceptation"]>,
    ParentType,
    ContextType
  >;
  receivedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["BsdasriSignature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriReceptionWasteDetailsResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriReceptionWasteDetails"] = ResolversParentTypes["BsdasriReceptionWasteDetails"]
> = {
  volume?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  packagingInfos?: Resolver<
    Maybe<Array<ResolversTypes["BsdasriPackagingInfo"]>>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriRecipientResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriRecipient"] = ResolversParentTypes["BsdasriRecipient"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  customInfo?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriSignatureResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriSignature"] = ResolversParentTypes["BsdasriSignature"]
> = {
  date?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  author?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriTransportResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriTransport"] = ResolversParentTypes["BsdasriTransport"]
> = {
  wasteDetails?: Resolver<
    Maybe<ResolversTypes["BsdasriTransportWasteDetails"]>,
    ParentType,
    ContextType
  >;
  wasteAcceptation?: Resolver<
    Maybe<ResolversTypes["BsdasriWasteAcceptation"]>,
    ParentType,
    ContextType
  >;
  handedOverAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  takenOverAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["BsdasriSignature"]>,
    ParentType,
    ContextType
  >;
  mode?: Resolver<ResolversTypes["TransportMode"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriTransporterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriTransporter"] = ResolversParentTypes["BsdasriTransporter"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  receipt?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  receiptDepartment?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  receiptValidityLimit?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  customInfo?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriTransportWasteDetailsResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriTransportWasteDetails"] = ResolversParentTypes["BsdasriTransportWasteDetails"]
> = {
  quantity?: Resolver<
    Maybe<ResolversTypes["BsdasriQuantity"]>,
    ParentType,
    ContextType
  >;
  volume?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  packagingInfos?: Resolver<
    Maybe<Array<ResolversTypes["BsdasriPackagingInfo"]>>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdasriWasteAcceptationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdasriWasteAcceptation"] = ResolversParentTypes["BsdasriWasteAcceptation"]
> = {
  status?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  refusalReason?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  refusedQuantity?: Resolver<
    Maybe<ResolversTypes["Float"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaTransportResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaTransport"] = ResolversParentTypes["BsdaTransport"]
> = {
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaTransporterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaTransporter"] = ResolversParentTypes["BsdaTransporter"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  recepisse?: Resolver<
    Maybe<ResolversTypes["BsdaRecepisse"]>,
    ParentType,
    ContextType
  >;
  transport?: Resolver<
    Maybe<ResolversTypes["BsdaTransport"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaWasteResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaWaste"] = ResolversParentTypes["BsdaWaste"]
> = {
  code?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  familyCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  materialName?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  consistence?: Resolver<
    Maybe<ResolversTypes["BsdaConsistence"]>,
    ParentType,
    ContextType
  >;
  sealNumbers?: Resolver<
    Maybe<Array<ResolversTypes["String"]>>,
    ParentType,
    ContextType
  >;
  adr?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaWorkResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaWork"] = ResolversParentTypes["BsdaWork"]
> = {
  hasEmitterPaperSignature?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaWorkerResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaWorker"] = ResolversParentTypes["BsdaWorker"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  work?: Resolver<Maybe<ResolversTypes["BsdaWork"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdaWorksiteResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdaWorksite"] = ResolversParentTypes["BsdaWorksite"]
> = {
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  postalCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  infos?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdConnection"] = ResolversParentTypes["BsdConnection"]
> = {
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  edges?: Resolver<Array<ResolversTypes["BsdEdge"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsdEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsdEdge"] = ResolversParentTypes["BsdEdge"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["Bsd"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Bsff"] = ResolversParentTypes["Bsff"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["BsffStatus"], ParentType, ContextType>;
  emitter?: Resolver<
    Maybe<ResolversTypes["BsffEmitter"]>,
    ParentType,
    ContextType
  >;
  packagings?: Resolver<
    Array<ResolversTypes["BsffPackaging"]>,
    ParentType,
    ContextType
  >;
  waste?: Resolver<Maybe<ResolversTypes["BsffWaste"]>, ParentType, ContextType>;
  quantity?: Resolver<
    Maybe<ResolversTypes["BsffQuantity"]>,
    ParentType,
    ContextType
  >;
  transporter?: Resolver<
    Maybe<ResolversTypes["BsffTransporter"]>,
    ParentType,
    ContextType
  >;
  destination?: Resolver<
    Maybe<ResolversTypes["BsffDestination"]>,
    ParentType,
    ContextType
  >;
  ficheInterventions?: Resolver<
    Array<ResolversTypes["BsffFicheIntervention"]>,
    ParentType,
    ContextType
  >;
  bsffs?: Resolver<Array<ResolversTypes["Bsff"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffConnection"] = ResolversParentTypes["BsffConnection"]
> = {
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  edges?: Resolver<Array<ResolversTypes["BsffEdge"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffDestinationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffDestination"] = ResolversParentTypes["BsffDestination"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  reception?: Resolver<
    Maybe<ResolversTypes["BsffReception"]>,
    ParentType,
    ContextType
  >;
  operation?: Resolver<
    Maybe<ResolversTypes["BsffOperation"]>,
    ParentType,
    ContextType
  >;
  plannedOperation?: Resolver<
    Maybe<ResolversTypes["BsffPlannedOperation"]>,
    ParentType,
    ContextType
  >;
  cap?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffDetenteurResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffDetenteur"] = ResolversParentTypes["BsffDetenteur"]
> = {
  company?: Resolver<ResolversTypes["FormCompany"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffEdge"] = ResolversParentTypes["BsffEdge"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["Bsff"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffEmissionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffEmission"] = ResolversParentTypes["BsffEmission"]
> = {
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffEmitterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffEmitter"] = ResolversParentTypes["BsffEmitter"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  emission?: Resolver<
    Maybe<ResolversTypes["BsffEmission"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffFicheInterventionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffFicheIntervention"] = ResolversParentTypes["BsffFicheIntervention"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  numero?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  kilos?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  detenteur?: Resolver<
    Maybe<ResolversTypes["BsffDetenteur"]>,
    ParentType,
    ContextType
  >;
  operateur?: Resolver<
    Maybe<ResolversTypes["BsffOperateur"]>,
    ParentType,
    ContextType
  >;
  postalCode?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffNextDestinationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffNextDestination"] = ResolversParentTypes["BsffNextDestination"]
> = {
  company?: Resolver<ResolversTypes["FormCompany"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffOperateurResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffOperateur"] = ResolversParentTypes["BsffOperateur"]
> = {
  company?: Resolver<ResolversTypes["FormCompany"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffOperationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffOperation"] = ResolversParentTypes["BsffOperation"]
> = {
  code?: Resolver<
    Maybe<ResolversTypes["BsffOperationCode"]>,
    ParentType,
    ContextType
  >;
  nextDestination?: Resolver<
    Maybe<ResolversTypes["BsffNextDestination"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffPackagingResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffPackaging"] = ResolversParentTypes["BsffPackaging"]
> = {
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  numero?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  kilos?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffPlannedOperationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffPlannedOperation"] = ResolversParentTypes["BsffPlannedOperation"]
> = {
  code?: Resolver<
    Maybe<ResolversTypes["BsffOperationCode"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffQuantityResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffQuantity"] = ResolversParentTypes["BsffQuantity"]
> = {
  kilos?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  isEstimate?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffReceptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffReception"] = ResolversParentTypes["BsffReception"]
> = {
  date?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  kilos?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  refusal?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffTransportResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffTransport"] = ResolversParentTypes["BsffTransport"]
> = {
  mode?: Resolver<ResolversTypes["TransportMode"], ParentType, ContextType>;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffTransporterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffTransporter"] = ResolversParentTypes["BsffTransporter"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  recepisse?: Resolver<
    Maybe<ResolversTypes["BsffTransporterRecepisse"]>,
    ParentType,
    ContextType
  >;
  transport?: Resolver<
    Maybe<ResolversTypes["BsffTransport"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffTransporterRecepisseResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffTransporterRecepisse"] = ResolversParentTypes["BsffTransporterRecepisse"]
> = {
  number?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  department?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  validityLimit?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsffWasteResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsffWaste"] = ResolversParentTypes["BsffWaste"]
> = {
  code?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  nature?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  adr?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Bsvhu"] = ResolversParentTypes["Bsvhu"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  createdAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  updatedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  isDraft?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["BsvhuStatus"], ParentType, ContextType>;
  emitter?: Resolver<
    Maybe<ResolversTypes["BsvhuEmitter"]>,
    ParentType,
    ContextType
  >;
  wasteCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  packaging?: Resolver<
    Maybe<ResolversTypes["BsvhuPackaging"]>,
    ParentType,
    ContextType
  >;
  identification?: Resolver<
    Maybe<ResolversTypes["BsvhuIdentification"]>,
    ParentType,
    ContextType
  >;
  quantity?: Resolver<
    Maybe<ResolversTypes["BsvhuQuantity"]>,
    ParentType,
    ContextType
  >;
  destination?: Resolver<
    Maybe<ResolversTypes["BsvhuDestination"]>,
    ParentType,
    ContextType
  >;
  transporter?: Resolver<
    Maybe<ResolversTypes["BsvhuTransporter"]>,
    ParentType,
    ContextType
  >;
  metadata?: Resolver<ResolversTypes["BsvhuMetadata"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuConnection"] = ResolversParentTypes["BsvhuConnection"]
> = {
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  edges?: Resolver<Array<ResolversTypes["BsvhuEdge"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuDestinationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuDestination"] = ResolversParentTypes["BsvhuDestination"]
> = {
  type?: Resolver<
    Maybe<ResolversTypes["BsvhuDestinationType"]>,
    ParentType,
    ContextType
  >;
  agrementNumber?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  plannedOperationCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  reception?: Resolver<
    Maybe<ResolversTypes["BsvhuReception"]>,
    ParentType,
    ContextType
  >;
  operation?: Resolver<
    Maybe<ResolversTypes["BsvhuOperation"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuEdgeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuEdge"] = ResolversParentTypes["BsvhuEdge"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["Bsvhu"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuEmissionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuEmission"] = ResolversParentTypes["BsvhuEmission"]
> = {
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuEmitterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuEmitter"] = ResolversParentTypes["BsvhuEmitter"]
> = {
  agrementNumber?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  emission?: Resolver<
    Maybe<ResolversTypes["BsvhuEmission"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuErrorResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuError"] = ResolversParentTypes["BsvhuError"]
> = {
  message?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  path?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  requiredFor?: Resolver<
    ResolversTypes["SignatureTypeInput"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuIdentificationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuIdentification"] = ResolversParentTypes["BsvhuIdentification"]
> = {
  numbers?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["String"]>>>,
    ParentType,
    ContextType
  >;
  type?: Resolver<
    Maybe<ResolversTypes["BsvhuIdentificationType"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuMetadataResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuMetadata"] = ResolversParentTypes["BsvhuMetadata"]
> = {
  errors?: Resolver<
    Array<ResolversTypes["BsvhuError"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuNextDestinationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuNextDestination"] = ResolversParentTypes["BsvhuNextDestination"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuOperationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuOperation"] = ResolversParentTypes["BsvhuOperation"]
> = {
  date?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  code?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  nextDestination?: Resolver<
    Maybe<ResolversTypes["BsvhuNextDestination"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuQuantityResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuQuantity"] = ResolversParentTypes["BsvhuQuantity"]
> = {
  number?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  tons?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuRecepisseResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuRecepisse"] = ResolversParentTypes["BsvhuRecepisse"]
> = {
  number?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  department?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  validityLimit?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuReceptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuReception"] = ResolversParentTypes["BsvhuReception"]
> = {
  date?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  quantity?: Resolver<
    Maybe<ResolversTypes["BsvhuQuantity"]>,
    ParentType,
    ContextType
  >;
  acceptationStatus?: Resolver<
    Maybe<ResolversTypes["BsvhuAcceptationStatus"]>,
    ParentType,
    ContextType
  >;
  refusalReason?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  identification?: Resolver<
    Maybe<ResolversTypes["BsvhuIdentification"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuTransportResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuTransport"] = ResolversParentTypes["BsvhuTransport"]
> = {
  takenOverAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  signature?: Resolver<
    Maybe<ResolversTypes["Signature"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BsvhuTransporterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["BsvhuTransporter"] = ResolversParentTypes["BsvhuTransporter"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  recepisse?: Resolver<
    Maybe<ResolversTypes["BsvhuRecepisse"]>,
    ParentType,
    ContextType
  >;
  transport?: Resolver<
    Maybe<ResolversTypes["BsvhuTransport"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyFavoriteResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanyFavorite"] = ResolversParentTypes["CompanyFavorite"]
> = {
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  siret?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  contact?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  mail?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  transporterReceipt?: Resolver<
    Maybe<ResolversTypes["TransporterReceipt"]>,
    ParentType,
    ContextType
  >;
  traderReceipt?: Resolver<
    Maybe<ResolversTypes["TraderReceipt"]>,
    ParentType,
    ContextType
  >;
  brokerReceipt?: Resolver<
    Maybe<ResolversTypes["BrokerReceipt"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementDemolisseur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementBroyeur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyForVerificationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanyForVerification"] = ResolversParentTypes["CompanyForVerification"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  siret?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  companyTypes?: Resolver<
    Array<ResolversTypes["CompanyType"]>,
    ParentType,
    ContextType
  >;
  createdAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  verificationStatus?: Resolver<
    ResolversTypes["CompanyVerificationStatus"],
    ParentType,
    ContextType
  >;
  verificationComment?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  verificationMode?: Resolver<
    Maybe<ResolversTypes["CompanyVerificationMode"]>,
    ParentType,
    ContextType
  >;
  verifiedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  admin?: Resolver<
    Maybe<ResolversTypes["AdminForVerification"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyForVerificationConnectionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanyForVerificationConnection"] = ResolversParentTypes["CompanyForVerificationConnection"]
> = {
  totalCount?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  companies?: Resolver<
    Array<ResolversTypes["CompanyForVerification"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyMemberResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanyMember"] = ResolversParentTypes["CompanyMember"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes["UserRole"]>, ParentType, ContextType>;
  isActive?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  isPendingInvitation?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  isMe?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyPrivateResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanyPrivate"] = ResolversParentTypes["CompanyPrivate"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  companyTypes?: Resolver<
    Array<ResolversTypes["CompanyType"]>,
    ParentType,
    ContextType
  >;
  gerepId?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  securityCode?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  verificationStatus?: Resolver<
    ResolversTypes["CompanyVerificationStatus"],
    ParentType,
    ContextType
  >;
  contactEmail?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  contactPhone?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  website?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  users?: Resolver<
    Maybe<Array<ResolversTypes["CompanyMember"]>>,
    ParentType,
    ContextType
  >;
  userRole?: Resolver<
    Maybe<ResolversTypes["UserRole"]>,
    ParentType,
    ContextType
  >;
  givenName?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  siret?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  naf?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  libelleNaf?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  installation?: Resolver<
    Maybe<ResolversTypes["Installation"]>,
    ParentType,
    ContextType
  >;
  transporterReceipt?: Resolver<
    Maybe<ResolversTypes["TransporterReceipt"]>,
    ParentType,
    ContextType
  >;
  traderReceipt?: Resolver<
    Maybe<ResolversTypes["TraderReceipt"]>,
    ParentType,
    ContextType
  >;
  brokerReceipt?: Resolver<
    Maybe<ResolversTypes["BrokerReceipt"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementDemolisseur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementBroyeur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  ecoOrganismeAgreements?: Resolver<
    Array<ResolversTypes["URL"]>,
    ParentType,
    ContextType
  >;
  allowBsdasriTakeOverWithoutSignature?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyPublicResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanyPublic"] = ResolversParentTypes["CompanyPublic"]
> = {
  contactEmail?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  contactPhone?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  website?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  siret?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  etatAdministratif?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  naf?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  libelleNaf?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  installation?: Resolver<
    Maybe<ResolversTypes["Installation"]>,
    ParentType,
    ContextType
  >;
  isRegistered?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  companyTypes?: Resolver<
    Array<ResolversTypes["CompanyType"]>,
    ParentType,
    ContextType
  >;
  transporterReceipt?: Resolver<
    Maybe<ResolversTypes["TransporterReceipt"]>,
    ParentType,
    ContextType
  >;
  traderReceipt?: Resolver<
    Maybe<ResolversTypes["TraderReceipt"]>,
    ParentType,
    ContextType
  >;
  brokerReceipt?: Resolver<
    Maybe<ResolversTypes["BrokerReceipt"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementDemolisseur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementBroyeur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  ecoOrganismeAgreements?: Resolver<
    Array<ResolversTypes["URL"]>,
    ParentType,
    ContextType
  >;
  allowBsdasriTakeOverWithoutSignature?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanySearchResultResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanySearchResult"] = ResolversParentTypes["CompanySearchResult"]
> = {
  siret?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  etatAdministratif?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  codeCommune?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  naf?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  libelleNaf?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  installation?: Resolver<
    Maybe<ResolversTypes["Installation"]>,
    ParentType,
    ContextType
  >;
  transporterReceipt?: Resolver<
    Maybe<ResolversTypes["TransporterReceipt"]>,
    ParentType,
    ContextType
  >;
  traderReceipt?: Resolver<
    Maybe<ResolversTypes["TraderReceipt"]>,
    ParentType,
    ContextType
  >;
  brokerReceipt?: Resolver<
    Maybe<ResolversTypes["BrokerReceipt"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementDemolisseur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  vhuAgrementBroyeur?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyStatResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["CompanyStat"] = ResolversParentTypes["CompanyStat"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  stats?: Resolver<Array<ResolversTypes["Stat"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime";
}

export type DeclarationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Declaration"] = ResolversParentTypes["Declaration"]
> = {
  annee?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  codeDechet?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  libDechet?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  gerepType?: Resolver<
    Maybe<ResolversTypes["GerepType"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DestinationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Destination"] = ResolversParentTypes["Destination"]
> = {
  cap?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  processingOperation?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  isFilledByEmitter?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EcoOrganismeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["EcoOrganisme"] = ResolversParentTypes["EcoOrganisme"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  siret?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  address?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EmitterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Emitter"] = ResolversParentTypes["Emitter"]
> = {
  type?: Resolver<
    Maybe<ResolversTypes["EmitterType"]>,
    ParentType,
    ContextType
  >;
  workSite?: Resolver<
    Maybe<ResolversTypes["WorkSite"]>,
    ParentType,
    ContextType
  >;
  pickupSite?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FileDownloadResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["FileDownload"] = ResolversParentTypes["FileDownload"]
> = {
  token?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  downloadLink?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FormResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Form"] = ResolversParentTypes["Form"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  readableId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  customId?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  isImportedFromPaper?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType
  >;
  emitter?: Resolver<Maybe<ResolversTypes["Emitter"]>, ParentType, ContextType>;
  recipient?: Resolver<
    Maybe<ResolversTypes["Recipient"]>,
    ParentType,
    ContextType
  >;
  transporter?: Resolver<
    Maybe<ResolversTypes["Transporter"]>,
    ParentType,
    ContextType
  >;
  wasteDetails?: Resolver<
    Maybe<ResolversTypes["WasteDetails"]>,
    ParentType,
    ContextType
  >;
  trader?: Resolver<Maybe<ResolversTypes["Trader"]>, ParentType, ContextType>;
  broker?: Resolver<Maybe<ResolversTypes["Broker"]>, ParentType, ContextType>;
  createdAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  updatedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  status?: Resolver<ResolversTypes["FormStatus"], ParentType, ContextType>;
  signedByTransporter?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  sentAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  sentBy?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  wasteAcceptationStatus?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  wasteRefusalReason?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  receivedBy?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  receivedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  signedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  quantityReceived?: Resolver<
    Maybe<ResolversTypes["Float"]>,
    ParentType,
    ContextType
  >;
  processingOperationDone?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  processingOperationDescription?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  processedBy?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  processedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  noTraceability?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  nextDestination?: Resolver<
    Maybe<ResolversTypes["NextDestination"]>,
    ParentType,
    ContextType
  >;
  appendix2Forms?: Resolver<
    Maybe<Array<ResolversTypes["Appendix2Form"]>>,
    ParentType,
    ContextType
  >;
  ecoOrganisme?: Resolver<
    Maybe<ResolversTypes["FormEcoOrganisme"]>,
    ParentType,
    ContextType
  >;
  temporaryStorageDetail?: Resolver<
    Maybe<ResolversTypes["TemporaryStorageDetail"]>,
    ParentType,
    ContextType
  >;
  stateSummary?: Resolver<
    Maybe<ResolversTypes["StateSummary"]>,
    ParentType,
    ContextType
  >;
  transportSegments?: Resolver<
    Maybe<Array<ResolversTypes["TransportSegment"]>>,
    ParentType,
    ContextType
  >;
  currentTransporterSiret?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  nextTransporterSiret?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FormCompanyResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["FormCompany"] = ResolversParentTypes["FormCompany"]
> = {
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  siret?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  contact?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  mail?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  vatNumber?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FormEcoOrganismeResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["FormEcoOrganisme"] = ResolversParentTypes["FormEcoOrganisme"]
> = {
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  siret?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FormsLifeCycleDataResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["formsLifeCycleData"] = ResolversParentTypes["formsLifeCycleData"]
> = {
  statusLogs?: Resolver<
    Array<ResolversTypes["StatusLog"]>,
    ParentType,
    ContextType
  >;
  hasNextPage?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  hasPreviousPage?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  startCursor?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  endCursor?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  count?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FormSubscriptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["FormSubscription"] = ResolversParentTypes["FormSubscription"]
> = {
  mutation?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  node?: Resolver<Maybe<ResolversTypes["Form"]>, ParentType, ContextType>;
  updatedFields?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["String"]>>>,
    ParentType,
    ContextType
  >;
  previousValues?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InstallationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Installation"] = ResolversParentTypes["Installation"]
> = {
  codeS3ic?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  urlFiche?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  rubriques?: Resolver<
    Maybe<Array<ResolversTypes["Rubrique"]>>,
    ParentType,
    ContextType
  >;
  declarations?: Resolver<
    Maybe<Array<ResolversTypes["Declaration"]>>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InvitationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Invitation"] = ResolversParentTypes["Invitation"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  companySiret?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  role?: Resolver<ResolversTypes["UserRole"], ParentType, ContextType>;
  acceptedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export type MembershipRequestResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["MembershipRequest"] = ResolversParentTypes["MembershipRequest"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  siret?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  status?: Resolver<
    ResolversTypes["MembershipRequestStatus"],
    ParentType,
    ContextType
  >;
  sentTo?: Resolver<Array<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]
> = {
  acceptMembershipRequest?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationAcceptMembershipRequestArgs, "id" | "role">
  >;
  changePassword?: Resolver<
    ResolversTypes["User"],
    ParentType,
    ContextType,
    RequireFields<MutationChangePasswordArgs, "oldPassword" | "newPassword">
  >;
  createBrokerReceipt?: Resolver<
    Maybe<ResolversTypes["BrokerReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateBrokerReceiptArgs, "input">
  >;
  createBsda?: Resolver<
    Maybe<ResolversTypes["Bsda"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateBsdaArgs, "input">
  >;
  createBsdasri?: Resolver<
    ResolversTypes["Bsdasri"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateBsdasriArgs, "input">
  >;
  createBsff?: Resolver<
    ResolversTypes["Bsff"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateBsffArgs, "input">
  >;
  createBsvhu?: Resolver<
    Maybe<ResolversTypes["Bsvhu"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateBsvhuArgs, "input">
  >;
  createCompany?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateCompanyArgs, "companyInput">
  >;
  createDraftBsda?: Resolver<
    Maybe<ResolversTypes["Bsda"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateDraftBsdaArgs, "input">
  >;
  createDraftBsdasri?: Resolver<
    ResolversTypes["Bsdasri"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateDraftBsdasriArgs, "input">
  >;
  createDraftBsvhu?: Resolver<
    Maybe<ResolversTypes["Bsvhu"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateDraftBsvhuArgs, "input">
  >;
  createFicheInterventionBsff?: Resolver<
    ResolversTypes["BsffFicheIntervention"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateFicheInterventionBsffArgs, "input">
  >;
  createForm?: Resolver<
    ResolversTypes["Form"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateFormArgs, "createFormInput">
  >;
  createTraderReceipt?: Resolver<
    Maybe<ResolversTypes["TraderReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateTraderReceiptArgs, "input">
  >;
  createTransporterReceipt?: Resolver<
    Maybe<ResolversTypes["TransporterReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateTransporterReceiptArgs, "input">
  >;
  createUploadLink?: Resolver<
    ResolversTypes["UploadLink"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateUploadLinkArgs, "fileName" | "fileType">
  >;
  createVhuAgrement?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateVhuAgrementArgs, "input">
  >;
  deleteBrokerReceipt?: Resolver<
    Maybe<ResolversTypes["BrokerReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteBrokerReceiptArgs, "input">
  >;
  deleteBsda?: Resolver<
    Maybe<ResolversTypes["Bsda"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteBsdaArgs, "id">
  >;
  deleteBsdasri?: Resolver<
    Maybe<ResolversTypes["Bsdasri"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteBsdasriArgs, "id">
  >;
  deleteBsff?: Resolver<
    ResolversTypes["Bsff"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteBsffArgs, "id">
  >;
  deleteBsvhu?: Resolver<
    Maybe<ResolversTypes["Bsvhu"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteBsvhuArgs, "id">
  >;
  deleteForm?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteFormArgs, "id">
  >;
  deleteInvitation?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteInvitationArgs, "email" | "siret">
  >;
  deleteTraderReceipt?: Resolver<
    Maybe<ResolversTypes["TraderReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteTraderReceiptArgs, "input">
  >;
  deleteTransporterReceipt?: Resolver<
    Maybe<ResolversTypes["TransporterReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteTransporterReceiptArgs, "input">
  >;
  deleteVhuAgrement?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteVhuAgrementArgs, "input">
  >;
  duplicateBsda?: Resolver<
    Maybe<ResolversTypes["Bsda"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDuplicateBsdaArgs, "id">
  >;
  duplicateBsdasri?: Resolver<
    Maybe<ResolversTypes["Bsdasri"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDuplicateBsdasriArgs, "id">
  >;
  duplicateBsvhu?: Resolver<
    Maybe<ResolversTypes["Bsvhu"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDuplicateBsvhuArgs, "id">
  >;
  duplicateForm?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationDuplicateFormArgs, "id">
  >;
  editProfile?: Resolver<
    ResolversTypes["User"],
    ParentType,
    ContextType,
    RequireFields<MutationEditProfileArgs, never>
  >;
  editSegment?: Resolver<
    Maybe<ResolversTypes["TransportSegment"]>,
    ParentType,
    ContextType,
    RequireFields<MutationEditSegmentArgs, "id" | "siret" | "nextSegmentInfo">
  >;
  importPaperForm?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationImportPaperFormArgs, "input">
  >;
  inviteUserToCompany?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationInviteUserToCompanyArgs, "email" | "siret" | "role">
  >;
  joinWithInvite?: Resolver<
    ResolversTypes["User"],
    ParentType,
    ContextType,
    RequireFields<
      MutationJoinWithInviteArgs,
      "inviteHash" | "name" | "password"
    >
  >;
  login?: Resolver<
    ResolversTypes["AuthPayload"],
    ParentType,
    ContextType,
    RequireFields<MutationLoginArgs, "email" | "password">
  >;
  markAsAccepted?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsAcceptedArgs, "id" | "acceptedInfo">
  >;
  markAsProcessed?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsProcessedArgs, "id" | "processedInfo">
  >;
  markAsReceived?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsReceivedArgs, "id" | "receivedInfo">
  >;
  markAsResealed?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsResealedArgs, "id" | "resealedInfos">
  >;
  markAsResent?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsResentArgs, "id" | "resentInfos">
  >;
  markAsSealed?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsSealedArgs, "id">
  >;
  markAsSent?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsSentArgs, "id" | "sentInfo">
  >;
  markAsTempStored?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkAsTempStoredArgs, "id" | "tempStoredInfos">
  >;
  markAsTempStorerAccepted?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationMarkAsTempStorerAcceptedArgs,
      "id" | "tempStorerAcceptedInfo"
    >
  >;
  markSegmentAsReadyToTakeOver?: Resolver<
    Maybe<ResolversTypes["TransportSegment"]>,
    ParentType,
    ContextType,
    RequireFields<MutationMarkSegmentAsReadyToTakeOverArgs, "id">
  >;
  prepareSegment?: Resolver<
    Maybe<ResolversTypes["TransportSegment"]>,
    ParentType,
    ContextType,
    RequireFields<
      MutationPrepareSegmentArgs,
      "id" | "siret" | "nextSegmentInfo"
    >
  >;
  publishBsda?: Resolver<
    Maybe<ResolversTypes["Bsda"]>,
    ParentType,
    ContextType,
    RequireFields<MutationPublishBsdaArgs, "id">
  >;
  publishBsdasri?: Resolver<
    Maybe<ResolversTypes["Bsdasri"]>,
    ParentType,
    ContextType,
    RequireFields<MutationPublishBsdasriArgs, "id">
  >;
  publishBsvhu?: Resolver<
    Maybe<ResolversTypes["Bsvhu"]>,
    ParentType,
    ContextType,
    RequireFields<MutationPublishBsvhuArgs, "id">
  >;
  refuseMembershipRequest?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationRefuseMembershipRequestArgs, "id">
  >;
  removeUserFromCompany?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationRemoveUserFromCompanyArgs, "userId" | "siret">
  >;
  renewSecurityCode?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationRenewSecurityCodeArgs, "siret">
  >;
  resendActivationEmail?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationResendActivationEmailArgs, "email">
  >;
  resendInvitation?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationResendInvitationArgs, "email" | "siret">
  >;
  resetPassword?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationResetPasswordArgs, "email">
  >;
  saveForm?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSaveFormArgs, "formInput">
  >;
  sendMembershipRequest?: Resolver<
    Maybe<ResolversTypes["MembershipRequest"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSendMembershipRequestArgs, "siret">
  >;
  sendVerificationCodeLetter?: Resolver<
    ResolversTypes["CompanyForVerification"],
    ParentType,
    ContextType,
    RequireFields<MutationSendVerificationCodeLetterArgs, "input">
  >;
  signBsda?: Resolver<
    Maybe<ResolversTypes["Bsda"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSignBsdaArgs, "id" | "input">
  >;
  signBsdasri?: Resolver<
    Maybe<ResolversTypes["Bsdasri"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSignBsdasriArgs, "id" | "input">
  >;
  signBsdasriEmissionWithSecretCode?: Resolver<
    Maybe<ResolversTypes["Bsdasri"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSignBsdasriEmissionWithSecretCodeArgs, "id" | "input">
  >;
  signBsff?: Resolver<
    ResolversTypes["Bsff"],
    ParentType,
    ContextType,
    RequireFields<MutationSignBsffArgs, "id" | "type" | "signature">
  >;
  signBsvhu?: Resolver<
    Maybe<ResolversTypes["Bsvhu"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSignBsvhuArgs, "id" | "input">
  >;
  signedByTransporter?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSignedByTransporterArgs, "id" | "signingInfo">
  >;
  signup?: Resolver<
    ResolversTypes["User"],
    ParentType,
    ContextType,
    RequireFields<MutationSignupArgs, "userInfos">
  >;
  takeOverSegment?: Resolver<
    Maybe<ResolversTypes["TransportSegment"]>,
    ParentType,
    ContextType,
    RequireFields<MutationTakeOverSegmentArgs, "id" | "takeOverInfo">
  >;
  updateBrokerReceipt?: Resolver<
    Maybe<ResolversTypes["BrokerReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateBrokerReceiptArgs, "input">
  >;
  updateBsda?: Resolver<
    Maybe<ResolversTypes["Bsda"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateBsdaArgs, "id" | "input">
  >;
  updateBsdasri?: Resolver<
    ResolversTypes["Bsdasri"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateBsdasriArgs, "id" | "input">
  >;
  updateBsff?: Resolver<
    ResolversTypes["Bsff"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateBsffArgs, "id" | "input">
  >;
  updateBsvhu?: Resolver<
    Maybe<ResolversTypes["Bsvhu"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateBsvhuArgs, "id" | "input">
  >;
  updateCompany?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateCompanyArgs, "siret">
  >;
  updateFicheInterventionBsff?: Resolver<
    ResolversTypes["BsffFicheIntervention"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateFicheInterventionBsffArgs, "id" | "input">
  >;
  updateForm?: Resolver<
    ResolversTypes["Form"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateFormArgs, "updateFormInput">
  >;
  updateTraderReceipt?: Resolver<
    Maybe<ResolversTypes["TraderReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateTraderReceiptArgs, "input">
  >;
  updateTransporterFields?: Resolver<
    Maybe<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateTransporterFieldsArgs, "id">
  >;
  updateTransporterReceipt?: Resolver<
    Maybe<ResolversTypes["TransporterReceipt"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateTransporterReceiptArgs, "input">
  >;
  updateVhuAgrement?: Resolver<
    Maybe<ResolversTypes["VhuAgrement"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateVhuAgrementArgs, "input">
  >;
  verifyCompany?: Resolver<
    ResolversTypes["CompanyPrivate"],
    ParentType,
    ContextType,
    RequireFields<MutationVerifyCompanyArgs, "input">
  >;
  verifyCompanyByAdmin?: Resolver<
    ResolversTypes["CompanyForVerification"],
    ParentType,
    ContextType,
    RequireFields<MutationVerifyCompanyByAdminArgs, "input">
  >;
};

export type NextDestinationResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["NextDestination"] = ResolversParentTypes["NextDestination"]
> = {
  processingOperation?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PackagingInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["PackagingInfo"] = ResolversParentTypes["PackagingInfo"]
> = {
  type?: Resolver<ResolversTypes["Packagings"], ParentType, ContextType>;
  other?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["PageInfo"] = ResolversParentTypes["PageInfo"]
> = {
  startCursor?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  endCursor?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  hasNextPage?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  hasPreviousPage?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  apiKey?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  appendixForms?: Resolver<
    Array<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<QueryAppendixFormsArgs, "siret">
  >;
  bsda?: Resolver<
    ResolversTypes["Bsda"],
    ParentType,
    ContextType,
    RequireFields<QueryBsdaArgs, "id">
  >;
  bsdaPdf?: Resolver<
    ResolversTypes["FileDownload"],
    ParentType,
    ContextType,
    RequireFields<QueryBsdaPdfArgs, never>
  >;
  bsdas?: Resolver<
    ResolversTypes["BsdaConnection"],
    ParentType,
    ContextType,
    RequireFields<QueryBsdasArgs, never>
  >;
  bsdasri?: Resolver<
    ResolversTypes["Bsdasri"],
    ParentType,
    ContextType,
    RequireFields<QueryBsdasriArgs, "id">
  >;
  bsdasriPdf?: Resolver<
    ResolversTypes["FileDownload"],
    ParentType,
    ContextType,
    RequireFields<QueryBsdasriPdfArgs, never>
  >;
  bsdasris?: Resolver<
    ResolversTypes["BsdasriConnection"],
    ParentType,
    ContextType,
    RequireFields<QueryBsdasrisArgs, never>
  >;
  bsds?: Resolver<
    ResolversTypes["BsdConnection"],
    ParentType,
    ContextType,
    RequireFields<QueryBsdsArgs, never>
  >;
  bsff?: Resolver<
    ResolversTypes["Bsff"],
    ParentType,
    ContextType,
    RequireFields<QueryBsffArgs, "id">
  >;
  bsffPdf?: Resolver<
    ResolversTypes["FileDownload"],
    ParentType,
    ContextType,
    RequireFields<QueryBsffPdfArgs, "id">
  >;
  bsffs?: Resolver<
    ResolversTypes["BsffConnection"],
    ParentType,
    ContextType,
    RequireFields<QueryBsffsArgs, never>
  >;
  bsvhu?: Resolver<
    ResolversTypes["Bsvhu"],
    ParentType,
    ContextType,
    RequireFields<QueryBsvhuArgs, "id">
  >;
  bsvhuPdf?: Resolver<
    ResolversTypes["FileDownload"],
    ParentType,
    ContextType,
    RequireFields<QueryBsvhuPdfArgs, never>
  >;
  bsvhus?: Resolver<
    ResolversTypes["BsvhuConnection"],
    ParentType,
    ContextType,
    RequireFields<QueryBsvhusArgs, never>
  >;
  companiesForVerification?: Resolver<
    ResolversTypes["CompanyForVerificationConnection"],
    ParentType,
    ContextType,
    RequireFields<QueryCompaniesForVerificationArgs, never>
  >;
  companyInfos?: Resolver<
    ResolversTypes["CompanyPublic"],
    ParentType,
    ContextType,
    RequireFields<QueryCompanyInfosArgs, "siret">
  >;
  ecoOrganismes?: Resolver<
    Array<ResolversTypes["EcoOrganisme"]>,
    ParentType,
    ContextType
  >;
  favorites?: Resolver<
    Array<ResolversTypes["CompanyFavorite"]>,
    ParentType,
    ContextType,
    RequireFields<QueryFavoritesArgs, "siret" | "type">
  >;
  form?: Resolver<
    ResolversTypes["Form"],
    ParentType,
    ContextType,
    RequireFields<QueryFormArgs, never>
  >;
  formPdf?: Resolver<
    ResolversTypes["FileDownload"],
    ParentType,
    ContextType,
    RequireFields<QueryFormPdfArgs, never>
  >;
  forms?: Resolver<
    Array<ResolversTypes["Form"]>,
    ParentType,
    ContextType,
    RequireFields<QueryFormsArgs, never>
  >;
  formsLifeCycle?: Resolver<
    ResolversTypes["formsLifeCycleData"],
    ParentType,
    ContextType,
    RequireFields<QueryFormsLifeCycleArgs, never>
  >;
  formsRegister?: Resolver<
    ResolversTypes["FileDownload"],
    ParentType,
    ContextType,
    RequireFields<QueryFormsRegisterArgs, "sirets">
  >;
  invitation?: Resolver<
    Maybe<ResolversTypes["Invitation"]>,
    ParentType,
    ContextType,
    RequireFields<QueryInvitationArgs, "hash">
  >;
  me?: Resolver<ResolversTypes["User"], ParentType, ContextType>;
  membershipRequest?: Resolver<
    Maybe<ResolversTypes["MembershipRequest"]>,
    ParentType,
    ContextType,
    RequireFields<QueryMembershipRequestArgs, never>
  >;
  searchCompanies?: Resolver<
    Array<ResolversTypes["CompanySearchResult"]>,
    ParentType,
    ContextType,
    RequireFields<QuerySearchCompaniesArgs, "clue">
  >;
  stats?: Resolver<
    Array<ResolversTypes["CompanyStat"]>,
    ParentType,
    ContextType
  >;
};

export type RecipientResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Recipient"] = ResolversParentTypes["Recipient"]
> = {
  cap?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  processingOperation?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  isTempStorage?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RubriqueResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Rubrique"] = ResolversParentTypes["Rubrique"]
> = {
  rubrique?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  alinea?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  etatActivite?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  regimeAutorise?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  activite?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  volume?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  unite?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  wasteType?: Resolver<
    Maybe<ResolversTypes["WasteType"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SignatureResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Signature"] = ResolversParentTypes["Signature"]
> = {
  date?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  author?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StatResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Stat"] = ResolversParentTypes["Stat"]
> = {
  wasteCode?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  incoming?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  outgoing?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StateSummaryResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["StateSummary"] = ResolversParentTypes["StateSummary"]
> = {
  quantity?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  packagings?: Resolver<
    Array<ResolversTypes["Packagings"]>,
    ParentType,
    ContextType
  >;
  packagingInfos?: Resolver<
    Array<ResolversTypes["PackagingInfo"]>,
    ParentType,
    ContextType
  >;
  onuCode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  transporter?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  transporterNumberPlate?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  transporterCustomInfo?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  recipient?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  emitter?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  lastActionOn?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StatusLogResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["StatusLog"] = ResolversParentTypes["StatusLog"]
> = {
  id?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  status?: Resolver<
    Maybe<ResolversTypes["FormStatus"]>,
    ParentType,
    ContextType
  >;
  loggedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  updatedFields?: Resolver<
    Maybe<ResolversTypes["JSON"]>,
    ParentType,
    ContextType
  >;
  form?: Resolver<
    Maybe<ResolversTypes["StatusLogForm"]>,
    ParentType,
    ContextType
  >;
  user?: Resolver<
    Maybe<ResolversTypes["StatusLogUser"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StatusLogFormResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["StatusLogForm"] = ResolversParentTypes["StatusLogForm"]
> = {
  id?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  readableId?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StatusLogUserResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["StatusLogUser"] = ResolversParentTypes["StatusLogUser"]
> = {
  id?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Subscription"] = ResolversParentTypes["Subscription"]
> = {
  forms?: SubscriptionResolver<
    Maybe<ResolversTypes["FormSubscription"]>,
    "forms",
    ParentType,
    ContextType,
    RequireFields<SubscriptionFormsArgs, "token">
  >;
};

export type TemporaryStorageDetailResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["TemporaryStorageDetail"] = ResolversParentTypes["TemporaryStorageDetail"]
> = {
  temporaryStorer?: Resolver<
    Maybe<ResolversTypes["TemporaryStorer"]>,
    ParentType,
    ContextType
  >;
  destination?: Resolver<
    Maybe<ResolversTypes["Destination"]>,
    ParentType,
    ContextType
  >;
  wasteDetails?: Resolver<
    Maybe<ResolversTypes["WasteDetails"]>,
    ParentType,
    ContextType
  >;
  transporter?: Resolver<
    Maybe<ResolversTypes["Transporter"]>,
    ParentType,
    ContextType
  >;
  signedBy?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  signedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemporaryStorerResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["TemporaryStorer"] = ResolversParentTypes["TemporaryStorer"]
> = {
  quantityType?: Resolver<
    Maybe<ResolversTypes["QuantityType"]>,
    ParentType,
    ContextType
  >;
  quantityReceived?: Resolver<
    Maybe<ResolversTypes["Float"]>,
    ParentType,
    ContextType
  >;
  wasteAcceptationStatus?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  wasteRefusalReason?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  receivedAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  receivedBy?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TraderResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Trader"] = ResolversParentTypes["Trader"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  receipt?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  department?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  validityLimit?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TraderReceiptResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["TraderReceipt"] = ResolversParentTypes["TraderReceipt"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  receiptNumber?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  validityLimit?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  department?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransporterResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["Transporter"] = ResolversParentTypes["Transporter"]
> = {
  company?: Resolver<
    Maybe<ResolversTypes["FormCompany"]>,
    ParentType,
    ContextType
  >;
  isExemptedOfReceipt?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  receipt?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  department?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  validityLimit?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  numberPlate?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  customInfo?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransporterReceiptResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["TransporterReceipt"] = ResolversParentTypes["TransporterReceipt"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  receiptNumber?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  validityLimit?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  department?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransportSegmentResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["TransportSegment"] = ResolversParentTypes["TransportSegment"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  previousTransporterCompanySiret?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  transporter?: Resolver<
    Maybe<ResolversTypes["Transporter"]>,
    ParentType,
    ContextType
  >;
  mode?: Resolver<
    Maybe<ResolversTypes["TransportMode"]>,
    ParentType,
    ContextType
  >;
  takenOverAt?: Resolver<
    Maybe<ResolversTypes["DateTime"]>,
    ParentType,
    ContextType
  >;
  takenOverBy?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  readyToTakeOver?: Resolver<
    Maybe<ResolversTypes["Boolean"]>,
    ParentType,
    ContextType
  >;
  segmentNumber?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UploadLinkResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["UploadLink"] = ResolversParentTypes["UploadLink"]
> = {
  signedUrl?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  key?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UrlScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["URL"], any> {
  name: "URL";
}

export type UserResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["User"] = ResolversParentTypes["User"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  isAdmin?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  companies?: Resolver<
    Array<ResolversTypes["CompanyPrivate"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VhuAgrementResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["VhuAgrement"] = ResolversParentTypes["VhuAgrement"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  agrementNumber?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  department?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WasteDetailsResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["WasteDetails"] = ResolversParentTypes["WasteDetails"]
> = {
  code?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  onuCode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  packagingInfos?: Resolver<
    Maybe<Array<ResolversTypes["PackagingInfo"]>>,
    ParentType,
    ContextType
  >;
  packagings?: Resolver<
    Maybe<Array<ResolversTypes["Packagings"]>>,
    ParentType,
    ContextType
  >;
  otherPackaging?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  numberOfPackages?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType
  >;
  quantity?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>;
  quantityType?: Resolver<
    Maybe<ResolversTypes["QuantityType"]>,
    ParentType,
    ContextType
  >;
  consistence?: Resolver<
    Maybe<ResolversTypes["Consistence"]>,
    ParentType,
    ContextType
  >;
  pop?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkSiteResolvers<
  ContextType = GraphQLContext,
  ParentType extends ResolversParentTypes["WorkSite"] = ResolversParentTypes["WorkSite"]
> = {
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  postalCode?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  infos?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  AdminForVerification?: AdminForVerificationResolvers<ContextType>;
  Appendix2Form?: Appendix2FormResolvers<ContextType>;
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  Broker?: BrokerResolvers<ContextType>;
  BrokerReceipt?: BrokerReceiptResolvers<ContextType>;
  Bsd?: BsdResolvers<ContextType>;
  Bsda?: BsdaResolvers<ContextType>;
  BsdaAssociation?: BsdaAssociationResolvers<ContextType>;
  BsdaConnection?: BsdaConnectionResolvers<ContextType>;
  BsdaDestination?: BsdaDestinationResolvers<ContextType>;
  BsdaEdge?: BsdaEdgeResolvers<ContextType>;
  BsdaEmission?: BsdaEmissionResolvers<ContextType>;
  BsdaEmitter?: BsdaEmitterResolvers<ContextType>;
  BsdaOperation?: BsdaOperationResolvers<ContextType>;
  BsdaPackaging?: BsdaPackagingResolvers<ContextType>;
  BsdaQuantity?: BsdaQuantityResolvers<ContextType>;
  BsdaRecepisse?: BsdaRecepisseResolvers<ContextType>;
  BsdaReception?: BsdaReceptionResolvers<ContextType>;
  Bsdasri?: BsdasriResolvers<ContextType>;
  BsdasriConnection?: BsdasriConnectionResolvers<ContextType>;
  BsdasriEdge?: BsdasriEdgeResolvers<ContextType>;
  BsdasriEmission?: BsdasriEmissionResolvers<ContextType>;
  BsdasriEmissionWasteDetails?: BsdasriEmissionWasteDetailsResolvers<
    ContextType
  >;
  BsdasriEmitter?: BsdasriEmitterResolvers<ContextType>;
  BsdasriError?: BsdasriErrorResolvers<ContextType>;
  BsdasriMetadata?: BsdasriMetadataResolvers<ContextType>;
  BsdasriOperation?: BsdasriOperationResolvers<ContextType>;
  BsdasriOperationQuantity?: BsdasriOperationQuantityResolvers<ContextType>;
  BsdasriPackagingInfo?: BsdasriPackagingInfoResolvers<ContextType>;
  BsdasriQuantity?: BsdasriQuantityResolvers<ContextType>;
  BsdasriReception?: BsdasriReceptionResolvers<ContextType>;
  BsdasriReceptionWasteDetails?: BsdasriReceptionWasteDetailsResolvers<
    ContextType
  >;
  BsdasriRecipient?: BsdasriRecipientResolvers<ContextType>;
  BsdasriSignature?: BsdasriSignatureResolvers<ContextType>;
  BsdasriTransport?: BsdasriTransportResolvers<ContextType>;
  BsdasriTransporter?: BsdasriTransporterResolvers<ContextType>;
  BsdasriTransportWasteDetails?: BsdasriTransportWasteDetailsResolvers<
    ContextType
  >;
  BsdasriWasteAcceptation?: BsdasriWasteAcceptationResolvers<ContextType>;
  BsdaTransport?: BsdaTransportResolvers<ContextType>;
  BsdaTransporter?: BsdaTransporterResolvers<ContextType>;
  BsdaWaste?: BsdaWasteResolvers<ContextType>;
  BsdaWork?: BsdaWorkResolvers<ContextType>;
  BsdaWorker?: BsdaWorkerResolvers<ContextType>;
  BsdaWorksite?: BsdaWorksiteResolvers<ContextType>;
  BsdConnection?: BsdConnectionResolvers<ContextType>;
  BsdEdge?: BsdEdgeResolvers<ContextType>;
  Bsff?: BsffResolvers<ContextType>;
  BsffConnection?: BsffConnectionResolvers<ContextType>;
  BsffDestination?: BsffDestinationResolvers<ContextType>;
  BsffDetenteur?: BsffDetenteurResolvers<ContextType>;
  BsffEdge?: BsffEdgeResolvers<ContextType>;
  BsffEmission?: BsffEmissionResolvers<ContextType>;
  BsffEmitter?: BsffEmitterResolvers<ContextType>;
  BsffFicheIntervention?: BsffFicheInterventionResolvers<ContextType>;
  BsffNextDestination?: BsffNextDestinationResolvers<ContextType>;
  BsffOperateur?: BsffOperateurResolvers<ContextType>;
  BsffOperation?: BsffOperationResolvers<ContextType>;
  BsffPackaging?: BsffPackagingResolvers<ContextType>;
  BsffPlannedOperation?: BsffPlannedOperationResolvers<ContextType>;
  BsffQuantity?: BsffQuantityResolvers<ContextType>;
  BsffReception?: BsffReceptionResolvers<ContextType>;
  BsffTransport?: BsffTransportResolvers<ContextType>;
  BsffTransporter?: BsffTransporterResolvers<ContextType>;
  BsffTransporterRecepisse?: BsffTransporterRecepisseResolvers<ContextType>;
  BsffWaste?: BsffWasteResolvers<ContextType>;
  Bsvhu?: BsvhuResolvers<ContextType>;
  BsvhuConnection?: BsvhuConnectionResolvers<ContextType>;
  BsvhuDestination?: BsvhuDestinationResolvers<ContextType>;
  BsvhuEdge?: BsvhuEdgeResolvers<ContextType>;
  BsvhuEmission?: BsvhuEmissionResolvers<ContextType>;
  BsvhuEmitter?: BsvhuEmitterResolvers<ContextType>;
  BsvhuError?: BsvhuErrorResolvers<ContextType>;
  BsvhuIdentification?: BsvhuIdentificationResolvers<ContextType>;
  BsvhuMetadata?: BsvhuMetadataResolvers<ContextType>;
  BsvhuNextDestination?: BsvhuNextDestinationResolvers<ContextType>;
  BsvhuOperation?: BsvhuOperationResolvers<ContextType>;
  BsvhuQuantity?: BsvhuQuantityResolvers<ContextType>;
  BsvhuRecepisse?: BsvhuRecepisseResolvers<ContextType>;
  BsvhuReception?: BsvhuReceptionResolvers<ContextType>;
  BsvhuTransport?: BsvhuTransportResolvers<ContextType>;
  BsvhuTransporter?: BsvhuTransporterResolvers<ContextType>;
  CompanyFavorite?: CompanyFavoriteResolvers<ContextType>;
  CompanyForVerification?: CompanyForVerificationResolvers<ContextType>;
  CompanyForVerificationConnection?: CompanyForVerificationConnectionResolvers<
    ContextType
  >;
  CompanyMember?: CompanyMemberResolvers<ContextType>;
  CompanyPrivate?: CompanyPrivateResolvers<ContextType>;
  CompanyPublic?: CompanyPublicResolvers<ContextType>;
  CompanySearchResult?: CompanySearchResultResolvers<ContextType>;
  CompanyStat?: CompanyStatResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Declaration?: DeclarationResolvers<ContextType>;
  Destination?: DestinationResolvers<ContextType>;
  EcoOrganisme?: EcoOrganismeResolvers<ContextType>;
  Emitter?: EmitterResolvers<ContextType>;
  FileDownload?: FileDownloadResolvers<ContextType>;
  Form?: FormResolvers<ContextType>;
  FormCompany?: FormCompanyResolvers<ContextType>;
  FormEcoOrganisme?: FormEcoOrganismeResolvers<ContextType>;
  formsLifeCycleData?: FormsLifeCycleDataResolvers<ContextType>;
  FormSubscription?: FormSubscriptionResolvers<ContextType>;
  Installation?: InstallationResolvers<ContextType>;
  Invitation?: InvitationResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  MembershipRequest?: MembershipRequestResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NextDestination?: NextDestinationResolvers<ContextType>;
  PackagingInfo?: PackagingInfoResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Recipient?: RecipientResolvers<ContextType>;
  Rubrique?: RubriqueResolvers<ContextType>;
  Signature?: SignatureResolvers<ContextType>;
  Stat?: StatResolvers<ContextType>;
  StateSummary?: StateSummaryResolvers<ContextType>;
  StatusLog?: StatusLogResolvers<ContextType>;
  StatusLogForm?: StatusLogFormResolvers<ContextType>;
  StatusLogUser?: StatusLogUserResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TemporaryStorageDetail?: TemporaryStorageDetailResolvers<ContextType>;
  TemporaryStorer?: TemporaryStorerResolvers<ContextType>;
  Trader?: TraderResolvers<ContextType>;
  TraderReceipt?: TraderReceiptResolvers<ContextType>;
  Transporter?: TransporterResolvers<ContextType>;
  TransporterReceipt?: TransporterReceiptResolvers<ContextType>;
  TransportSegment?: TransportSegmentResolvers<ContextType>;
  UploadLink?: UploadLinkResolvers<ContextType>;
  URL?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  VhuAgrement?: VhuAgrementResolvers<ContextType>;
  WasteDetails?: WasteDetailsResolvers<ContextType>;
  WorkSite?: WorkSiteResolvers<ContextType>;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = GraphQLContext> = Resolvers<ContextType>;

export function createAcceptedFormInputMock(
  props: Partial<AcceptedFormInput>
): AcceptedFormInput {
  return {
    wasteAcceptationStatus: "ACCEPTED",
    wasteRefusalReason: null,
    signedAt: new Date(),
    signedBy: "",
    quantityReceived: 0,
    ...props
  };
}

export function createAdminForVerificationMock(
  props: Partial<AdminForVerification>
): AdminForVerification {
  return {
    __typename: "AdminForVerification",
    email: "",
    name: null,
    phone: null,
    ...props
  };
}

export function createAppendix2FormMock(
  props: Partial<Appendix2Form>
): Appendix2Form {
  return {
    __typename: "Appendix2Form",
    id: "",
    readableId: "",
    wasteDetails: null,
    emitter: null,
    emitterPostalCode: null,
    signedAt: null,
    quantityReceived: null,
    processingOperationDone: null,
    ...props
  };
}

export function createAppendixFormInputMock(
  props: Partial<AppendixFormInput>
): AppendixFormInput {
  return {
    id: null,
    readableId: null,
    ...props
  };
}

export function createAuthPayloadMock(
  props: Partial<AuthPayload>
): AuthPayload {
  return {
    __typename: "AuthPayload",
    token: "",
    user: createUserMock({}),
    ...props
  };
}

export function createBrokerMock(props: Partial<Broker>): Broker {
  return {
    __typename: "Broker",
    company: null,
    receipt: null,
    department: null,
    validityLimit: null,
    ...props
  };
}

export function createBrokerInputMock(
  props: Partial<BrokerInput>
): BrokerInput {
  return {
    receipt: null,
    department: null,
    validityLimit: null,
    company: null,
    ...props
  };
}

export function createBrokerReceiptMock(
  props: Partial<BrokerReceipt>
): BrokerReceipt {
  return {
    __typename: "BrokerReceipt",
    id: "",
    receiptNumber: "",
    validityLimit: new Date(),
    department: "",
    ...props
  };
}

export function createBsdaMock(props: Partial<Bsda>): Bsda {
  return {
    __typename: "Bsda",
    id: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    isDraft: false,
    status: "INITIAL",
    type: null,
    emitter: null,
    waste: null,
    packagings: null,
    quantity: null,
    destination: null,
    worker: null,
    transporter: null,
    associations: null,
    ...props
  };
}

export function createBsdaAssociationMock(
  props: Partial<BsdaAssociation>
): BsdaAssociation {
  return {
    __typename: "BsdaAssociation",
    id: "",
    status: "INITIAL",
    ...props
  };
}

export function createBsdaCompanyWhereMock(
  props: Partial<BsdaCompanyWhere>
): BsdaCompanyWhere {
  return {
    siret: "",
    ...props
  };
}

export function createBsdaConnectionMock(
  props: Partial<BsdaConnection>
): BsdaConnection {
  return {
    __typename: "BsdaConnection",
    totalCount: 0,
    pageInfo: createPageInfoMock({}),
    edges: [],
    ...props
  };
}

export function createBsdaDestinationMock(
  props: Partial<BsdaDestination>
): BsdaDestination {
  return {
    __typename: "BsdaDestination",
    company: null,
    cap: null,
    plannedOperationCode: null,
    reception: null,
    operation: null,
    ...props
  };
}

export function createBsdaDestinationInputMock(
  props: Partial<BsdaDestinationInput>
): BsdaDestinationInput {
  return {
    company: null,
    cap: null,
    plannedOperationCode: null,
    reception: null,
    operation: null,
    ...props
  };
}

export function createBsdaDestinationWhereMock(
  props: Partial<BsdaDestinationWhere>
): BsdaDestinationWhere {
  return {
    company: null,
    operation: null,
    ...props
  };
}

export function createBsdaEdgeMock(props: Partial<BsdaEdge>): BsdaEdge {
  return {
    __typename: "BsdaEdge",
    cursor: "",
    node: createBsdaMock({}),
    ...props
  };
}

export function createBsdaEmissionMock(
  props: Partial<BsdaEmission>
): BsdaEmission {
  return {
    __typename: "BsdaEmission",
    signature: null,
    ...props
  };
}

export function createBsdaEmissionWhereMock(
  props: Partial<BsdaEmissionWhere>
): BsdaEmissionWhere {
  return {
    signature: null,
    ...props
  };
}

export function createBsdaEmitterMock(
  props: Partial<BsdaEmitter>
): BsdaEmitter {
  return {
    __typename: "BsdaEmitter",
    isPrivateIndividual: null,
    company: null,
    worksite: null,
    emission: null,
    ...props
  };
}

export function createBsdaEmitterInputMock(
  props: Partial<BsdaEmitterInput>
): BsdaEmitterInput {
  return {
    isPrivateIndividual: null,
    company: null,
    worksite: null,
    ...props
  };
}

export function createBsdaEmitterWhereMock(
  props: Partial<BsdaEmitterWhere>
): BsdaEmitterWhere {
  return {
    company: null,
    emission: null,
    ...props
  };
}

export function createBsdaInputMock(props: Partial<BsdaInput>): BsdaInput {
  return {
    type: null,
    emitter: null,
    waste: null,
    packagings: null,
    quantity: null,
    destination: null,
    worker: null,
    transporter: null,
    associations: null,
    ...props
  };
}

export function createBsdaOperationMock(
  props: Partial<BsdaOperation>
): BsdaOperation {
  return {
    __typename: "BsdaOperation",
    code: null,
    date: null,
    signature: null,
    ...props
  };
}

export function createBsdaOperationInputMock(
  props: Partial<BsdaOperationInput>
): BsdaOperationInput {
  return {
    code: null,
    date: null,
    ...props
  };
}

export function createBsdaOperationWhereMock(
  props: Partial<BsdaOperationWhere>
): BsdaOperationWhere {
  return {
    signature: null,
    ...props
  };
}

export function createBsdaPackagingMock(
  props: Partial<BsdaPackaging>
): BsdaPackaging {
  return {
    __typename: "BsdaPackaging",
    type: "PALETTE_FILME",
    other: null,
    quantity: 0,
    ...props
  };
}

export function createBsdaPackagingInputMock(
  props: Partial<BsdaPackagingInput>
): BsdaPackagingInput {
  return {
    type: null,
    other: null,
    quantity: 0,
    ...props
  };
}

export function createBsdaQuantityMock(
  props: Partial<BsdaQuantity>
): BsdaQuantity {
  return {
    __typename: "BsdaQuantity",
    type: null,
    value: null,
    ...props
  };
}

export function createBsdaQuantityInputMock(
  props: Partial<BsdaQuantityInput>
): BsdaQuantityInput {
  return {
    type: null,
    value: null,
    ...props
  };
}

export function createBsdaRecepisseMock(
  props: Partial<BsdaRecepisse>
): BsdaRecepisse {
  return {
    __typename: "BsdaRecepisse",
    number: null,
    department: null,
    validityLimit: null,
    ...props
  };
}

export function createBsdaRecepisseInputMock(
  props: Partial<BsdaRecepisseInput>
): BsdaRecepisseInput {
  return {
    number: null,
    department: null,
    validityLimit: null,
    ...props
  };
}

export function createBsdaReceptionMock(
  props: Partial<BsdaReception>
): BsdaReception {
  return {
    __typename: "BsdaReception",
    date: null,
    quantity: null,
    acceptationStatus: null,
    refusalReason: null,
    signature: null,
    ...props
  };
}

export function createBsdaReceptionInputMock(
  props: Partial<BsdaReceptionInput>
): BsdaReceptionInput {
  return {
    date: null,
    quantity: null,
    acceptationStatus: null,
    refusalReason: null,
    ...props
  };
}

export function createBsdaSignatureInputMock(
  props: Partial<BsdaSignatureInput>
): BsdaSignatureInput {
  return {
    type: "EMISSION",
    date: null,
    author: "",
    securityCode: null,
    ...props
  };
}

export function createBsdaSignatureWhereMock(
  props: Partial<BsdaSignatureWhere>
): BsdaSignatureWhere {
  return {
    date: createDateFilterMock({}),
    ...props
  };
}

export function createBsdasriMock(props: Partial<Bsdasri>): Bsdasri {
  return {
    __typename: "Bsdasri",
    id: "",
    status: "INITIAL",
    bsdasriType: "SIMPLE",
    createdAt: null,
    updatedAt: null,
    isDraft: false,
    emitter: null,
    emission: null,
    transporter: null,
    transport: null,
    recipient: null,
    reception: null,
    operation: null,
    regroupedBsdasris: null,
    metadata: createBsdasriMetadataMock({}),
    ...props
  };
}

export function createBsdasriCompanyWhereMock(
  props: Partial<BsdasriCompanyWhere>
): BsdasriCompanyWhere {
  return {
    siret: "",
    ...props
  };
}

export function createBsdasriConnectionMock(
  props: Partial<BsdasriConnection>
): BsdasriConnection {
  return {
    __typename: "BsdasriConnection",
    totalCount: 0,
    pageInfo: createPageInfoMock({}),
    edges: [],
    ...props
  };
}

export function createBsdasriCreateInputMock(
  props: Partial<BsdasriCreateInput>
): BsdasriCreateInput {
  return {
    emitter: null,
    emission: null,
    transporter: null,
    transport: null,
    recipient: null,
    reception: null,
    operation: null,
    regroupedBsdasris: null,
    ...props
  };
}

export function createBsdasriEdgeMock(
  props: Partial<BsdasriEdge>
): BsdasriEdge {
  return {
    __typename: "BsdasriEdge",
    cursor: "",
    node: createBsdasriMock({}),
    ...props
  };
}

export function createBsdasriEmissionMock(
  props: Partial<BsdasriEmission>
): BsdasriEmission {
  return {
    __typename: "BsdasriEmission",
    wasteCode: null,
    wasteDetails: null,
    handedOverAt: null,
    signature: null,
    isTakenOverWithoutEmitterSignature: null,
    isTakenOverWithSecretCode: null,
    ...props
  };
}

export function createBsdasriEmissionInputMock(
  props: Partial<BsdasriEmissionInput>
): BsdasriEmissionInput {
  return {
    wasteCode: null,
    wasteDetails: null,
    handedOverAt: null,
    ...props
  };
}

export function createBsdasriEmissionWasteDetailsMock(
  props: Partial<BsdasriEmissionWasteDetails>
): BsdasriEmissionWasteDetails {
  return {
    __typename: "BsdasriEmissionWasteDetails",
    quantity: null,
    volume: null,
    packagingInfos: null,
    onuCode: null,
    ...props
  };
}

export function createBsdasriEmitterMock(
  props: Partial<BsdasriEmitter>
): BsdasriEmitter {
  return {
    __typename: "BsdasriEmitter",
    company: null,
    workSite: null,
    handOverToTransporterAt: null,
    customInfo: null,
    type: null,
    onBehalfOfEcoorganisme: false,
    ...props
  };
}

export function createBsdasriEmitterInputMock(
  props: Partial<BsdasriEmitterInput>
): BsdasriEmitterInput {
  return {
    type: null,
    company: null,
    workSite: null,
    customInfo: null,
    onBehalfOfEcoorganisme: null,
    ...props
  };
}

export function createBsdasriEmitterWhereMock(
  props: Partial<BsdasriEmitterWhere>
): BsdasriEmitterWhere {
  return {
    company: null,
    signature: null,
    ...props
  };
}

export function createBsdasriErrorMock(
  props: Partial<BsdasriError>
): BsdasriError {
  return {
    __typename: "BsdasriError",
    message: "",
    path: "",
    requiredFor: [],
    ...props
  };
}

export function createBsdasriInputMock(
  props: Partial<BsdasriInput>
): BsdasriInput {
  return {
    emitter: null,
    emission: null,
    transporter: null,
    transport: null,
    recipient: null,
    reception: null,
    operation: null,
    ...props
  };
}

export function createBsdasriMetadataMock(
  props: Partial<BsdasriMetadata>
): BsdasriMetadata {
  return {
    __typename: "BsdasriMetadata",
    errors: [],
    ...props
  };
}

export function createBsdasriOperationMock(
  props: Partial<BsdasriOperation>
): BsdasriOperation {
  return {
    __typename: "BsdasriOperation",
    quantity: null,
    processingOperation: null,
    processedAt: null,
    signature: null,
    ...props
  };
}

export function createBsdasriOperationInputMock(
  props: Partial<BsdasriOperationInput>
): BsdasriOperationInput {
  return {
    quantity: null,
    processingOperation: null,
    processedAt: null,
    ...props
  };
}

export function createBsdasriOperationQuantityMock(
  props: Partial<BsdasriOperationQuantity>
): BsdasriOperationQuantity {
  return {
    __typename: "BsdasriOperationQuantity",
    value: null,
    ...props
  };
}

export function createBsdasriPackagingInfoMock(
  props: Partial<BsdasriPackagingInfo>
): BsdasriPackagingInfo {
  return {
    __typename: "BsdasriPackagingInfo",
    type: "BOITE_CARTON",
    other: null,
    quantity: 0,
    volume: 0,
    ...props
  };
}

export function createBsdasriPackagingInfoInputMock(
  props: Partial<BsdasriPackagingInfoInput>
): BsdasriPackagingInfoInput {
  return {
    type: "BOITE_CARTON",
    other: null,
    volume: 0,
    quantity: 0,
    ...props
  };
}

export function createBsdasriQuantityMock(
  props: Partial<BsdasriQuantity>
): BsdasriQuantity {
  return {
    __typename: "BsdasriQuantity",
    value: null,
    type: null,
    ...props
  };
}

export function createBsdasriQuantityInputMock(
  props: Partial<BsdasriQuantityInput>
): BsdasriQuantityInput {
  return {
    value: null,
    type: null,
    ...props
  };
}

export function createBsdasriReceptionMock(
  props: Partial<BsdasriReception>
): BsdasriReception {
  return {
    __typename: "BsdasriReception",
    wasteDetails: null,
    wasteAcceptation: null,
    receivedAt: null,
    signature: null,
    ...props
  };
}

export function createBsdasriReceptionInputMock(
  props: Partial<BsdasriReceptionInput>
): BsdasriReceptionInput {
  return {
    wasteDetails: null,
    receivedAt: null,
    wasteAcceptation: null,
    ...props
  };
}

export function createBsdasriReceptionWasteDetailsMock(
  props: Partial<BsdasriReceptionWasteDetails>
): BsdasriReceptionWasteDetails {
  return {
    __typename: "BsdasriReceptionWasteDetails",
    volume: null,
    packagingInfos: null,
    ...props
  };
}

export function createBsdasriRecipientMock(
  props: Partial<BsdasriRecipient>
): BsdasriRecipient {
  return {
    __typename: "BsdasriRecipient",
    company: null,
    customInfo: null,
    ...props
  };
}

export function createBsdasriRecipientInputMock(
  props: Partial<BsdasriRecipientInput>
): BsdasriRecipientInput {
  return {
    company: null,
    customInfo: null,
    ...props
  };
}

export function createBsdasriRecipientWasteDetailInputMock(
  props: Partial<BsdasriRecipientWasteDetailInput>
): BsdasriRecipientWasteDetailInput {
  return {
    volume: null,
    packagingInfos: null,
    ...props
  };
}

export function createBsdasriRecipientWhereMock(
  props: Partial<BsdasriRecipientWhere>
): BsdasriRecipientWhere {
  return {
    company: null,
    signature: null,
    ...props
  };
}

export function createBsdasriSignatureMock(
  props: Partial<BsdasriSignature>
): BsdasriSignature {
  return {
    __typename: "BsdasriSignature",
    date: null,
    author: null,
    ...props
  };
}

export function createBsdasriSignatureInputMock(
  props: Partial<BsdasriSignatureInput>
): BsdasriSignatureInput {
  return {
    type: "EMISSION",
    author: "",
    ...props
  };
}

export function createBsdasriSignatureWhereMock(
  props: Partial<BsdasriSignatureWhere>
): BsdasriSignatureWhere {
  return {
    date: createDateFilterMock({}),
    ...props
  };
}

export function createBsdasriSignatureWithSecretCodeInputMock(
  props: Partial<BsdasriSignatureWithSecretCodeInput>
): BsdasriSignatureWithSecretCodeInput {
  return {
    author: "",
    securityCode: null,
    ...props
  };
}

export function createBsdasriTransportMock(
  props: Partial<BsdasriTransport>
): BsdasriTransport {
  return {
    __typename: "BsdasriTransport",
    wasteDetails: null,
    wasteAcceptation: null,
    handedOverAt: null,
    takenOverAt: null,
    signature: null,
    mode: "ROAD",
    ...props
  };
}

export function createBsdasriTransporterMock(
  props: Partial<BsdasriTransporter>
): BsdasriTransporter {
  return {
    __typename: "BsdasriTransporter",
    company: null,
    receipt: null,
    receiptDepartment: null,
    receiptValidityLimit: null,
    customInfo: null,
    ...props
  };
}

export function createBsdasriTransporterInputMock(
  props: Partial<BsdasriTransporterInput>
): BsdasriTransporterInput {
  return {
    company: null,
    receipt: null,
    receiptDepartment: null,
    receiptValidityLimit: null,
    customInfo: null,
    ...props
  };
}

export function createBsdasriTransporterWhereMock(
  props: Partial<BsdasriTransporterWhere>
): BsdasriTransporterWhere {
  return {
    company: null,
    signature: null,
    ...props
  };
}

export function createBsdasriTransportInputMock(
  props: Partial<BsdasriTransportInput>
): BsdasriTransportInput {
  return {
    wasteDetails: null,
    takenOverAt: null,
    handedOverAt: null,
    wasteAcceptation: null,
    mode: null,
    ...props
  };
}

export function createBsdasriTransportWasteDetailsMock(
  props: Partial<BsdasriTransportWasteDetails>
): BsdasriTransportWasteDetails {
  return {
    __typename: "BsdasriTransportWasteDetails",
    quantity: null,
    volume: null,
    packagingInfos: null,
    ...props
  };
}

export function createBsdasriUpdateInputMock(
  props: Partial<BsdasriUpdateInput>
): BsdasriUpdateInput {
  return {
    emitter: null,
    emission: null,
    transporter: null,
    transport: null,
    recipient: null,
    reception: null,
    operation: null,
    regroupedBsdasris: null,
    ...props
  };
}

export function createBsdasriWasteAcceptationMock(
  props: Partial<BsdasriWasteAcceptation>
): BsdasriWasteAcceptation {
  return {
    __typename: "BsdasriWasteAcceptation",
    status: null,
    refusalReason: null,
    refusedQuantity: null,
    ...props
  };
}

export function createBsdasriWasteAcceptationInputMock(
  props: Partial<BsdasriWasteAcceptationInput>
): BsdasriWasteAcceptationInput {
  return {
    status: null,
    refusalReason: null,
    refusedQuantity: null,
    ...props
  };
}

export function createBsdasriWasteDetailEmissionInputMock(
  props: Partial<BsdasriWasteDetailEmissionInput>
): BsdasriWasteDetailEmissionInput {
  return {
    quantity: null,
    packagingInfos: null,
    onuCode: null,
    ...props
  };
}

export function createBsdasriWasteDetailTransportInputMock(
  props: Partial<BsdasriWasteDetailTransportInput>
): BsdasriWasteDetailTransportInput {
  return {
    quantity: null,
    packagingInfos: null,
    ...props
  };
}

export function createBsdasriWhereMock(
  props: Partial<BsdasriWhere>
): BsdasriWhere {
  return {
    isDraft: null,
    status: null,
    id_in: null,
    createdAt: null,
    updatedAt: null,
    emitter: null,
    transporter: null,
    recipient: null,
    processingOperation: null,
    groupable: null,
    _and: null,
    _or: null,
    _not: null,
    ...props
  };
}

export function createBsdaTransportMock(
  props: Partial<BsdaTransport>
): BsdaTransport {
  return {
    __typename: "BsdaTransport",
    signature: null,
    ...props
  };
}

export function createBsdaTransporterMock(
  props: Partial<BsdaTransporter>
): BsdaTransporter {
  return {
    __typename: "BsdaTransporter",
    company: null,
    recepisse: null,
    transport: null,
    ...props
  };
}

export function createBsdaTransporterInputMock(
  props: Partial<BsdaTransporterInput>
): BsdaTransporterInput {
  return {
    company: null,
    recepisse: null,
    ...props
  };
}

export function createBsdaTransporterWhereMock(
  props: Partial<BsdaTransporterWhere>
): BsdaTransporterWhere {
  return {
    company: null,
    transport: null,
    ...props
  };
}

export function createBsdaTransportWhereMock(
  props: Partial<BsdaTransportWhere>
): BsdaTransportWhere {
  return {
    signature: null,
    ...props
  };
}

export function createBsdaWasteMock(props: Partial<BsdaWaste>): BsdaWaste {
  return {
    __typename: "BsdaWaste",
    code: null,
    name: null,
    familyCode: null,
    materialName: null,
    consistence: null,
    sealNumbers: null,
    adr: null,
    ...props
  };
}

export function createBsdaWasteInputMock(
  props: Partial<BsdaWasteInput>
): BsdaWasteInput {
  return {
    code: null,
    name: null,
    familyCode: null,
    materialName: null,
    consistence: null,
    sealNumbers: null,
    adr: null,
    ...props
  };
}

export function createBsdaWhereMock(props: Partial<BsdaWhere>): BsdaWhere {
  return {
    isDraft: null,
    status: null,
    createdAt: null,
    updatedAt: null,
    emitter: null,
    worker: null,
    transporter: null,
    destination: null,
    _and: null,
    _or: null,
    _not: null,
    ...props
  };
}

export function createBsdaWorkMock(props: Partial<BsdaWork>): BsdaWork {
  return {
    __typename: "BsdaWork",
    hasEmitterPaperSignature: null,
    signature: null,
    ...props
  };
}

export function createBsdaWorkerMock(props: Partial<BsdaWorker>): BsdaWorker {
  return {
    __typename: "BsdaWorker",
    company: null,
    work: null,
    ...props
  };
}

export function createBsdaWorkerInputMock(
  props: Partial<BsdaWorkerInput>
): BsdaWorkerInput {
  return {
    company: null,
    work: null,
    ...props
  };
}

export function createBsdaWorkerWhereMock(
  props: Partial<BsdaWorkerWhere>
): BsdaWorkerWhere {
  return {
    company: null,
    work: null,
    ...props
  };
}

export function createBsdaWorkInputMock(
  props: Partial<BsdaWorkInput>
): BsdaWorkInput {
  return {
    hasEmitterPaperSignature: null,
    ...props
  };
}

export function createBsdaWorksiteMock(
  props: Partial<BsdaWorksite>
): BsdaWorksite {
  return {
    __typename: "BsdaWorksite",
    name: null,
    address: null,
    city: null,
    postalCode: null,
    infos: null,
    ...props
  };
}

export function createBsdaWorksiteInputMock(
  props: Partial<BsdaWorksiteInput>
): BsdaWorksiteInput {
  return {
    name: null,
    address: null,
    city: null,
    postalCode: null,
    infos: null,
    ...props
  };
}

export function createBsdaWorkWhereMock(
  props: Partial<BsdaWorkWhere>
): BsdaWorkWhere {
  return {
    signature: null,
    ...props
  };
}

export function createBsdConnectionMock(
  props: Partial<BsdConnection>
): BsdConnection {
  return {
    __typename: "BsdConnection",
    totalCount: 0,
    pageInfo: createPageInfoMock({}),
    edges: [],
    ...props
  };
}

export function createBsdEdgeMock(props: Partial<BsdEdge>): BsdEdge {
  return {
    __typename: "BsdEdge",
    cursor: "",
    node: createFormMock({}),
    ...props
  };
}

export function createBsdWhereMock(props: Partial<BsdWhere>): BsdWhere {
  return {
    readableId: null,
    emitter: null,
    recipient: null,
    waste: null,
    types: null,
    isDraftFor: null,
    isForActionFor: null,
    isFollowFor: null,
    isArchivedFor: null,
    isToCollectFor: null,
    isCollectedFor: null,
    ...props
  };
}

export function createBsffMock(props: Partial<Bsff>): Bsff {
  return {
    __typename: "Bsff",
    id: "",
    status: "INITIAL",
    emitter: null,
    packagings: [],
    waste: null,
    quantity: null,
    transporter: null,
    destination: null,
    ficheInterventions: [],
    bsffs: [],
    ...props
  };
}

export function createBsffConnectionMock(
  props: Partial<BsffConnection>
): BsffConnection {
  return {
    __typename: "BsffConnection",
    totalCount: 0,
    pageInfo: createPageInfoMock({}),
    edges: [],
    ...props
  };
}

export function createBsffDestinationMock(
  props: Partial<BsffDestination>
): BsffDestination {
  return {
    __typename: "BsffDestination",
    company: null,
    reception: null,
    operation: null,
    plannedOperation: null,
    cap: null,
    ...props
  };
}

export function createBsffDestinationInputMock(
  props: Partial<BsffDestinationInput>
): BsffDestinationInput {
  return {
    company: null,
    cap: null,
    reception: null,
    plannedOperation: null,
    operation: null,
    ...props
  };
}

export function createBsffDestinationOperationInputMock(
  props: Partial<BsffDestinationOperationInput>
): BsffDestinationOperationInput {
  return {
    code: "R2",
    nextDestination: null,
    ...props
  };
}

export function createBsffDestinationPlannedOperationInputMock(
  props: Partial<BsffDestinationPlannedOperationInput>
): BsffDestinationPlannedOperationInput {
  return {
    code: "R2",
    ...props
  };
}

export function createBsffDestinationReceptionInputMock(
  props: Partial<BsffDestinationReceptionInput>
): BsffDestinationReceptionInput {
  return {
    date: new Date(),
    kilos: 0,
    refusal: null,
    ...props
  };
}

export function createBsffDetenteurMock(
  props: Partial<BsffDetenteur>
): BsffDetenteur {
  return {
    __typename: "BsffDetenteur",
    company: createFormCompanyMock({}),
    ...props
  };
}

export function createBsffDetenteurInputMock(
  props: Partial<BsffDetenteurInput>
): BsffDetenteurInput {
  return {
    company: createCompanyInputMock({}),
    ...props
  };
}

export function createBsffEdgeMock(props: Partial<BsffEdge>): BsffEdge {
  return {
    __typename: "BsffEdge",
    cursor: "",
    node: createBsffMock({}),
    ...props
  };
}

export function createBsffEmissionMock(
  props: Partial<BsffEmission>
): BsffEmission {
  return {
    __typename: "BsffEmission",
    signature: null,
    ...props
  };
}

export function createBsffEmitterMock(
  props: Partial<BsffEmitter>
): BsffEmitter {
  return {
    __typename: "BsffEmitter",
    company: null,
    emission: null,
    ...props
  };
}

export function createBsffEmitterInputMock(
  props: Partial<BsffEmitterInput>
): BsffEmitterInput {
  return {
    company: null,
    ...props
  };
}

export function createBsffFicheInterventionMock(
  props: Partial<BsffFicheIntervention>
): BsffFicheIntervention {
  return {
    __typename: "BsffFicheIntervention",
    id: "",
    numero: "",
    kilos: 0,
    detenteur: null,
    operateur: null,
    postalCode: "",
    ...props
  };
}

export function createBsffFicheInterventionInputMock(
  props: Partial<BsffFicheInterventionInput>
): BsffFicheInterventionInput {
  return {
    numero: "",
    kilos: 0,
    detenteur: createBsffDetenteurInputMock({}),
    operateur: createBsffOperateurInputMock({}),
    postalCode: "",
    ...props
  };
}

export function createBsffInputMock(props: Partial<BsffInput>): BsffInput {
  return {
    emitter: null,
    packagings: null,
    waste: null,
    quantity: null,
    transporter: null,
    destination: null,
    bsffs: null,
    ...props
  };
}

export function createBsffNextDestinationMock(
  props: Partial<BsffNextDestination>
): BsffNextDestination {
  return {
    __typename: "BsffNextDestination",
    company: createFormCompanyMock({}),
    ...props
  };
}

export function createBsffOperateurMock(
  props: Partial<BsffOperateur>
): BsffOperateur {
  return {
    __typename: "BsffOperateur",
    company: createFormCompanyMock({}),
    ...props
  };
}

export function createBsffOperateurInputMock(
  props: Partial<BsffOperateurInput>
): BsffOperateurInput {
  return {
    company: createCompanyInputMock({}),
    ...props
  };
}

export function createBsffOperationMock(
  props: Partial<BsffOperation>
): BsffOperation {
  return {
    __typename: "BsffOperation",
    code: null,
    nextDestination: null,
    signature: null,
    ...props
  };
}

export function createBsffOperationNextDestinationInputMock(
  props: Partial<BsffOperationNextDestinationInput>
): BsffOperationNextDestinationInput {
  return {
    company: createCompanyInputMock({}),
    ...props
  };
}

export function createBsffPackagingMock(
  props: Partial<BsffPackaging>
): BsffPackaging {
  return {
    __typename: "BsffPackaging",
    name: "",
    numero: "",
    kilos: 0,
    ...props
  };
}

export function createBsffPackagingInputMock(
  props: Partial<BsffPackagingInput>
): BsffPackagingInput {
  return {
    name: "",
    numero: "",
    kilos: 0,
    ...props
  };
}

export function createBsffPlannedOperationMock(
  props: Partial<BsffPlannedOperation>
): BsffPlannedOperation {
  return {
    __typename: "BsffPlannedOperation",
    code: null,
    ...props
  };
}

export function createBsffQuantityMock(
  props: Partial<BsffQuantity>
): BsffQuantity {
  return {
    __typename: "BsffQuantity",
    kilos: 0,
    isEstimate: false,
    ...props
  };
}

export function createBsffQuantityInputMock(
  props: Partial<BsffQuantityInput>
): BsffQuantityInput {
  return {
    kilos: 0,
    isEstimate: false,
    ...props
  };
}

export function createBsffReceptionMock(
  props: Partial<BsffReception>
): BsffReception {
  return {
    __typename: "BsffReception",
    date: new Date(),
    kilos: 0,
    refusal: null,
    signature: null,
    ...props
  };
}

export function createBsffTransportMock(
  props: Partial<BsffTransport>
): BsffTransport {
  return {
    __typename: "BsffTransport",
    mode: "ROAD",
    signature: null,
    ...props
  };
}

export function createBsffTransporterMock(
  props: Partial<BsffTransporter>
): BsffTransporter {
  return {
    __typename: "BsffTransporter",
    company: null,
    recepisse: null,
    transport: null,
    ...props
  };
}

export function createBsffTransporterInputMock(
  props: Partial<BsffTransporterInput>
): BsffTransporterInput {
  return {
    company: null,
    recepisse: null,
    transport: null,
    ...props
  };
}

export function createBsffTransporterRecepisseMock(
  props: Partial<BsffTransporterRecepisse>
): BsffTransporterRecepisse {
  return {
    __typename: "BsffTransporterRecepisse",
    number: "",
    department: "",
    validityLimit: new Date(),
    ...props
  };
}

export function createBsffTransporterRecepisseInputMock(
  props: Partial<BsffTransporterRecepisseInput>
): BsffTransporterRecepisseInput {
  return {
    number: "",
    department: "",
    validityLimit: new Date(),
    ...props
  };
}

export function createBsffTransporterTransportInputMock(
  props: Partial<BsffTransporterTransportInput>
): BsffTransporterTransportInput {
  return {
    mode: "ROAD",
    ...props
  };
}

export function createBsffWasteMock(props: Partial<BsffWaste>): BsffWaste {
  return {
    __typename: "BsffWaste",
    code: "",
    nature: null,
    adr: "",
    ...props
  };
}

export function createBsffWasteInputMock(
  props: Partial<BsffWasteInput>
): BsffWasteInput {
  return {
    code: "",
    nature: null,
    adr: "",
    ...props
  };
}

export function createBsffWhereMock(props: Partial<BsffWhere>): BsffWhere {
  return {
    emitter: null,
    transporter: null,
    destination: null,
    ...props
  };
}

export function createBsffWhereCompanyMock(
  props: Partial<BsffWhereCompany>
): BsffWhereCompany {
  return {
    siret: "",
    ...props
  };
}

export function createBsffWhereDestinationMock(
  props: Partial<BsffWhereDestination>
): BsffWhereDestination {
  return {
    company: null,
    operation: null,
    ...props
  };
}

export function createBsffWhereEmitterMock(
  props: Partial<BsffWhereEmitter>
): BsffWhereEmitter {
  return {
    company: null,
    ...props
  };
}

export function createBsffWhereOperationMock(
  props: Partial<BsffWhereOperation>
): BsffWhereOperation {
  return {
    code: null,
    ...props
  };
}

export function createBsffWhereTransporterMock(
  props: Partial<BsffWhereTransporter>
): BsffWhereTransporter {
  return {
    company: null,
    ...props
  };
}

export function createBsvhuMock(props: Partial<Bsvhu>): Bsvhu {
  return {
    __typename: "Bsvhu",
    id: "",
    createdAt: null,
    updatedAt: null,
    isDraft: false,
    status: "INITIAL",
    emitter: null,
    wasteCode: null,
    packaging: null,
    identification: null,
    quantity: null,
    destination: null,
    transporter: null,
    metadata: createBsvhuMetadataMock({}),
    ...props
  };
}

export function createBsvhuCompanyWhereMock(
  props: Partial<BsvhuCompanyWhere>
): BsvhuCompanyWhere {
  return {
    siret: "",
    ...props
  };
}

export function createBsvhuConnectionMock(
  props: Partial<BsvhuConnection>
): BsvhuConnection {
  return {
    __typename: "BsvhuConnection",
    totalCount: 0,
    pageInfo: createPageInfoMock({}),
    edges: [],
    ...props
  };
}

export function createBsvhuDestinationMock(
  props: Partial<BsvhuDestination>
): BsvhuDestination {
  return {
    __typename: "BsvhuDestination",
    type: null,
    agrementNumber: null,
    company: null,
    plannedOperationCode: null,
    reception: null,
    operation: null,
    ...props
  };
}

export function createBsvhuDestinationInputMock(
  props: Partial<BsvhuDestinationInput>
): BsvhuDestinationInput {
  return {
    type: null,
    agrementNumber: null,
    company: null,
    plannedOperationCode: null,
    reception: null,
    operation: null,
    ...props
  };
}

export function createBsvhuDestinationWhereMock(
  props: Partial<BsvhuDestinationWhere>
): BsvhuDestinationWhere {
  return {
    company: null,
    operation: null,
    ...props
  };
}

export function createBsvhuEdgeMock(props: Partial<BsvhuEdge>): BsvhuEdge {
  return {
    __typename: "BsvhuEdge",
    cursor: "",
    node: createBsvhuMock({}),
    ...props
  };
}

export function createBsvhuEmissionMock(
  props: Partial<BsvhuEmission>
): BsvhuEmission {
  return {
    __typename: "BsvhuEmission",
    signature: null,
    ...props
  };
}

export function createBsvhuEmissionWhereMock(
  props: Partial<BsvhuEmissionWhere>
): BsvhuEmissionWhere {
  return {
    signature: null,
    ...props
  };
}

export function createBsvhuEmitterMock(
  props: Partial<BsvhuEmitter>
): BsvhuEmitter {
  return {
    __typename: "BsvhuEmitter",
    agrementNumber: null,
    company: null,
    emission: null,
    ...props
  };
}

export function createBsvhuEmitterInputMock(
  props: Partial<BsvhuEmitterInput>
): BsvhuEmitterInput {
  return {
    agrementNumber: null,
    company: null,
    ...props
  };
}

export function createBsvhuEmitterWhereMock(
  props: Partial<BsvhuEmitterWhere>
): BsvhuEmitterWhere {
  return {
    company: null,
    emission: null,
    ...props
  };
}

export function createBsvhuErrorMock(props: Partial<BsvhuError>): BsvhuError {
  return {
    __typename: "BsvhuError",
    message: "",
    path: "",
    requiredFor: "EMISSION",
    ...props
  };
}

export function createBsvhuIdentificationMock(
  props: Partial<BsvhuIdentification>
): BsvhuIdentification {
  return {
    __typename: "BsvhuIdentification",
    numbers: null,
    type: null,
    ...props
  };
}

export function createBsvhuIdentificationInputMock(
  props: Partial<BsvhuIdentificationInput>
): BsvhuIdentificationInput {
  return {
    numbers: null,
    type: null,
    ...props
  };
}

export function createBsvhuInputMock(props: Partial<BsvhuInput>): BsvhuInput {
  return {
    emitter: null,
    wasteCode: null,
    packaging: null,
    identification: null,
    quantity: null,
    destination: null,
    transporter: null,
    ...props
  };
}

export function createBsvhuMetadataMock(
  props: Partial<BsvhuMetadata>
): BsvhuMetadata {
  return {
    __typename: "BsvhuMetadata",
    errors: [],
    ...props
  };
}

export function createBsvhuNextDestinationMock(
  props: Partial<BsvhuNextDestination>
): BsvhuNextDestination {
  return {
    __typename: "BsvhuNextDestination",
    company: null,
    ...props
  };
}

export function createBsvhuNextDestinationInputMock(
  props: Partial<BsvhuNextDestinationInput>
): BsvhuNextDestinationInput {
  return {
    company: null,
    ...props
  };
}

export function createBsvhuOperationMock(
  props: Partial<BsvhuOperation>
): BsvhuOperation {
  return {
    __typename: "BsvhuOperation",
    date: null,
    code: null,
    nextDestination: null,
    signature: null,
    ...props
  };
}

export function createBsvhuOperationInputMock(
  props: Partial<BsvhuOperationInput>
): BsvhuOperationInput {
  return {
    date: null,
    code: null,
    nextDestination: null,
    ...props
  };
}

export function createBsvhuOperationWhereMock(
  props: Partial<BsvhuOperationWhere>
): BsvhuOperationWhere {
  return {
    signature: null,
    ...props
  };
}

export function createBsvhuQuantityMock(
  props: Partial<BsvhuQuantity>
): BsvhuQuantity {
  return {
    __typename: "BsvhuQuantity",
    number: null,
    tons: null,
    ...props
  };
}

export function createBsvhuQuantityInputMock(
  props: Partial<BsvhuQuantityInput>
): BsvhuQuantityInput {
  return {
    number: null,
    tons: null,
    ...props
  };
}

export function createBsvhuRecepisseMock(
  props: Partial<BsvhuRecepisse>
): BsvhuRecepisse {
  return {
    __typename: "BsvhuRecepisse",
    number: null,
    department: null,
    validityLimit: null,
    ...props
  };
}

export function createBsvhuRecepisseInputMock(
  props: Partial<BsvhuRecepisseInput>
): BsvhuRecepisseInput {
  return {
    number: null,
    department: null,
    validityLimit: null,
    ...props
  };
}

export function createBsvhuReceptionMock(
  props: Partial<BsvhuReception>
): BsvhuReception {
  return {
    __typename: "BsvhuReception",
    date: null,
    quantity: null,
    acceptationStatus: null,
    refusalReason: null,
    identification: null,
    ...props
  };
}

export function createBsvhuReceptionInputMock(
  props: Partial<BsvhuReceptionInput>
): BsvhuReceptionInput {
  return {
    date: null,
    quantity: null,
    acceptationStatus: null,
    refusalReason: null,
    identification: null,
    ...props
  };
}

export function createBsvhuSignatureInputMock(
  props: Partial<BsvhuSignatureInput>
): BsvhuSignatureInput {
  return {
    type: "EMISSION",
    date: null,
    author: "",
    securityCode: null,
    ...props
  };
}

export function createBsvhuSignatureWhereMock(
  props: Partial<BsvhuSignatureWhere>
): BsvhuSignatureWhere {
  return {
    date: createDateFilterMock({}),
    ...props
  };
}

export function createBsvhuTransportMock(
  props: Partial<BsvhuTransport>
): BsvhuTransport {
  return {
    __typename: "BsvhuTransport",
    takenOverAt: null,
    signature: null,
    ...props
  };
}

export function createBsvhuTransporterMock(
  props: Partial<BsvhuTransporter>
): BsvhuTransporter {
  return {
    __typename: "BsvhuTransporter",
    company: null,
    recepisse: null,
    transport: null,
    ...props
  };
}

export function createBsvhuTransporterInputMock(
  props: Partial<BsvhuTransporterInput>
): BsvhuTransporterInput {
  return {
    company: null,
    recepisse: null,
    transport: null,
    ...props
  };
}

export function createBsvhuTransporterWhereMock(
  props: Partial<BsvhuTransporterWhere>
): BsvhuTransporterWhere {
  return {
    company: null,
    transport: null,
    ...props
  };
}

export function createBsvhuTransportInputMock(
  props: Partial<BsvhuTransportInput>
): BsvhuTransportInput {
  return {
    takenOverAt: null,
    ...props
  };
}

export function createBsvhuTransportWhereMock(
  props: Partial<BsvhuTransportWhere>
): BsvhuTransportWhere {
  return {
    signature: null,
    ...props
  };
}

export function createBsvhuWhereMock(props: Partial<BsvhuWhere>): BsvhuWhere {
  return {
    isDraft: null,
    status: null,
    createdAt: null,
    updatedAt: null,
    emitter: null,
    transporter: null,
    destination: null,
    _and: null,
    _or: null,
    _not: null,
    ...props
  };
}

export function createCompanyFavoriteMock(
  props: Partial<CompanyFavorite>
): CompanyFavorite {
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
    brokerReceipt: null,
    vhuAgrementDemolisseur: null,
    vhuAgrementBroyeur: null,
    ...props
  };
}

export function createCompanyForVerificationMock(
  props: Partial<CompanyForVerification>
): CompanyForVerification {
  return {
    __typename: "CompanyForVerification",
    id: "",
    siret: "",
    name: "",
    companyTypes: [],
    createdAt: new Date(),
    verificationStatus: "VERIFIED",
    verificationComment: null,
    verificationMode: null,
    verifiedAt: null,
    admin: null,
    ...props
  };
}

export function createCompanyForVerificationConnectionMock(
  props: Partial<CompanyForVerificationConnection>
): CompanyForVerificationConnection {
  return {
    __typename: "CompanyForVerificationConnection",
    totalCount: 0,
    companies: [],
    ...props
  };
}

export function createCompanyForVerificationWhereMock(
  props: Partial<CompanyForVerificationWhere>
): CompanyForVerificationWhere {
  return {
    verificationStatus: null,
    ...props
  };
}

export function createCompanyInputMock(
  props: Partial<CompanyInput>
): CompanyInput {
  return {
    siret: null,
    name: null,
    address: null,
    contact: null,
    mail: null,
    phone: null,
    vatNumber: null,
    ...props
  };
}

export function createCompanyMemberMock(
  props: Partial<CompanyMember>
): CompanyMember {
  return {
    __typename: "CompanyMember",
    id: "",
    email: "",
    name: null,
    role: null,
    isActive: null,
    isPendingInvitation: null,
    isMe: null,
    ...props
  };
}

export function createCompanyPrivateMock(
  props: Partial<CompanyPrivate>
): CompanyPrivate {
  return {
    __typename: "CompanyPrivate",
    id: "",
    companyTypes: [],
    gerepId: null,
    securityCode: 0,
    verificationStatus: "VERIFIED",
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
    brokerReceipt: null,
    vhuAgrementDemolisseur: null,
    vhuAgrementBroyeur: null,
    ecoOrganismeAgreements: [],
    allowBsdasriTakeOverWithoutSignature: false,
    ...props
  };
}

export function createCompanyPublicMock(
  props: Partial<CompanyPublic>
): CompanyPublic {
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
    companyTypes: [],
    transporterReceipt: null,
    traderReceipt: null,
    brokerReceipt: null,
    vhuAgrementDemolisseur: null,
    vhuAgrementBroyeur: null,
    ecoOrganismeAgreements: [],
    allowBsdasriTakeOverWithoutSignature: null,
    ...props
  };
}

export function createCompanySearchResultMock(
  props: Partial<CompanySearchResult>
): CompanySearchResult {
  return {
    __typename: "CompanySearchResult",
    siret: null,
    etatAdministratif: null,
    address: null,
    codeCommune: null,
    name: null,
    naf: null,
    libelleNaf: null,
    installation: null,
    transporterReceipt: null,
    traderReceipt: null,
    brokerReceipt: null,
    vhuAgrementDemolisseur: null,
    vhuAgrementBroyeur: null,
    ...props
  };
}

export function createCompanyStatMock(
  props: Partial<CompanyStat>
): CompanyStat {
  return {
    __typename: "CompanyStat",
    company: null,
    stats: [],
    ...props
  };
}

export function createCreateBrokerReceiptInputMock(
  props: Partial<CreateBrokerReceiptInput>
): CreateBrokerReceiptInput {
  return {
    receiptNumber: "",
    validityLimit: new Date(),
    department: "",
    ...props
  };
}

export function createCreateFormInputMock(
  props: Partial<CreateFormInput>
): CreateFormInput {
  return {
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    broker: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    ...props
  };
}

export function createCreateTraderReceiptInputMock(
  props: Partial<CreateTraderReceiptInput>
): CreateTraderReceiptInput {
  return {
    receiptNumber: "",
    validityLimit: new Date(),
    department: "",
    ...props
  };
}

export function createCreateTransporterReceiptInputMock(
  props: Partial<CreateTransporterReceiptInput>
): CreateTransporterReceiptInput {
  return {
    receiptNumber: "",
    validityLimit: new Date(),
    department: "",
    ...props
  };
}

export function createCreateVhuAgrementInputMock(
  props: Partial<CreateVhuAgrementInput>
): CreateVhuAgrementInput {
  return {
    agrementNumber: "",
    department: "",
    ...props
  };
}

export function createDateFilterMock(props: Partial<DateFilter>): DateFilter {
  return {
    _gte: null,
    _gt: null,
    _lte: null,
    _lt: null,
    _eq: null,
    ...props
  };
}

export function createDeclarationMock(
  props: Partial<Declaration>
): Declaration {
  return {
    __typename: "Declaration",
    annee: null,
    codeDechet: null,
    libDechet: null,
    gerepType: null,
    ...props
  };
}

export function createDeleteBrokerReceiptInputMock(
  props: Partial<DeleteBrokerReceiptInput>
): DeleteBrokerReceiptInput {
  return {
    id: "",
    ...props
  };
}

export function createDeleteTraderReceiptInputMock(
  props: Partial<DeleteTraderReceiptInput>
): DeleteTraderReceiptInput {
  return {
    id: "",
    ...props
  };
}

export function createDeleteTransporterReceiptInputMock(
  props: Partial<DeleteTransporterReceiptInput>
): DeleteTransporterReceiptInput {
  return {
    id: "",
    ...props
  };
}

export function createDeleteVhuAgrementInputMock(
  props: Partial<DeleteVhuAgrementInput>
): DeleteVhuAgrementInput {
  return {
    id: "",
    ...props
  };
}

export function createDestinationMock(
  props: Partial<Destination>
): Destination {
  return {
    __typename: "Destination",
    cap: null,
    processingOperation: null,
    company: null,
    isFilledByEmitter: null,
    ...props
  };
}

export function createDestinationInputMock(
  props: Partial<DestinationInput>
): DestinationInput {
  return {
    company: null,
    cap: null,
    processingOperation: null,
    ...props
  };
}

export function createEcoOrganismeMock(
  props: Partial<EcoOrganisme>
): EcoOrganisme {
  return {
    __typename: "EcoOrganisme",
    id: "",
    name: "",
    siret: "",
    address: "",
    ...props
  };
}

export function createEcoOrganismeInputMock(
  props: Partial<EcoOrganismeInput>
): EcoOrganismeInput {
  return {
    name: "",
    siret: "",
    ...props
  };
}

export function createEmitterMock(props: Partial<Emitter>): Emitter {
  return {
    __typename: "Emitter",
    type: null,
    workSite: null,
    pickupSite: null,
    company: null,
    ...props
  };
}

export function createEmitterInputMock(
  props: Partial<EmitterInput>
): EmitterInput {
  return {
    type: null,
    workSite: null,
    pickupSite: null,
    company: null,
    ...props
  };
}

export function createFileDownloadMock(
  props: Partial<FileDownload>
): FileDownload {
  return {
    __typename: "FileDownload",
    token: null,
    downloadLink: null,
    ...props
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
    broker: null,
    createdAt: null,
    updatedAt: null,
    status: "DRAFT",
    signedByTransporter: null,
    sentAt: null,
    sentBy: null,
    wasteAcceptationStatus: null,
    wasteRefusalReason: null,
    receivedBy: null,
    receivedAt: null,
    signedAt: null,
    quantityReceived: null,
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
    ...props
  };
}

export function createFormCompanyMock(
  props: Partial<FormCompany>
): FormCompany {
  return {
    __typename: "FormCompany",
    name: null,
    siret: null,
    address: null,
    country: null,
    contact: null,
    phone: null,
    mail: null,
    vatNumber: null,
    ...props
  };
}

export function createFormEcoOrganismeMock(
  props: Partial<FormEcoOrganisme>
): FormEcoOrganisme {
  return {
    __typename: "FormEcoOrganisme",
    name: "",
    siret: "",
    ...props
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
    broker: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    ...props
  };
}

export function createFormsLifeCycleDataMock(
  props: Partial<FormsLifeCycleData>
): FormsLifeCycleData {
  return {
    __typename: "formsLifeCycleData",
    statusLogs: [],
    hasNextPage: null,
    hasPreviousPage: null,
    startCursor: null,
    endCursor: null,
    count: null,
    ...props
  };
}

export function createFormSubscriptionMock(
  props: Partial<FormSubscription>
): FormSubscription {
  return {
    __typename: "FormSubscription",
    mutation: null,
    node: null,
    updatedFields: null,
    previousValues: null,
    ...props
  };
}

export function createImportPaperFormInputMock(
  props: Partial<ImportPaperFormInput>
): ImportPaperFormInput {
  return {
    id: null,
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    broker: null,
    ecoOrganisme: null,
    signingInfo: createSignatureFormInputMock({}),
    receivedInfo: createReceivedFormInputMock({}),
    processedInfo: createProcessedFormInputMock({}),
    ...props
  };
}

export function createInstallationMock(
  props: Partial<Installation>
): Installation {
  return {
    __typename: "Installation",
    codeS3ic: null,
    urlFiche: null,
    rubriques: null,
    declarations: null,
    ...props
  };
}

export function createInternationalCompanyInputMock(
  props: Partial<InternationalCompanyInput>
): InternationalCompanyInput {
  return {
    siret: null,
    name: null,
    address: null,
    country: null,
    contact: null,
    mail: null,
    phone: null,
    ...props
  };
}

export function createInvitationMock(props: Partial<Invitation>): Invitation {
  return {
    __typename: "Invitation",
    id: "",
    email: "",
    companySiret: "",
    hash: "",
    role: "MEMBER",
    acceptedAt: null,
    ...props
  };
}

export function createMembershipRequestMock(
  props: Partial<MembershipRequest>
): MembershipRequest {
  return {
    __typename: "MembershipRequest",
    id: "",
    email: "",
    siret: "",
    name: "",
    status: "PENDING",
    sentTo: [],
    ...props
  };
}

export function createNextDestinationMock(
  props: Partial<NextDestination>
): NextDestination {
  return {
    __typename: "NextDestination",
    processingOperation: null,
    company: null,
    ...props
  };
}

export function createNextDestinationInputMock(
  props: Partial<NextDestinationInput>
): NextDestinationInput {
  return {
    processingOperation: "",
    company: createInternationalCompanyInputMock({}),
    ...props
  };
}

export function createNextSegmentInfoInputMock(
  props: Partial<NextSegmentInfoInput>
): NextSegmentInfoInput {
  return {
    transporter: null,
    mode: "ROAD",
    ...props
  };
}

export function createOrderByMock(props: Partial<OrderBy>): OrderBy {
  return {
    type: null,
    readableId: null,
    emitter: null,
    recipient: null,
    waste: null,
    ...props
  };
}

export function createPackagingInfoMock(
  props: Partial<PackagingInfo>
): PackagingInfo {
  return {
    __typename: "PackagingInfo",
    type: "FUT",
    other: null,
    quantity: 0,
    ...props
  };
}

export function createPackagingInfoInputMock(
  props: Partial<PackagingInfoInput>
): PackagingInfoInput {
  return {
    type: "FUT",
    other: null,
    quantity: 0,
    ...props
  };
}

export function createPageInfoMock(props: Partial<PageInfo>): PageInfo {
  return {
    __typename: "PageInfo",
    startCursor: null,
    endCursor: null,
    hasNextPage: false,
    hasPreviousPage: false,
    ...props
  };
}

export function createPrivateCompanyInputMock(
  props: Partial<PrivateCompanyInput>
): PrivateCompanyInput {
  return {
    siret: "",
    gerepId: null,
    companyTypes: [],
    codeNaf: null,
    companyName: null,
    givenName: null,
    address: null,
    transporterReceiptId: null,
    traderReceiptId: null,
    brokerReceiptId: null,
    vhuAgrementDemolisseurId: null,
    vhuAgrementBroyeurId: null,
    ecoOrganismeAgreements: null,
    ...props
  };
}

export function createProcessedFormInputMock(
  props: Partial<ProcessedFormInput>
): ProcessedFormInput {
  return {
    processingOperationDone: "",
    processingOperationDescription: null,
    processedBy: "",
    processedAt: new Date(),
    nextDestination: null,
    noTraceability: null,
    ...props
  };
}

export function createReceivedFormInputMock(
  props: Partial<ReceivedFormInput>
): ReceivedFormInput {
  return {
    receivedBy: "",
    receivedAt: new Date(),
    wasteAcceptationStatus: null,
    wasteRefusalReason: null,
    signedAt: null,
    quantityReceived: null,
    ...props
  };
}

export function createRecipientMock(props: Partial<Recipient>): Recipient {
  return {
    __typename: "Recipient",
    cap: null,
    processingOperation: null,
    company: null,
    isTempStorage: null,
    ...props
  };
}

export function createRecipientInputMock(
  props: Partial<RecipientInput>
): RecipientInput {
  return {
    cap: null,
    processingOperation: null,
    company: null,
    isTempStorage: null,
    ...props
  };
}

export function createRegroupedBsdasriInputMock(
  props: Partial<RegroupedBsdasriInput>
): RegroupedBsdasriInput {
  return {
    id: null,
    ...props
  };
}

export function createResealedFormInputMock(
  props: Partial<ResealedFormInput>
): ResealedFormInput {
  return {
    destination: null,
    wasteDetails: null,
    transporter: null,
    ...props
  };
}

export function createResentFormInputMock(
  props: Partial<ResentFormInput>
): ResentFormInput {
  return {
    destination: null,
    wasteDetails: null,
    transporter: null,
    signedBy: "",
    signedAt: new Date(),
    ...props
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
    ...props
  };
}

export function createSendVerificationCodeLetterInputMock(
  props: Partial<SendVerificationCodeLetterInput>
): SendVerificationCodeLetterInput {
  return {
    siret: "",
    ...props
  };
}

export function createSentFormInputMock(
  props: Partial<SentFormInput>
): SentFormInput {
  return {
    sentAt: new Date(),
    sentBy: "",
    ...props
  };
}

export function createSignatureMock(props: Partial<Signature>): Signature {
  return {
    __typename: "Signature",
    date: null,
    author: null,
    ...props
  };
}

export function createSignatureFormInputMock(
  props: Partial<SignatureFormInput>
): SignatureFormInput {
  return {
    sentAt: new Date(),
    sentBy: "",
    ...props
  };
}

export function createSignatureInputMock(
  props: Partial<SignatureInput>
): SignatureInput {
  return {
    date: new Date(),
    author: "",
    ...props
  };
}

export function createSignupInputMock(
  props: Partial<SignupInput>
): SignupInput {
  return {
    email: "",
    password: "",
    name: "",
    phone: null,
    ...props
  };
}

export function createStatMock(props: Partial<Stat>): Stat {
  return {
    __typename: "Stat",
    wasteCode: "",
    incoming: 0,
    outgoing: 0,
    ...props
  };
}

export function createStateSummaryMock(
  props: Partial<StateSummary>
): StateSummary {
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
    ...props
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
    ...props
  };
}

export function createStatusLogFormMock(
  props: Partial<StatusLogForm>
): StatusLogForm {
  return {
    __typename: "StatusLogForm",
    id: null,
    readableId: null,
    ...props
  };
}

export function createStatusLogUserMock(
  props: Partial<StatusLogUser>
): StatusLogUser {
  return {
    __typename: "StatusLogUser",
    id: null,
    email: null,
    ...props
  };
}

export function createSubscriptionMock(
  props: Partial<Subscription>
): Subscription {
  return {
    __typename: "Subscription",
    forms: null,
    ...props
  };
}

export function createTakeOverInputMock(
  props: Partial<TakeOverInput>
): TakeOverInput {
  return {
    takenOverAt: new Date(),
    takenOverBy: "",
    ...props
  };
}

export function createTemporaryStorageDetailMock(
  props: Partial<TemporaryStorageDetail>
): TemporaryStorageDetail {
  return {
    __typename: "TemporaryStorageDetail",
    temporaryStorer: null,
    destination: null,
    wasteDetails: null,
    transporter: null,
    signedBy: null,
    signedAt: null,
    ...props
  };
}

export function createTemporaryStorageDetailInputMock(
  props: Partial<TemporaryStorageDetailInput>
): TemporaryStorageDetailInput {
  return {
    destination: null,
    ...props
  };
}

export function createTemporaryStorerMock(
  props: Partial<TemporaryStorer>
): TemporaryStorer {
  return {
    __typename: "TemporaryStorer",
    quantityType: null,
    quantityReceived: null,
    wasteAcceptationStatus: null,
    wasteRefusalReason: null,
    receivedAt: null,
    receivedBy: null,
    ...props
  };
}

export function createTempStoredFormInputMock(
  props: Partial<TempStoredFormInput>
): TempStoredFormInput {
  return {
    wasteAcceptationStatus: null,
    wasteRefusalReason: null,
    receivedBy: "",
    receivedAt: new Date(),
    signedAt: null,
    quantityReceived: 0,
    quantityType: "REAL",
    ...props
  };
}

export function createTempStorerAcceptedFormInputMock(
  props: Partial<TempStorerAcceptedFormInput>
): TempStorerAcceptedFormInput {
  return {
    signedAt: new Date(),
    signedBy: "",
    wasteAcceptationStatus: "ACCEPTED",
    wasteRefusalReason: null,
    quantityReceived: 0,
    quantityType: "REAL",
    ...props
  };
}

export function createTraderMock(props: Partial<Trader>): Trader {
  return {
    __typename: "Trader",
    company: null,
    receipt: null,
    department: null,
    validityLimit: null,
    ...props
  };
}

export function createTraderInputMock(
  props: Partial<TraderInput>
): TraderInput {
  return {
    receipt: null,
    department: null,
    validityLimit: null,
    company: null,
    ...props
  };
}

export function createTraderReceiptMock(
  props: Partial<TraderReceipt>
): TraderReceipt {
  return {
    __typename: "TraderReceipt",
    id: "",
    receiptNumber: "",
    validityLimit: new Date(),
    department: "",
    ...props
  };
}

export function createTransporterMock(
  props: Partial<Transporter>
): Transporter {
  return {
    __typename: "Transporter",
    company: null,
    isExemptedOfReceipt: null,
    receipt: null,
    department: null,
    validityLimit: null,
    numberPlate: null,
    customInfo: null,
    ...props
  };
}

export function createTransporterInputMock(
  props: Partial<TransporterInput>
): TransporterInput {
  return {
    company: null,
    isExemptedOfReceipt: null,
    receipt: null,
    department: null,
    validityLimit: null,
    numberPlate: null,
    customInfo: null,
    ...props
  };
}

export function createTransporterReceiptMock(
  props: Partial<TransporterReceipt>
): TransporterReceipt {
  return {
    __typename: "TransporterReceipt",
    id: "",
    receiptNumber: "",
    validityLimit: new Date(),
    department: "",
    ...props
  };
}

export function createTransporterSignatureFormInputMock(
  props: Partial<TransporterSignatureFormInput>
): TransporterSignatureFormInput {
  return {
    sentAt: new Date(),
    signedByTransporter: false,
    securityCode: 0,
    signatureAuthor: null,
    sentBy: "",
    signedByProducer: false,
    packagingInfos: null,
    packagings: null,
    quantity: 0,
    onuCode: null,
    ...props
  };
}

export function createTransportSegmentMock(
  props: Partial<TransportSegment>
): TransportSegment {
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
    ...props
  };
}

export function createUpdateBrokerReceiptInputMock(
  props: Partial<UpdateBrokerReceiptInput>
): UpdateBrokerReceiptInput {
  return {
    id: "",
    receiptNumber: null,
    validityLimit: null,
    department: null,
    ...props
  };
}

export function createUpdateFormInputMock(
  props: Partial<UpdateFormInput>
): UpdateFormInput {
  return {
    id: "",
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    broker: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    ...props
  };
}

export function createUpdateTraderReceiptInputMock(
  props: Partial<UpdateTraderReceiptInput>
): UpdateTraderReceiptInput {
  return {
    id: "",
    receiptNumber: null,
    validityLimit: null,
    department: null,
    ...props
  };
}

export function createUpdateTransporterReceiptInputMock(
  props: Partial<UpdateTransporterReceiptInput>
): UpdateTransporterReceiptInput {
  return {
    id: "",
    receiptNumber: null,
    validityLimit: null,
    department: null,
    ...props
  };
}

export function createUpdateVhuAgrementInputMock(
  props: Partial<UpdateVhuAgrementInput>
): UpdateVhuAgrementInput {
  return {
    id: "",
    agrementNumber: null,
    department: null,
    ...props
  };
}

export function createUploadLinkMock(props: Partial<UploadLink>): UploadLink {
  return {
    __typename: "UploadLink",
    signedUrl: null,
    key: null,
    ...props
  };
}

export function createUserMock(props: Partial<User>): User {
  return {
    __typename: "User",
    id: "",
    email: "",
    name: null,
    isAdmin: null,
    phone: null,
    companies: [],
    ...props
  };
}

export function createVerifyCompanyByAdminInputMock(
  props: Partial<VerifyCompanyByAdminInput>
): VerifyCompanyByAdminInput {
  return {
    siret: "",
    verificationComment: null,
    ...props
  };
}

export function createVerifyCompanyInputMock(
  props: Partial<VerifyCompanyInput>
): VerifyCompanyInput {
  return {
    siret: "",
    code: "",
    ...props
  };
}

export function createVhuAgrementMock(
  props: Partial<VhuAgrement>
): VhuAgrement {
  return {
    __typename: "VhuAgrement",
    id: "",
    agrementNumber: "",
    department: "",
    ...props
  };
}

export function createWasteDetailsMock(
  props: Partial<WasteDetails>
): WasteDetails {
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
    pop: null,
    ...props
  };
}

export function createWasteDetailsInputMock(
  props: Partial<WasteDetailsInput>
): WasteDetailsInput {
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
    pop: null,
    ...props
  };
}

export function createWasteDetailsRepackagingInputMock(
  props: Partial<WasteDetailsRepackagingInput>
): WasteDetailsRepackagingInput {
  return {
    onuCode: null,
    packagingInfos: null,
    quantity: null,
    quantityType: null,
    ...props
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
    ...props
  };
}

export function createWorkSiteInputMock(
  props: Partial<WorkSiteInput>
): WorkSiteInput {
  return {
    address: null,
    city: null,
    infos: null,
    name: null,
    postalCode: null,
    ...props
  };
}

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
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
   *
   * Si aucune information de timezone n'est renseignée,
   * c'est le fuseau horaire de Paris qui sera automatiquement utilisé (CET ou CEST).
   * Eg. 2020-11-23T00:00:00 sera interprété comme 2020-11-22T23:00:00Z (CET) ou 2020-11-22T22:00:00Z (CEST).
   */
  DateTime: string;
  JSON: any;
  /** Chaîne de caractère au format URL, débutant par un protocole http(s). */
  URL: string;
};

export type AcceptedFormInput = {
  /**
   * Quantité réelle présentée en tonnes (case 10).
   *
   * Doit être supérieure à 0 lorsque le déchet est accepté.
   * Doit être égale à 0 lorsque le déchet est refusé.
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantityReceived: Scalars['Float'];
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt: Scalars['DateTime'];
  /** Nom de la personne en charge de l'acceptation' du déchet (case 10) */
  signedBy: Scalars['String'];
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus: WasteAcceptationStatus;
  /** Raison du refus (case 10). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: InputMaybe<Scalars['String']>;
};

/** Personnal access token */
export type AccessToken = {
  __typename?: 'AccessToken';
  /** Permet de décrire l'utilité de ce token */
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** Date de dernière utilisation du token */
  lastUsed?: Maybe<Scalars['DateTime']>;
};

export type AdminForVerification = {
  __typename?: 'AdminForVerification';
  email: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
};

/** Déchet sortant, entrant, collecté ou géré. */
export type AllWaste = {
  __typename?: 'AllWaste';
  /** La raison sociale du courtier si le déchet est géré par un courtier */
  brokerCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du courtier si le déchet est géré par un courtier */
  brokerCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du courtier mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un courtier */
  brokerRecepisseNumber?: Maybe<Scalars['String']>;
  /** Extra - Type de bordereau */
  bsdType?: Maybe<BsdType>;
  /** Extra - Date de création du bordereeau */
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Identifiant secondaire du bordereau (BSDD uniquement) */
  customId?: Maybe<Scalars['String']>;
  /** Extra - N° de CAP (Certificat d'acceptation préalable) */
  destinationCap?: Maybe<Scalars['String']>;
  /** L'adresse de l'établissement vers lequel le déchet est expédié */
  destinationCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'installation de destination */
  destinationCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de l'établissement vers lequel le déchet est expédié */
  destinationCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET de l'établissement vers lequel le déchet est expédié */
  destinationCompanySiret?: Maybe<Scalars['String']>;
  /** Le code du traitement qui va être opéré dans l'établissement selon les annexes I et II de la directive 2008/98/CE relative aux déchets */
  destinationOperationCode?: Maybe<Scalars['String']>;
  /** Extra - Date de réalisation de l'opération */
  destinationOperationDate?: Maybe<Scalars['DateTime']>;
  /** Qualification du traitement final vis-à-vis de la hiérarchie des modes de traitement définie à l'article L. 541-1 du code de l'environnement */
  destinationOperationMode?: Maybe<OperationMode>;
  /** Extra - Autorisation par arrêté préfectoral, à la perte d'identification de la provenance à l'origine */
  destinationOperationNoTraceability?: Maybe<Scalars['Boolean']>;
  /** Le code du traitement qui va être opéré dans l'installation vers laquelle le déchet est expédié, selon les annexes I et II de la directive 2008/98/CE relative aux déchets ; */
  destinationPlannedOperationCode?: Maybe<Scalars['String']>;
  /** NON IMPLÉMENTÉ - La qualification du traitement final vis-à-vis de la hiérarchie des modes de traitement définie à l'article L. 541-1 du code de l'environnement */
  destinationPlannedOperationMode?: Maybe<OperationMode>;
  /** Extra - Statut d'acceptation du déchet */
  destinationReceptionAcceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** La date de déchargement du déchet */
  destinationReceptionDate?: Maybe<Scalars['DateTime']>;
  /** La quantité de déchet entrant exprimée en tonne */
  destinationReceptionWeight?: Maybe<Scalars['Float']>;
  /**
   * la raison sociale de l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeName?: Maybe<Scalars['String']>;
  /**
   * Le N°SIREN l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeSiren?: Maybe<Scalars['String']>;
  /** L'adresse de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'expéditeur du déchet */
  emitterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanySiret?: Maybe<Scalars['String']>;
  /** L'adresse de prise en charge lorsqu'elle se distingue de l'adresse de l'établissement */
  emitterPickupsiteAddress?: Maybe<Scalars['String']>;
  /** Le nom du point de prise en charge lorsqu'il se distingue du nom de l'établissement */
  emitterPickupsiteName?: Maybe<Scalars['String']>;
  /**
   * Le numéro du ou des bordereaux de suivi de déchets mentionnés aux articles R. 541-45 du code de l'environnement et R. 1335-4 du code de la santé publique
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839119&dateTexte=&categorieLien=cid
   * https://www.legifrance.gouv.fr/affichCode.do?cidTexte=LEGITEXT000006072665&dateTexte=&categorieLien=cid
   */
  id?: Maybe<Scalars['ID']>;
  /** L'adresse du producteur initial du déchet */
  initialEmitterCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du producteur initial du déchet */
  initialEmitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET du producteur initial du déchet */
  initialEmitterCompanySiret?: Maybe<Scalars['String']>;
  /** L'adresse du producteur initial du déchet */
  initialEmitterPostalCodes?: Maybe<Array<Scalars['String']>>;
  /** NON IMPLÉMENTÉ. La date de cession du déchet par le négociant, ou la date de fin de gestion du déchet par le courtier */
  managedEndDate?: Maybe<Scalars['DateTime']>;
  /** NON IMPLÉMENTÉ. La date d'acquisition du déchet par le négociant, ou la date de début de gestion du déchet par le courtier */
  managedStartDate?: Maybe<Scalars['DateTime']>;
  /**
   * S'il s'agit de déchets POP au sens de l'article R. 541-8 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839071&dateTexte=&categorieLien=cid
   */
  pop?: Maybe<Scalars['Boolean']>;
  /** Extra - Statut du bordereau */
  status?: Maybe<Scalars['String']>;
  /** La raison sociale du négociant si le déchet est géré par un négociant */
  traderCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du négociant si le déchet est géré par un négociant */
  traderCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du négociant mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un négociant */
  traderRecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°2 */
  transporter2CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro d'immatriculation du ou des véhicules du transporteur n°2 (en cas de transport multimodal) */
  transporter2NumberPlates?: Maybe<Array<Scalars['String']>>;
  /** Extra - Exemption de récépissé transporteur n°2 */
  transporter2RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°2 (en cas de transport multimodal) */
  transporter2RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°3 */
  transporter3CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro d'immatriculation du ou des véhicules du transporteur n°3 (en cas de transport multimodal) */
  transporter3NumberPlates?: Maybe<Array<Scalars['String']>>;
  /** Extra - Exemption de récépissé transporteur n°3 */
  transporter3RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°3 (en cas de transport multimodal) */
  transporter3RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur */
  transporterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur */
  transporterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur */
  transporterCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur */
  transporterCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro d'immatriculation du ou des véhicules transportant le déchet */
  transporterNumberPlates?: Maybe<Array<Scalars['String']>>;
  /** Extra - Exemption de récépissé transporteur */
  transporterRecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur */
  transporterRecepisseNumber?: Maybe<Scalars['String']>;
  /** La date d'enlèvement du déchet */
  transporterTakenOverAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Date de dernière modification du bordereau */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /**
   * Dans le cas de déchets dangereux, selon le cas, le code transport lié aux réglementations internationales
   * relatives au transport international des marchandises dangereuses par route, au transport international
   * ferroviaire des marchandises dangereuses, au transport de matières dangereuses sur le Rhin, ou au
   * transport maritime de marchandises dangereuses
   */
  wasteAdr?: Maybe<Scalars['String']>;
  /**
   * Code du déchet entrant au regard l'article R. 541-7 du code de l'environnement
   * https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032191751/
   */
  wasteCode?: Maybe<Scalars['String']>;
  /** Dénomination usuelle du déchet */
  wasteDescription?: Maybe<Scalars['String']>;
  /** Certains déchets avec un code déchet sans astérisque peuvent, selon les cas, être dangereux ou non dangereux. */
  wasteIsDangerous?: Maybe<Scalars['Boolean']>;
  /** La quantité de déchet sortant en tonne */
  weight?: Maybe<Scalars['Float']>;
  /** Extra - L'adresse de l'entreprise de travaux (amiante uniquement) */
  workerCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - La raison sociale de l'entreprise de travaux (amiante uniquement) */
  workerCompanyName?: Maybe<Scalars['String']>;
  /** Extra - Le numéro SIRET de l'entreprise de travaux (amiante uniquement) */
  workerCompanySiret?: Maybe<Scalars['String']>;
};

export type AllWasteConnection = {
  __typename?: 'AllWasteConnection';
  edges: Array<AllWasteEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type AllWasteEdge = {
  __typename?: 'AllWasteEdge';
  cursor: Scalars['String'];
  node: ManagedWaste;
};

export type AnonymousCompany = {
  __typename?: 'AnonymousCompany';
  address: Scalars['String'];
  codeCommune: Scalars['String'];
  codeNaf: Scalars['String'];
  id: Scalars['String'];
  libelleNaf: Scalars['String'];
  name: Scalars['String'];
  orgId: Scalars['String'];
  siret?: Maybe<Scalars['String']>;
  vatNumber?: Maybe<Scalars['String']>;
};

export type AnonymousCompanyInput = {
  address: Scalars['String'];
  codeCommune: Scalars['String'];
  codeNaf: Scalars['String'];
  name: Scalars['String'];
  siret?: InputMaybe<Scalars['String']>;
  vatNumber?: InputMaybe<Scalars['String']>;
};

/** Payload de création d'une annexe 2 */
export type AppendixFormInput = {
  /** Identifiant unique du bordereau */
  id: Scalars['ID'];
};

export type Application = {
  __typename?: 'Application';
  clientSecret: Scalars['String'];
  goal?: Maybe<ApplicationGoal>;
  id: Scalars['String'];
  logoUrl?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  redirectUris: Array<Scalars['String']>;
};

export enum ApplicationGoal {
  /** Application pour des clients (ex: SaaS métier) */
  Clients = 'CLIENTS',
  /** Application pour un usage personnel ou au sein de sa propre entreprise */
  Personnal = 'PERSONNAL'
}

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

/** Application tierce ayant accès à mon compte via le protocole OAuth2 */
export type AuthorizedApplication = {
  __typename?: 'AuthorizedApplication';
  /** Email de l'administrateur */
  admin?: Maybe<Scalars['String']>;
  /** Identifiant de l'application */
  id: Scalars['ID'];
  /** Date de dernière connexion */
  lastConnection?: Maybe<Scalars['DateTime']>;
  /** Logo de l'application */
  logoUrl?: Maybe<Scalars['String']>;
  /** Nom de l'application */
  name: Scalars['String'];
};

/** Courtier */
export type Broker = {
  __typename?: 'Broker';
  /** Établissement courtier */
  company?: Maybe<FormCompany>;
  /** Département */
  department?: Maybe<Scalars['String']>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars['String']>;
  /** Limite de validité */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

/** Payload lié au courtier */
export type BrokerInput = {
  /** Établissement courtier */
  company?: InputMaybe<CompanyInput>;
  /** Département */
  department?: InputMaybe<Scalars['String']>;
  /** N° de récipissé */
  receipt?: InputMaybe<Scalars['String']>;
  /** Limite de validité */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Récépissé courtier */
export type BrokerReceipt = {
  __typename?: 'BrokerReceipt';
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
  id: Scalars['ID'];
  /** Numéro de récépissé courtier */
  receiptNumber: Scalars['String'];
  /** Limite de validité du récépissé */
  validityLimit: Scalars['DateTime'];
};

export type Bsd = Bsda | Bsdasri | Bsff | Bsvhu | Form;

export type BsdAcceptationWhere = {
  date?: InputMaybe<DateFilter>;
  status?: InputMaybe<WasteAcceptationStatusFilter>;
};

export type BsdBrokerWhere = {
  company?: InputMaybe<BsdCompanyWhere>;
};

export type BsdCompanyWhere = {
  address?: InputMaybe<TextFilter>;
  name?: InputMaybe<TextFilter>;
  siret?: InputMaybe<StringFilter>;
  vatNumber?: InputMaybe<StringFilter>;
};

export type BsdConnection = {
  __typename?: 'BsdConnection';
  edges: Array<BsdEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type BsdDestinationWhere = {
  acceptation?: InputMaybe<BsdAcceptationWhere>;
  cap?: InputMaybe<TextFilter>;
  company?: InputMaybe<BsdCompanyWhere>;
  customInfo?: InputMaybe<TextFilter>;
  operation?: InputMaybe<BsdOperationWhere>;
  reception?: InputMaybe<BsdReceptionWhere>;
};

export type BsdEcoOrganismeWhere = {
  name?: InputMaybe<TextFilter>;
  siret?: InputMaybe<StringFilter>;
};

export type BsdEdge = {
  __typename?: 'BsdEdge';
  cursor: Scalars['String'];
  node: Bsd;
};

export type BsdEmissionWhere = {
  date?: InputMaybe<DateFilter>;
};

/** Champs possible pour le filtre sur l'émetteur. */
export type BsdEmitterWhere = {
  company?: InputMaybe<BsdCompanyWhere>;
  customInfo?: InputMaybe<TextFilter>;
  emission?: InputMaybe<BsdEmissionWhere>;
  pickupSite?: InputMaybe<BsdPickupSiteWhere>;
};

export type BsdNextDestinationWhere = {
  company?: InputMaybe<BsdCompanyWhere>;
};

export type BsdOperationWhere = {
  code?: InputMaybe<StringFilter>;
  date?: InputMaybe<DateFilter>;
  nextDestination?: InputMaybe<BsdNextDestinationWhere>;
};

export type BsdPickupSiteWhere = {
  address?: InputMaybe<TextFilter>;
  name?: InputMaybe<TextFilter>;
};

export type BsdReceptionWhere = {
  date?: InputMaybe<DateFilter>;
};

export type BsdTraderWhere = {
  company?: InputMaybe<BsdCompanyWhere>;
};

export type BsdTransportWhere = {
  plates?: InputMaybe<StringNullableListFilter>;
  takenOverAt?: InputMaybe<DateFilter>;
};

export type BsdTransporterWhere = {
  company?: InputMaybe<BsdCompanyWhere>;
  customInfo?: InputMaybe<TextFilter>;
  transport?: InputMaybe<BsdTransportWhere>;
};

export enum BsdType {
  Bsda = 'BSDA',
  Bsdasri = 'BSDASRI',
  Bsdd = 'BSDD',
  Bsff = 'BSFF',
  Bsvhu = 'BSVHU'
}

export type BsdTypeFilter = {
  _eq?: InputMaybe<BsdType>;
  _in?: InputMaybe<Array<BsdType>>;
};

export type BsdWasteWhere = {
  adr?: InputMaybe<TextFilter>;
  code?: InputMaybe<StringFilter>;
  description?: InputMaybe<TextFilter>;
};

export type BsdWhere = {
  _and?: InputMaybe<Array<BsdWhere>>;
  _or?: InputMaybe<Array<BsdWhere>>;
  broker?: InputMaybe<BsdBrokerWhere>;
  createdAt?: InputMaybe<DateFilter>;
  customId?: InputMaybe<StringFilter>;
  destination?: InputMaybe<BsdDestinationWhere>;
  ecoOrganisme?: InputMaybe<BsdEcoOrganismeWhere>;
  emitter?: InputMaybe<BsdEmitterWhere>;
  ficheInterventionNumbers?: InputMaybe<StringNullableListFilter>;
  id?: InputMaybe<StringFilter>;
  identificationNumbers?: InputMaybe<StringNullableListFilter>;
  isArchivedFor?: InputMaybe<Array<Scalars['String']>>;
  isCollectedFor?: InputMaybe<Array<Scalars['String']>>;
  isDraftFor?: InputMaybe<Array<Scalars['String']>>;
  isFollowFor?: InputMaybe<Array<Scalars['String']>>;
  isForActionFor?: InputMaybe<Array<Scalars['String']>>;
  isInRevisionFor?: InputMaybe<Array<Scalars['String']>>;
  isRevisedFor?: InputMaybe<Array<Scalars['String']>>;
  isToCollectFor?: InputMaybe<Array<Scalars['String']>>;
  packagingNumbers?: InputMaybe<StringNullableListFilter>;
  readableId?: InputMaybe<StringFilter>;
  sealNumbers?: InputMaybe<StringNullableListFilter>;
  sirets?: InputMaybe<StringNullableListFilter>;
  status?: InputMaybe<StringFilter>;
  trader?: InputMaybe<BsdTraderWhere>;
  transporter?: InputMaybe<BsdTransporterWhere>;
  type?: InputMaybe<BsdTypeFilter>;
  updatedAt?: InputMaybe<DateFilter>;
  waste?: InputMaybe<BsdWasteWhere>;
  worker?: InputMaybe<BsdWorkerWhere>;
};

export type BsdWorkWhere = {
  date?: InputMaybe<DateFilter>;
};

export type BsdWorkerWhere = {
  company?: InputMaybe<BsdCompanyWhere>;
  work?: InputMaybe<BsdWorkWhere>;
};

export type Bsda = {
  __typename?: 'Bsda';
  /** Courtier */
  broker?: Maybe<BsdaBroker>;
  /** Date de création */
  createdAt: Scalars['DateTime'];
  /** Installation de destination */
  destination?: Maybe<BsdaDestination>;
  ecoOrganisme?: Maybe<BsdaEcoOrganisme>;
  /** Maitre d'ouvrage ou détenteur du déchet */
  emitter?: Maybe<BsdaEmitter>;
  /** Bordereau dans lequel celui-ci est réexpédié */
  forwardedIn?: Maybe<Bsda>;
  /** Bordereau que celui-ci réexpédie */
  forwarding?: Maybe<InitialBsda>;
  /** Bordereaux dans lequel celui-ci est groupé */
  groupedIn?: Maybe<Bsda>;
  /** Bordereaux que celui-ci groupe */
  grouping?: Maybe<Array<InitialBsda>>;
  /** Bordereau n° */
  id: Scalars['ID'];
  /**
   * Liste d'entreprises intermédiaires. Un intermédiaire est une entreprise qui prend part à la gestion du déchet,
   * mais pas à la responsabilité de la traçabilité (entreprise de travaux, bureau d'étude, maitre d'oeuvre,
   * collectivité, etc.) Il pourra lire ce bordereau, sans étape de signature.
   */
  intermediaries?: Maybe<Array<FormCompany>>;
  /** Indique si le bordereau est à l'état de brouillon */
  isDraft: Scalars['Boolean'];
  /** Metadata associées au bordereau */
  metadata: BsdaMetadata;
  /** Conditionnement */
  packagings?: Maybe<Array<BsdaPackaging>>;
  /** Statur du bordereau */
  status: BsdaStatus;
  /** Entreprise de transport */
  transporter?: Maybe<BsdaTransporter>;
  /**
   * Type de bordereau
   * Le type de bordereau impacte le workflow et les champs obligatoires
   */
  type?: Maybe<BsdaType>;
  /** Date de dernière modification */
  updatedAt: Scalars['DateTime'];
  /** Description du déchet */
  waste?: Maybe<BsdaWaste>;
  /** Quantité en tonnes */
  weight?: Maybe<BsdaWeight>;
  /** Entreprise de travaux */
  worker?: Maybe<BsdaWorker>;
};

export type BsdaBroker = {
  __typename?: 'BsdaBroker';
  /** Coordonnées de l'entreprise courtier */
  company?: Maybe<FormCompany>;
  /** Récépissé courtier */
  recepisse?: Maybe<BsdaRecepisse>;
};

export type BsdaBrokerInput = {
  /** Coordonnées de l'entreprise courtier */
  company?: InputMaybe<CompanyInput>;
  /** Récépissé courtier */
  recepisse?: InputMaybe<BsdaBrokerRecepisseInput>;
};

export type BsdaBrokerRecepisseInput = {
  /** Département */
  department?: InputMaybe<Scalars['String']>;
  /** Exemption de récépissé (conformément aux dispositions de l'article R.541-50 du code de l'environnement) */
  isExempted?: InputMaybe<Scalars['Boolean']>;
  /** Numéro de récépissé */
  number?: InputMaybe<Scalars['String']>;
  /** Date limite de validité */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Champs possible pour le filtre sur le courtier. */
export type BsdaBrokerWhere = {
  company?: InputMaybe<CompanyWhere>;
};

export type BsdaConnection = {
  __typename?: 'BsdaConnection';
  edges: Array<BsdaEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

/** Consistance du déchet */
export enum BsdaConsistence {
  /** Autre */
  Other = 'OTHER',
  /** Pulvérulent */
  Pulverulent = 'PULVERULENT',
  /** Solide */
  Solide = 'SOLIDE'
}

export type BsdaDestination = {
  __typename?: 'BsdaDestination';
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars['String']>;
  /** Établissement de destination */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  /** Réalisation de l'opération (case 11) */
  operation?: Maybe<BsdaOperation>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: Maybe<Scalars['String']>;
  /** Expédition reçue à l'installation de destination */
  reception?: Maybe<BsdaReception>;
};

export type BsdaDestinationInput = {
  /** N° de CAP (le cas échéant) */
  cap?: InputMaybe<Scalars['String']>;
  /** Établissement de destination */
  company?: InputMaybe<CompanyInput>;
  /** Champ libre */
  customInfo?: InputMaybe<Scalars['String']>;
  /** Réalisation de l'opération (case 11) */
  operation?: InputMaybe<BsdaOperationInput>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: InputMaybe<Scalars['String']>;
  /** Expédition reçue à l'installation de destination */
  reception?: InputMaybe<BsdaReceptionInput>;
};

/** Champs possible pour le filtre sur la destination. */
export type BsdaDestinationWhere = {
  company?: InputMaybe<CompanyWhere>;
  customInfo?: InputMaybe<StringFilter>;
  operation?: InputMaybe<BsdaOperationWhere>;
  reception?: InputMaybe<BsdaReceptionWhere>;
};

/** Information sur l'éco-organisme responsable du BSDA */
export type BsdaEcoOrganisme = {
  __typename?: 'BsdaEcoOrganisme';
  name: Scalars['String'];
  siret: Scalars['String'];
};

export type BsdaEcoOrganismeInput = {
  name: Scalars['String'];
  siret: Scalars['String'];
};

export type BsdaEdge = {
  __typename?: 'BsdaEdge';
  cursor: Scalars['String'];
  node: Bsda;
};

export type BsdaEmission = {
  __typename?: 'BsdaEmission';
  signature?: Maybe<Signature>;
};

/** Champs possibles pour le filtre sur l'émission */
export type BsdaEmissionWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

export type BsdaEmitter = {
  __typename?: 'BsdaEmitter';
  /** Établissement MOA/détenteur. Partiellement rempli si l'émetteur est en fait un particulier */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  /** Déclaration générale */
  emission?: Maybe<BsdaEmission>;
  /** Indique si le détenteur est un particulier ou une entreprise */
  isPrivateIndividual?: Maybe<Scalars['Boolean']>;
  /** Informations chantier (si différente de l'adresse de l'entreprise) */
  pickupSite?: Maybe<BsdaPickupSite>;
};

export type BsdaEmitterInput = {
  /** Établissement MOA/détenteur. Partiellement rempli si l'émetteur est en fait un particulier */
  company?: InputMaybe<CompanyInput>;
  /** Champ libre */
  customInfo?: InputMaybe<Scalars['String']>;
  /** Indique si le détenteur est un particulier ou une entreprise */
  isPrivateIndividual?: InputMaybe<Scalars['Boolean']>;
  /** Informations chantier (si différente de l'adresse de l'entreprise) */
  pickupSite?: InputMaybe<BsdaPickupSiteInput>;
};

/** Champs possible pour le filtre sur l'émetteur. */
export type BsdaEmitterWhere = {
  company?: InputMaybe<CompanyWhere>;
  customInfo?: InputMaybe<StringFilter>;
  emission?: InputMaybe<BsdaEmissionWhere>;
};

export type BsdaError = {
  __typename?: 'BsdaError';
  message: Scalars['String'];
  path: Scalars['String'];
  requiredFor: BsdaSignatureType;
};

export type BsdaInput = {
  /** Courtier */
  broker?: InputMaybe<BsdaBrokerInput>;
  /** Installation de destination */
  destination?: InputMaybe<BsdaDestinationInput>;
  /** Eco-organisme */
  ecoOrganisme?: InputMaybe<BsdaEcoOrganismeInput>;
  /** Maitre d'ouvrage ou détenteur du déchet */
  emitter?: InputMaybe<BsdaEmitterInput>;
  /** Bordereau que celui-ci reéxpédie */
  forwarding?: InputMaybe<Scalars['ID']>;
  /** Liste des bordereaux que celui-ci groupe */
  grouping?: InputMaybe<Array<Scalars['ID']>>;
  /**
   * Liste d'entreprises intermédiaires. Un intermédiaire est une entreprise qui prend part à la gestion du déchet,
   * mais pas à la responsabilité de la traçabilité (entreprise de travaux, bureau d'étude, maitre d'oeuvre,
   * collectivité, etc.) Il pourra lire ce bordereau, sans étape de signature.
   *
   * Le nombre maximal d'intermédiaires sur un bordereau est de 3.
   */
  intermediaries?: InputMaybe<Array<CompanyInput>>;
  /** Conditionnement */
  packagings?: InputMaybe<Array<BsdaPackagingInput>>;
  /** Entreprise de transport */
  transporter?: InputMaybe<BsdaTransporterInput>;
  /**
   * Type de bordereau
   * Le type de bordereau impacte le workflow et les champs obligatoires
   */
  type?: InputMaybe<BsdaType>;
  /** Dénomination du déchet */
  waste?: InputMaybe<BsdaWasteInput>;
  /**
   * Poids en tonnes, réel ou estimé.
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  weight?: InputMaybe<BsdaWeightInput>;
  /** Entreprise de travaux */
  worker?: InputMaybe<BsdaWorkerInput>;
};

export type BsdaMetadata = {
  __typename?: 'BsdaMetadata';
  errors?: Maybe<Array<Maybe<BsdaError>>>;
};

export type BsdaNextDestination = {
  __typename?: 'BsdaNextDestination';
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars['String']>;
  /** Coordonnées de l'éxutoire final */
  company?: Maybe<FormCompany>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: Maybe<Scalars['String']>;
};

export type BsdaNextDestinationInput = {
  /** N° de CAP (le cas échéant) */
  cap?: InputMaybe<Scalars['String']>;
  /** Entreprise de travaux */
  company?: InputMaybe<CompanyInput>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: InputMaybe<Scalars['String']>;
};

export type BsdaOperation = {
  __typename?: 'BsdaOperation';
  /** Code D/R */
  code?: Maybe<Scalars['String']>;
  /** Date de réalisation de l'opération */
  date?: Maybe<Scalars['DateTime']>;
  /** Description de l'opération */
  description?: Maybe<Scalars['String']>;
  /** Qualification du traitement final */
  mode?: Maybe<OperationMode>;
  /** Exutoire final (si la destination ne l'est pas) */
  nextDestination?: Maybe<BsdaNextDestination>;
  signature?: Maybe<Signature>;
};

export type BsdaOperationInput = {
  /** Code D/R */
  code?: InputMaybe<Scalars['String']>;
  /** Date de réalisation de l'opération */
  date?: InputMaybe<Scalars['DateTime']>;
  /** Description de l'opération */
  description?: InputMaybe<Scalars['String']>;
  /** Qualification du traitement final */
  mode?: InputMaybe<OperationMode>;
  /** Exutoire final (si la destination ne l'est pas) */
  nextDestination?: InputMaybe<BsdaNextDestinationInput>;
};

/** Champs possible pour le filtre sur l'opération. */
export type BsdaOperationWhere = {
  code?: InputMaybe<StringFilter>;
  signature?: InputMaybe<SignatureWhere>;
};

export type BsdaPackaging = {
  __typename?: 'BsdaPackaging';
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars['String']>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars['Int'];
  /** Type de conditionnement */
  type: BsdaPackagingType;
};

export type BsdaPackagingInput = {
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: InputMaybe<Scalars['String']>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars['Int'];
  /** Type de conditionnement */
  type?: InputMaybe<BsdaPackagingType>;
};

/** Type de packaging du déchet */
export enum BsdaPackagingType {
  /** Bug Bag */
  BigBag = 'BIG_BAG',
  /** Conteneur Bag */
  ConteneurBag = 'CONTENEUR_BAG',
  /** Dépôt Bag */
  DepotBag = 'DEPOT_BAG',
  /** Autre */
  Other = 'OTHER',
  /** Palette filmée */
  PaletteFilme = 'PALETTE_FILME',
  /** Sac renforcé */
  SacRenforce = 'SAC_RENFORCE'
}

export type BsdaPickupSite = {
  __typename?: 'BsdaPickupSite';
  address?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  /** Autres informations, notamment le code chantier */
  infos?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  postalCode?: Maybe<Scalars['String']>;
};

export type BsdaPickupSiteInput = {
  address?: InputMaybe<Scalars['String']>;
  city?: InputMaybe<Scalars['String']>;
  /** Autres informations, notamment le code chantier */
  infos?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  postalCode?: InputMaybe<Scalars['String']>;
};

/** Type de quantité */
export enum BsdaQuantityType {
  /** Estimée */
  Estimated = 'ESTIMATED',
  /** Réelle */
  Real = 'REAL'
}

export type BsdaRecepisse = {
  __typename?: 'BsdaRecepisse';
  /** Département */
  department?: Maybe<Scalars['String']>;
  /** Exemption de récépissé (conformément aux dispositions de l'article R.541-50 du code de l'environnement) */
  isExempted?: Maybe<Scalars['Boolean']>;
  /** Numéro de récépissé */
  number?: Maybe<Scalars['String']>;
  /** Date limite de validité */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

export type BsdaRecepisseInput = {
  /**
   * Département
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  department?: InputMaybe<Scalars['String']>;
  /** Exemption de récépissé (conformément aux dispositions de l'article R.541-50 du code de l'environnement) */
  isExempted?: InputMaybe<Scalars['Boolean']>;
  /**
   * Numéro de récépissé
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  number?: InputMaybe<Scalars['String']>;
  /**
   * Date limite de validité
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

export type BsdaReception = {
  __typename?: 'BsdaReception';
  /** Lot accepté, accepté partiellement ou refusé */
  acceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** Date de présentation sur site */
  date?: Maybe<Scalars['DateTime']>;
  /** Motif de refus */
  refusalReason?: Maybe<Scalars['String']>;
  /** Signature case 10 */
  signature?: Maybe<Signature>;
  /** Poids présenté */
  weight?: Maybe<Scalars['Float']>;
};

export type BsdaReceptionInput = {
  /** Lot accepté, accepté partiellement ou refusé */
  acceptationStatus?: InputMaybe<WasteAcceptationStatus>;
  /** Date de présentation sur site */
  date?: InputMaybe<Scalars['DateTime']>;
  /** Motif de refus */
  refusalReason?: InputMaybe<Scalars['String']>;
  /**
   * Quantité présentée en tonnes
   *
   * Doit être inférieure à 40T en cas de transport routier et inférieure à 50 000 T tout type de transport confondu.
   */
  weight?: InputMaybe<Scalars['Float']>;
};

/** Champs possibles pour le filtre sur la réception */
export type BsdaReceptionWhere = {
  date?: InputMaybe<DateFilter>;
};

/** Demande de révision Bsda */
export type BsdaRevisionRequest = {
  __typename?: 'BsdaRevisionRequest';
  /** Liste des approbations apposées sur la révision */
  approvals: Array<BsdaRevisionRequestApproval>;
  /** Entreprise à l'origine de la demande de révision */
  authoringCompany: FormCompany;
  /** Aperçu du bordereau concerné au moment de la création de la demande de révision. Il ne reflète pas le bordereau actuel. */
  bsda: Bsda;
  /** Commentaire explicatif, saisi par l'auteur de la demande de révision */
  comment: Scalars['String'];
  /** Contenu de la révision */
  content: BsdaRevisionRequestContent;
  /** Date de création de la demande */
  createdAt: Scalars['DateTime'];
  /** Identifiant de la demande de révison */
  id: Scalars['ID'];
  /** Statut d'acceptation de la révision */
  status: RevisionRequestStatus;
};

/** Approbation d'une demande de révision */
export type BsdaRevisionRequestApproval = {
  __typename?: 'BsdaRevisionRequestApproval';
  /** Siret de l'entreprise responsable de cette approbation */
  approverSiret: Scalars['String'];
  /** Commentaire explicatif, saisi par l'approbateur */
  comment?: Maybe<Scalars['String']>;
  /** Statut d'acceptation de l'approbation */
  status: RevisionRequestApprovalStatus;
};

export type BsdaRevisionRequestConnection = {
  __typename?: 'BsdaRevisionRequestConnection';
  edges: Array<BsdaRevisionRequestEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

/** Payload de révision d'un bordereau. Disponible sur une liste restreinte de champs. */
export type BsdaRevisionRequestContent = {
  __typename?: 'BsdaRevisionRequestContent';
  /** Courtier */
  broker?: Maybe<BsdaBroker>;
  /** Installation de destination */
  destination?: Maybe<BsdaRevisionRequestDestination>;
  /** Maitre d'ouvrage ou détenteur du déchet */
  emitter?: Maybe<BsdaRevisionRequestEmitter>;
  /** Demande d'annulation du bordereau */
  isCanceled?: Maybe<Scalars['Boolean']>;
  /** Conditionnement */
  packagings?: Maybe<Array<BsdaPackaging>>;
  /** Description du déchet */
  waste?: Maybe<BsdaRevisionRequestWaste>;
};

/** Payload de révision d'un bordereau. Disponible sur une liste restreinte de champs. */
export type BsdaRevisionRequestContentInput = {
  /** Courtier */
  broker?: InputMaybe<BsdaBrokerInput>;
  /** Installation de destination */
  destination?: InputMaybe<BsdaRevisionRequestDestinationInput>;
  /** Maitre d'ouvrage ou détenteur du déchet */
  emitter?: InputMaybe<BsdaRevisionRequestEmitterInput>;
  /** Annuler le bordereau. Exclusif des autres opérations */
  isCanceled?: InputMaybe<Scalars['Boolean']>;
  /** Conditionnement */
  packagings?: InputMaybe<Array<BsdaPackagingInput>>;
  /** Description du déchet */
  waste?: InputMaybe<BsdaRevisionRequestWasteInput>;
};

export type BsdaRevisionRequestDestination = {
  __typename?: 'BsdaRevisionRequestDestination';
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars['String']>;
  /** Réalisation de l'opération (case 11) */
  operation?: Maybe<BsdaRevisionRequestOperation>;
  /** Expédition reçue à l'installation de destination */
  reception?: Maybe<BsdaRevisionRequestReception>;
};

export type BsdaRevisionRequestDestinationInput = {
  /** N° de CAP (le cas échéant) */
  cap?: InputMaybe<Scalars['String']>;
  /** Réalisation de l'opération (case 11) */
  operation?: InputMaybe<BsdaRevisionRequestOperationInput>;
  /** Expédition reçue à l'installation de destination */
  reception?: InputMaybe<BsdaRevisionRequestReceptionInput>;
};

export type BsdaRevisionRequestEdge = {
  __typename?: 'BsdaRevisionRequestEdge';
  cursor: Scalars['String'];
  node: BsdaRevisionRequest;
};

export type BsdaRevisionRequestEmitter = {
  __typename?: 'BsdaRevisionRequestEmitter';
  /** Informations chantier (si différente de l'adresse de l'entreprise) */
  pickupSite?: Maybe<BsdaPickupSite>;
};

export type BsdaRevisionRequestEmitterInput = {
  /** Informations chantier (si différente de l'adresse de l'entreprise) */
  pickupSite?: InputMaybe<BsdaPickupSiteInput>;
};

export type BsdaRevisionRequestOperation = {
  __typename?: 'BsdaRevisionRequestOperation';
  /** Code D/R */
  code?: Maybe<Scalars['String']>;
  /** Description de l'opération */
  description?: Maybe<Scalars['String']>;
  /** Mode de traitement */
  mode?: Maybe<OperationMode>;
};

export type BsdaRevisionRequestOperationInput = {
  /** Code D/R */
  code?: InputMaybe<Scalars['String']>;
  /** Description de l'opération */
  description?: InputMaybe<Scalars['String']>;
  /** Mode de traitement */
  mode?: InputMaybe<OperationMode>;
};

export type BsdaRevisionRequestReception = {
  __typename?: 'BsdaRevisionRequestReception';
  /** Poids présenté */
  weight?: Maybe<Scalars['Float']>;
};

export type BsdaRevisionRequestReceptionInput = {
  /** Poids présenté */
  weight?: InputMaybe<Scalars['Float']>;
};

export type BsdaRevisionRequestWaste = {
  __typename?: 'BsdaRevisionRequestWaste';
  /** Rubrique Déchet */
  code?: Maybe<Scalars['String']>;
  /** Nom usuel du matériau */
  materialName?: Maybe<Scalars['String']>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: Maybe<Scalars['Boolean']>;
  /** Numéros de scellés */
  sealNumbers?: Maybe<Array<Scalars['String']>>;
};

export type BsdaRevisionRequestWasteInput = {
  /** Rubrique Déchet */
  code?: InputMaybe<Scalars['String']>;
  /** Nom usuel du matériau */
  materialName?: InputMaybe<Scalars['String']>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: InputMaybe<Scalars['Boolean']>;
  /** Numéros de scellés */
  sealNumbers?: InputMaybe<Array<Scalars['String']>>;
};

export type BsdaRevisionRequestWhere = {
  /** Permet de filtrer sur un numéro de bordereau */
  bsdaId?: InputMaybe<StringFilter>;
  /** Permet de filtrer sur un statut de demande de révision */
  status?: InputMaybe<RevisionRequestStatus>;
};

export type BsdaSignatureInput = {
  /** Nom et prénom du signataire */
  author: Scalars['String'];
  /** Date de la signature */
  date?: InputMaybe<Scalars['DateTime']>;
  /** Code de sécurité de l'entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel */
  securityCode?: InputMaybe<Scalars['Int']>;
  /** Type de signature apposé */
  type: BsdaSignatureType;
};

/** Type de signature apposée */
export enum BsdaSignatureType {
  /** Signature émetteur */
  Emission = 'EMISSION',
  /** Signature destination */
  Operation = 'OPERATION',
  /** Signature transporteur */
  Transport = 'TRANSPORT',
  /** Signature entreprise de travaux */
  Work = 'WORK'
}

/** Statut du bordereau */
export enum BsdaStatus {
  /** En attente d'un bordereau suite */
  AwaitingChild = 'AWAITING_CHILD',
  /** Bordereau annulé. L'annulation peut être demandée via le processus de révision */
  Canceled = 'CANCELED',
  /** Bordereau dans son état initial */
  Initial = 'INITIAL',
  /** Traité */
  Processed = 'PROCESSED',
  /** Refusé */
  Refused = 'REFUSED',
  /** Pris en charge par le transporteur */
  Sent = 'SENT',
  /** Signé par le producteur */
  SignedByProducer = 'SIGNED_BY_PRODUCER',
  /** Signé par l'entreprise de travaux */
  SignedByWorker = 'SIGNED_BY_WORKER'
}

/** Filtre sur le statut */
export type BsdaStatusFilter = {
  _eq?: InputMaybe<BsdaStatus>;
  _in?: InputMaybe<Array<BsdaStatus>>;
};

export type BsdaTransport = {
  __typename?: 'BsdaTransport';
  /** Mode de transport */
  mode?: Maybe<TransportMode>;
  /** Plaque(s) d'immatriculation */
  plates?: Maybe<Array<Scalars['String']>>;
  signature?: Maybe<Signature>;
  /** Date de prise en charge */
  takenOverAt?: Maybe<Scalars['DateTime']>;
};

export type BsdaTransportInput = {
  /** Mode de transport */
  mode?: InputMaybe<TransportMode>;
  /** Plaque(s) d'immatriculation - maximum 2 */
  plates?: InputMaybe<Array<Scalars['String']>>;
  /** Date de prise en charge */
  takenOverAt?: InputMaybe<Scalars['DateTime']>;
};

/** Champs possible pour le filtre sur le transport. */
export type BsdaTransportWhere = {
  plates?: InputMaybe<StringNullableListFilter>;
  signature?: InputMaybe<SignatureWhere>;
};

export type BsdaTransporter = {
  __typename?: 'BsdaTransporter';
  /** Coordonnées de l'entreprise de transport */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  /** Récépissé transporteur */
  recepisse?: Maybe<BsdaRecepisse>;
  /** Déclaration générale */
  transport?: Maybe<BsdaTransport>;
};

export type BsdaTransporterInput = {
  /** Entreprise de transport */
  company?: InputMaybe<CompanyInput>;
  /** Champ libre */
  customInfo?: InputMaybe<Scalars['String']>;
  recepisse?: InputMaybe<BsdaRecepisseInput>;
  transport?: InputMaybe<BsdaTransportInput>;
};

/** Champs possible pour le filtre sur le transporteur. */
export type BsdaTransporterWhere = {
  company?: InputMaybe<CompanyWhere>;
  customInfo?: InputMaybe<StringFilter>;
  transport?: InputMaybe<BsdaTransportWhere>;
};

/**
 * 4 types de bordereaux possibles:
 *   - Collecte dans un établissement 2710-1 (déchetterie)
 *   - Autres collectes
 *   - Regroupement
 *   - Ré-expédition
 */
export enum BsdaType {
  /** Collecte en déchèterie relevant de la rubrique 2710-1 */
  Collection_2710 = 'COLLECTION_2710',
  /** Groupement de déchets entreposés sur un site relevant de la rubrique 2718 (ou 2710-1) */
  Gathering = 'GATHERING',
  /** Collecte d'amiante sur un chantier */
  OtherCollections = 'OTHER_COLLECTIONS',
  /** Réexpédition après entreposage provisoire */
  Reshipment = 'RESHIPMENT'
}

export type BsdaWaste = {
  __typename?: 'BsdaWaste';
  /** Mention ADR */
  adr?: Maybe<Scalars['String']>;
  /** Rubrique Déchet */
  code?: Maybe<Scalars['String']>;
  /** Consistence */
  consistence?: Maybe<BsdaConsistence>;
  /** Code famille */
  familyCode?: Maybe<Scalars['String']>;
  /** Nom usuel du matériau */
  materialName?: Maybe<Scalars['String']>;
  /**
   * DEPRECATED - Dénomination usuelle
   * @deprecated Utiliser materialName
   */
  name?: Maybe<Scalars['String']>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: Maybe<Scalars['Boolean']>;
  /** Numéros de scellés */
  sealNumbers?: Maybe<Array<Scalars['String']>>;
};

export type BsdaWasteInput = {
  /** Mention ADR */
  adr?: InputMaybe<Scalars['String']>;
  /** Rubrique Déchet */
  code?: InputMaybe<Scalars['String']>;
  /** Consistence */
  consistence?: InputMaybe<BsdaConsistence>;
  /** Code famille */
  familyCode?: InputMaybe<Scalars['String']>;
  /** Nom usuel du matériau */
  materialName?: InputMaybe<Scalars['String']>;
  /**
   * DEPRECATED - Dénomination usuelle
   * @deprecated Utiliser materialName
   */
  name?: InputMaybe<Scalars['String']>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: InputMaybe<Scalars['Boolean']>;
  /** Numéros de scellés */
  sealNumbers?: InputMaybe<Array<Scalars['String']>>;
};

export type BsdaWeight = {
  __typename?: 'BsdaWeight';
  /** Type de quantité (réelle ou estimée) */
  isEstimate?: Maybe<Scalars['Boolean']>;
  /** Quantité en tonne */
  value?: Maybe<Scalars['Float']>;
};

export type BsdaWeightInput = {
  /** Type de quantité (réelle ou estimé) */
  isEstimate?: InputMaybe<Scalars['Boolean']>;
  /**
   * Poids en tonne.
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  value?: InputMaybe<Scalars['Float']>;
};

/** Filtres possibles pour la récupération de bordereaux. */
export type BsdaWhere = {
  /** ET logique */
  _and?: InputMaybe<Array<BsdaWhere>>;
  /** NON logique */
  _not?: InputMaybe<BsdaWhere>;
  /** OU logique */
  _or?: InputMaybe<Array<BsdaWhere>>;
  /** Filtre sur le champ broker. */
  broker?: InputMaybe<BsdaBrokerWhere>;
  /** Filtre sur la date de création */
  createdAt?: InputMaybe<DateFilter>;
  /** Filtre sur le champ destination. */
  destination?: InputMaybe<BsdaDestinationWhere>;
  /** Filtre sur le champ emitter. */
  emitter?: InputMaybe<BsdaEmitterWhere>;
  /** Filtre sur le champ forwardedIn. */
  forwardedIn?: InputMaybe<IdFilter>;
  /** Filtre sur le champ groupedIn. */
  groupedIn?: InputMaybe<IdFilter>;
  /** Filtre sur l'ID */
  id?: InputMaybe<IdFilter>;
  /** Filtre sur le statut de brouillon. */
  isDraft?: InputMaybe<Scalars['Boolean']>;
  /** Filtre sur le statut */
  status?: InputMaybe<BsdaStatusFilter>;
  /** Filtre sur le champ transporter. */
  transporter?: InputMaybe<BsdaTransporterWhere>;
  /** Filtre sur la date de dernière modification */
  updatedAt?: InputMaybe<DateFilter>;
  /** Filtre sur le champ worker. */
  worker?: InputMaybe<BsdaWorkerWhere>;
};

export type BsdaWork = {
  __typename?: 'BsdaWork';
  /**
   * Indique si l'entreprise de travaux a une signature papier du MOA/détenteur du déchet
   * Remettre une signature papier permet au détenteur de ne pas à avoir à signer sur la plateforme
   */
  hasEmitterPaperSignature?: Maybe<Scalars['Boolean']>;
  signature?: Maybe<Signature>;
};

export type BsdaWorkInput = {
  /**
   * Indique si l'entreprise de travaux a une signature papier du MOA/détenteur du déchet
   * Remettre une signature papier permet au détenteur de ne pas à avoir à signer sur la plateforme
   */
  hasEmitterPaperSignature?: InputMaybe<Scalars['Boolean']>;
};

/** Champs possible pour le filtre sur les travaux. */
export type BsdaWorkWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

export type BsdaWorker = {
  __typename?: 'BsdaWorker';
  /** Informations de certification */
  certification?: Maybe<BsdaWorkerCertification>;
  /** Entreprise de travaux */
  company?: Maybe<FormCompany>;
  /** Indique si une entreprise de travaux est présente sur le BSDA (pour le cas d'un émetteur qui démonte lui même son amiante par ex) */
  isDisabled: Scalars['Boolean'];
  /** Déclaration générale */
  work?: Maybe<BsdaWork>;
};

export type BsdaWorkerCertification = {
  __typename?: 'BsdaWorkerCertification';
  /** Numéro de certification (sous-section 3 uniquement) */
  certificationNumber?: Maybe<Scalars['String']>;
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 4 */
  hasSubSectionFour: Scalars['Boolean'];
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 3 */
  hasSubSectionThree: Scalars['Boolean'];
  /** Organisation qui a décerné la certification (sous-section 3 uniquement) */
  organisation?: Maybe<Scalars['String']>;
  /** Limite de validité de la certification (sous-section 3 uniquement) */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

export type BsdaWorkerCertificationInput = {
  /** Numéro de certification (sous-section 3 uniquement) */
  certificationNumber?: InputMaybe<Scalars['String']>;
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 4 */
  hasSubSectionFour: Scalars['Boolean'];
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 3 */
  hasSubSectionThree: Scalars['Boolean'];
  /**
   * Organisation qui a décerné la certification (sous-section 3 uniquement)
   * Peut prendre uniquement les valeurs suivantes: AFNOR Certification, GLOBAL CERTIFICATION, QUALIBAT
   */
  organisation?: InputMaybe<Scalars['String']>;
  /** Limite de validité de la certification (sous-section 3 uniquement) */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

export type BsdaWorkerInput = {
  /** Informations de certification */
  certification?: InputMaybe<BsdaWorkerCertificationInput>;
  /** Entreprise de travaux */
  company?: InputMaybe<CompanyInput>;
  /** Indique si une entreprise de travaux est présente sur le BSDA (pour le cas d'un émetteur qui démonte lui même son amiante par ex) */
  isDisabled?: InputMaybe<Scalars['Boolean']>;
  /** Déclaration générale */
  work?: InputMaybe<BsdaWorkInput>;
};

/** Champs possible pour le filtre sur l'entreprise de travaux. */
export type BsdaWorkerWhere = {
  company?: InputMaybe<CompanyWhere>;
  work?: InputMaybe<BsdaWorkWhere>;
};

/** Bordereau Bsdasri */
export type Bsdasri = {
  __typename?: 'Bsdasri';
  /**
   * DEPRECATED - renvoie null - usage interne pour les requêtes dashboard
   * @deprecated utiliser le champ `allowBsdasriTakeOverWithoutSignature` dans la réponse de la query `companyInfos` en passant le SIRET de l'émetteur en paramètre
   */
  allowDirectTakeOver?: Maybe<Scalars['Boolean']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  destination?: Maybe<BsdasriDestination>;
  ecoOrganisme?: Maybe<BsdasriEcoOrganisme>;
  emitter?: Maybe<BsdasriEmitter>;
  /** Groupé dans le bordereau par une opération de groupement */
  groupedIn?: Maybe<Bsdasri>;
  /** Bordereaux groupés par une opération de groupement */
  grouping?: Maybe<Array<InitialBsdasri>>;
  id: Scalars['ID'];
  /**
   * Liste des identifiants des conteneurs concernés. Modifiable par tous les acteurs du bsd, ce champ mis
   * à disposition des utilisateurs permet de retrouver aisément des Bsdasris grâce à un identifiant de conteneur
   */
  identification?: Maybe<BsdasriIdentification>;
  isDraft: Scalars['Boolean'];
  metadata: BsdasriMetadata;
  status: BsdasriStatus;
  /** Groupé dans le bordereau par une opération de synthèse */
  synthesizedIn?: Maybe<Bsdasri>;
  /** Bordereaux regroupés par une opération de synthèse */
  synthesizing?: Maybe<Array<InitialBsdasri>>;
  transporter?: Maybe<BsdasriTransporter>;
  type: BsdasriType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  waste?: Maybe<BsdasriWaste>;
};

export type BsdasriAcceptationInput = {
  /** Raison en cas de refus ou refus partiel */
  refusalReason?: InputMaybe<Scalars['String']>;
  /** Poids en kilogrammes de déchets refusé */
  refusedWeight?: InputMaybe<Scalars['Float']>;
  /** Accepté, refusé ou refusé partiellement */
  status?: InputMaybe<WasteAcceptationStatus>;
};

export type BsdasriConnection = {
  __typename?: 'BsdasriConnection';
  edges: Array<BsdasriEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

/**
 * Filtre sur les numéros de containers. Renvoie les Bsdasris dont au moins un des identifiants de containers `identificationNumbers`
 * est présent dans la liste passée en paramètre
 */
export type BsdasriContainersNumbersWhere = {
  numbers?: InputMaybe<StringNullableListFilter>;
};

/** Destination du Bsdasri */
export type BsdasriDestination = {
  __typename?: 'BsdasriDestination';
  /** Installation destinataire */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  operation?: Maybe<BsdasriOperation>;
  reception?: Maybe<BsdasriReception>;
};

export type BsdasriDestinationInput = {
  /** Établissement émetteur */
  company?: InputMaybe<CompanyInput>;
  /** Champ libre transporteur */
  customInfo?: InputMaybe<Scalars['String']>;
  operation?: InputMaybe<BsdasriOperationInput>;
  reception?: InputMaybe<BsdasriReceptionInput>;
};

export type BsdasriDestinationWhere = {
  company?: InputMaybe<CompanyWhere>;
  operation?: InputMaybe<BsdasriOperationWhere>;
  reception?: InputMaybe<BsdasriReceptionWhere>;
};

/** Information sur l'éco-organisme responsable du dasri */
export type BsdasriEcoOrganisme = {
  __typename?: 'BsdasriEcoOrganisme';
  /** Indique si l'enlèvement a été signé par l'éco-organisme en charge du déchet. */
  emittedByEcoOrganisme?: Maybe<Scalars['Boolean']>;
  name: Scalars['String'];
  siret: Scalars['String'];
};

export type BsdasriEcoOrganismeInput = {
  name: Scalars['String'];
  /** SIRET composé de 14 caractères correspondant à un éco-organisme? Seul DASTRI est autorisé à ce jour. */
  siret: Scalars['String'];
};

export type BsdasriEdge = {
  __typename?: 'BsdasriEdge';
  cursor: Scalars['String'];
  node: Bsdasri;
};

/** Informations relatives au déchet émis */
export type BsdasriEmission = {
  __typename?: 'BsdasriEmission';
  /** Signature émetteur avec code de sécurité: PRED ou éco-organisme si ecoOrganisme.emittedByEcoOrganisme vaut true */
  isTakenOverWithSecretCode?: Maybe<Scalars['Boolean']>;
  /** Emporté sans signature PRED avec son autorisation prélalable */
  isTakenOverWithoutEmitterSignature?: Maybe<Scalars['Boolean']>;
  /** Conditionnement */
  packagings?: Maybe<Array<BsdasriPackaging>>;
  signature?: Maybe<BsdasriSignature>;
  /** Volume en litres */
  volume?: Maybe<Scalars['Float']>;
  /** Quantité émise */
  weight?: Maybe<BsdasriWeight>;
};

export type BsdasriEmissionInput = {
  packagings?: InputMaybe<Array<BsdasriPackagingsInput>>;
  /**
   * Poids en kilogrammes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  weight?: InputMaybe<BsdasriWeightInput>;
};

export type BsdasriEmissionWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

/** Émetteur du Bsdasri, Personne responsable de l'émimination des déchets (PRED) */
export type BsdasriEmitter = {
  __typename?: 'BsdasriEmitter';
  /** Établissement émetteur */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  emission?: Maybe<BsdasriEmission>;
  /** Site d'emport du déchet, si différent de celle de l'émetteur */
  pickupSite?: Maybe<PickupSite>;
};

export type BsdasriEmitterInput = {
  company?: InputMaybe<CompanyInput>;
  /** Champ libre émetteur */
  customInfo?: InputMaybe<Scalars['String']>;
  emission?: InputMaybe<BsdasriEmissionInput>;
  pickupSite?: InputMaybe<PickupSiteInput>;
};

export type BsdasriEmitterWhere = {
  company?: InputMaybe<CompanyWhere>;
  emission?: InputMaybe<BsdasriEmissionWhere>;
};

export type BsdasriError = {
  __typename?: 'BsdasriError';
  message: Scalars['String'];
  path: Scalars['String'];
  requiredFor: Array<BsdasriSignatureType>;
};

export type BsdasriIdentification = {
  __typename?: 'BsdasriIdentification';
  numbers?: Maybe<Array<Scalars['String']>>;
};

export type BsdasriIdentificationInput = {
  /** Numéros d'identification des conteneurs concernés */
  numbers?: InputMaybe<Array<Scalars['String']>>;
};

export type BsdasriInput = {
  destination?: InputMaybe<BsdasriDestinationInput>;
  /** Non accepté pour le dasri de synthèse */
  ecoOrganisme?: InputMaybe<BsdasriEcoOrganismeInput>;
  /** Non accepté pour le dasri de synthèse */
  emitter?: InputMaybe<BsdasriEmitterInput>;
  /** Liste des bordereaux que celui-ci groupe dans un bordereau de groupement. Incompatible avec le champ synthesizing. */
  grouping?: InputMaybe<Array<Scalars['ID']>>;
  /**
   * Optionnel: liste d'identifiants des conteneurs concernés. Modifiable par tous les acteurs du bsd, ce champ mis
   * à disposition des utilisateur permet de retrouver aisément des Bsdasris grâce à un identifiant de conteneur (cf. query bsdasris)
   */
  identification?: InputMaybe<BsdasriIdentificationInput>;
  /** Liste des bordereaux que celui-ci groupe dans un bordereau de synthèse.  Incompatible avec le champ grouping. */
  synthesizing?: InputMaybe<Array<Scalars['ID']>>;
  transporter?: InputMaybe<BsdasriTransporterInput>;
  waste?: InputMaybe<BsdasriWasteInput>;
};

export type BsdasriMetadata = {
  __typename?: 'BsdasriMetadata';
  errors: Array<Maybe<BsdasriError>>;
};

/** Informations relatives au traitement du Bsdasri */
export type BsdasriOperation = {
  __typename?: 'BsdasriOperation';
  /** Code de l'opération de traitement - Les codes R12 et D12 sont interdits pour les bsds de synthèse. */
  code?: Maybe<Scalars['String']>;
  /** Date de l'opération de traitement */
  date?: Maybe<Scalars['DateTime']>;
  /** Qualification du traitement final */
  mode?: Maybe<OperationMode>;
  signature?: Maybe<BsdasriSignature>;
  /** Quantité traitée */
  weight?: Maybe<BsdasriOperationWeight>;
};

export type BsdasriOperationInput = {
  /**
   * Code de traitement
   * Les codes R12 et D12 ne sont autorisé que si le destinataire est une installation TTR (tri transit regroupement).
   */
  code?: InputMaybe<Scalars['String']>;
  date?: InputMaybe<Scalars['DateTime']>;
  /** Qualification du traitement final */
  mode?: InputMaybe<OperationMode>;
  /**
   * Poids en kilogrammes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  weight?: InputMaybe<BsdasriRealWeightInput>;
};

/** Informations sur un poids reçu (toujours pesé) */
export type BsdasriOperationWeight = {
  __typename?: 'BsdasriOperationWeight';
  /** Pois en kg (pesé) */
  value: Scalars['Float'];
};

export type BsdasriOperationWhere = {
  code?: InputMaybe<StringFilter>;
  date?: InputMaybe<DateFilter>;
  signature?: InputMaybe<SignatureWhere>;
};

/** Informations sur le conditionnement Bsdasri */
export type BsdasriPackaging = {
  __typename?: 'BsdasriPackaging';
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars['String']>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars['Int'];
  /** Type de conditionnement */
  type: BsdasriPackagingType;
  /** Volume de chaque colis associé à ce conditionnement */
  volume: Scalars['Float'];
};

/** Type de packaging du déchet */
export enum BsdasriPackagingType {
  /** Autre */
  Autre = 'AUTRE',
  /** Caisse en carton avec sac en plastique */
  BoiteCarton = 'BOITE_CARTON',
  /** Boîtes et Mini-collecteurs pour déchets perforants */
  BoitePerforants = 'BOITE_PERFORANTS',
  /** Fûts ou jerrican à usage unique */
  Fut = 'FUT',
  /** Grand emballage */
  GrandEmballage = 'GRAND_EMBALLAGE',
  /** Grand récipient pour vrac */
  Grv = 'GRV'
}

export type BsdasriPackagingsInput = {
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: InputMaybe<Scalars['String']>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars['Int'];
  /** Type de conditionnement */
  type: BsdasriPackagingType;
  /** Volume de chaque colis associé à ce conditionnement */
  volume: Scalars['Float'];
};

export type BsdasriRealWeightInput = {
  /**
   * Poids en kilogrammes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  value: Scalars['Float'];
};

export type BsdasriRecepisse = {
  __typename?: 'BsdasriRecepisse';
  /** Département */
  department?: Maybe<Scalars['String']>;
  /** Exemption de récépissé */
  isExempted?: Maybe<Scalars['Boolean']>;
  /** Numéro de récépissé */
  number?: Maybe<Scalars['String']>;
  /** Date limite de validité */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

export type BsdasriRecepisseInput = {
  /**
   * Département
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  department?: InputMaybe<Scalars['String']>;
  /** Exemption de récépissé */
  isExempted?: InputMaybe<Scalars['Boolean']>;
  /**
   * Numéro de récépissé
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  number?: InputMaybe<Scalars['String']>;
  /**
   * Date limite de validité
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Informations relatives à la réception du Bsdasri */
export type BsdasriReception = {
  __typename?: 'BsdasriReception';
  acceptation?: Maybe<BsdasriWasteAcceptation>;
  /** Date de réception du déchet */
  date?: Maybe<Scalars['DateTime']>;
  /** Conditionnement */
  packagings?: Maybe<Array<BsdasriPackaging>>;
  signature?: Maybe<BsdasriSignature>;
  /** Volume reçu */
  volume?: Maybe<Scalars['Float']>;
};

export type BsdasriReceptionInput = {
  acceptation?: InputMaybe<BsdasriAcceptationInput>;
  date?: InputMaybe<Scalars['DateTime']>;
  packagings?: InputMaybe<Array<BsdasriPackagingsInput>>;
  volume?: InputMaybe<Scalars['Int']>;
};

export type BsdasriReceptionWhere = {
  date?: InputMaybe<DateFilter>;
  signature?: InputMaybe<SignatureWhere>;
};

export enum BsdasriRole {
  /** Les Bsdasri dont je suis l'émetteur */
  Emitter = 'EMITTER',
  /** Les Bsdasri dont je suis la destination de traitement */
  Recipient = 'RECIPIENT',
  /** Les Bsdasri dont je suis transporteur */
  Transporter = 'TRANSPORTER'
}

export type BsdasriSignature = {
  __typename?: 'BsdasriSignature';
  author?: Maybe<Scalars['String']>;
  date?: Maybe<Scalars['DateTime']>;
};

export type BsdasriSignatureInput = {
  /** Nom et prénom du signataire */
  author: Scalars['String'];
  /** Date de la signature */
  date?: InputMaybe<Scalars['DateTime']>;
  /** Type de signature apposée */
  type: BsdasriSignatureType;
};

export enum BsdasriSignatureType {
  /** Signature du cadre émetteur (PRED) */
  Emission = 'EMISSION',
  /** Signature du traitement du déchet */
  Operation = 'OPERATION',
  /** Signature de la réception du déchet */
  Reception = 'RECEPTION',
  /** Signature du cadre collecteur transporteur */
  Transport = 'TRANSPORT'
}

export type BsdasriSignatureWithSecretCodeInput = {
  /** Nom et prénom du signataire */
  author: Scalars['String'];
  /** Code de sécurité de l'entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel */
  securityCode: Scalars['Int'];
  /** Dénomination de l'auteur de la signature, par défaut il s'agit de l'émetteur */
  signatureAuthor?: InputMaybe<SignatureAuthor>;
};

export enum BsdasriStatus {
  /** En attente de groupement */
  AwaitingGroup = 'AWAITING_GROUP',
  /** Bsdasri dans son état initial */
  Initial = 'INITIAL',
  /** Bsdasri dont les déchets ont été traités */
  Processed = 'PROCESSED',
  /** Bsdasri reçu par l'établissement de destination */
  Received = 'RECEIVED',
  /** Déchet refusé */
  Refused = 'REFUSED',
  /** Bsdasri envoyé vers l'établissement de destination */
  Sent = 'SENT',
  /** Optionnel, Bsdasri signé par la PRED (émetteur) */
  SignedByProducer = 'SIGNED_BY_PRODUCER'
}

/** Filtre sur le statut */
export type BsdasriStatusFilter = {
  _eq?: InputMaybe<BsdasriStatus>;
  _in?: InputMaybe<Array<BsdasriStatus>>;
};

/** Informations relatives au transport du Bsdasri */
export type BsdasriTransport = {
  __typename?: 'BsdasriTransport';
  acceptation?: Maybe<BsdasriWasteAcceptation>;
  handedOverAt?: Maybe<Scalars['DateTime']>;
  mode: TransportMode;
  /** Conditionnement */
  packagings?: Maybe<Array<BsdasriPackaging>>;
  /** Plaque(s) d'immatriculation */
  plates?: Maybe<Array<Scalars['String']>>;
  signature?: Maybe<BsdasriSignature>;
  takenOverAt?: Maybe<Scalars['DateTime']>;
  /** Volume transporté */
  volume?: Maybe<Scalars['Float']>;
  /** Quantité transportée */
  weight?: Maybe<BsdasriWeight>;
};

export type BsdasriTransportInput = {
  /** Mode de transport */
  acceptation?: InputMaybe<BsdasriAcceptationInput>;
  handedOverAt?: InputMaybe<Scalars['DateTime']>;
  mode?: InputMaybe<TransportMode>;
  packagings?: InputMaybe<Array<BsdasriPackagingsInput>>;
  /** Plaque(s) d'immatriculation - maximum 2 */
  plates?: InputMaybe<Array<Scalars['String']>>;
  takenOverAt?: InputMaybe<Scalars['DateTime']>;
  /**
   * Poids en kilogrammes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  weight?: InputMaybe<BsdasriWeightInput>;
};

export type BsdasriTransportWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

/** Collecteur transporteur */
export type BsdasriTransporter = {
  __typename?: 'BsdasriTransporter';
  /** Établissement transporteur */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  /** Récépissé */
  recepisse?: Maybe<BsdasriRecepisse>;
  transport?: Maybe<BsdasriTransport>;
};

export type BsdasriTransporterInput = {
  /** Établissement collecteur - transporteur */
  company?: InputMaybe<CompanyInput>;
  /** Champ libre transporteur */
  customInfo?: InputMaybe<Scalars['String']>;
  /** Récépissé transporteur */
  recepisse?: InputMaybe<BsdasriRecepisseInput>;
  transport?: InputMaybe<BsdasriTransportInput>;
};

export type BsdasriTransporterWhere = {
  company?: InputMaybe<CompanyWhere>;
  transport?: InputMaybe<BsdasriTransportWhere>;
};

export enum BsdasriType {
  /** Bordereau dasri de groupement */
  Grouping = 'GROUPING',
  /** Bordereau dasri simple */
  Simple = 'SIMPLE',
  /** Bordereau dasri de synthèse */
  Synthesis = 'SYNTHESIS'
}

/** Filtre sur le type de BSDASRI */
export type BsdasriTypeFilter = {
  _eq?: InputMaybe<BsdasriType>;
  _in?: InputMaybe<Array<BsdasriType>>;
};

/** Informations relatives au déchet */
export type BsdasriWaste = {
  __typename?: 'BsdasriWaste';
  /** Code adr */
  adr?: Maybe<Scalars['String']>;
  /** Code déchet */
  code?: Maybe<Scalars['String']>;
};

/** Informations relatives à l'acceptation ou au refus du déchet (Bsdasri) */
export type BsdasriWasteAcceptation = {
  __typename?: 'BsdasriWasteAcceptation';
  refusalReason?: Maybe<Scalars['String']>;
  /** Poids refusé en kilogrammes */
  refusedWeight?: Maybe<Scalars['Float']>;
  status?: Maybe<WasteAcceptationStatus>;
};

export type BsdasriWasteInput = {
  adr?: InputMaybe<Scalars['String']>;
  code?: InputMaybe<Scalars['String']>;
};

/** Informations sur un poids de déchet estimé ou pesé */
export type BsdasriWeight = {
  __typename?: 'BsdasriWeight';
  /** Le poids est-il estimé (pesé si false) */
  isEstimate: Scalars['Boolean'];
  /** Poids en kg, pesé ou estimé */
  value: Scalars['Float'];
};

export type BsdasriWeightInput = {
  /** Le poids est il une estimation */
  isEstimate?: InputMaybe<Scalars['Boolean']>;
  /**
   * Poids en kilogrammes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  value?: InputMaybe<Scalars['Float']>;
};

/** Filtres possibles pour la récupération de bordereaux. */
export type BsdasriWhere = {
  _and?: InputMaybe<Array<BsdasriWhere>>;
  _not?: InputMaybe<BsdasriWhere>;
  _or?: InputMaybe<Array<BsdasriWhere>>;
  createdAt?: InputMaybe<DateFilter>;
  destination?: InputMaybe<BsdasriDestinationWhere>;
  emitter?: InputMaybe<BsdasriEmitterWhere>;
  /**
   * (Optionnel) Filtre sur l'état de regroupement des bordereaux
   * Si aucun filtre n'est passé, les bordereaux seront retournés sans filtrage supplémentaire
   * Si groupable: true, les bordereaux retournés:
   *   - ne regroupent pas d'autres bordereaux (groupement ou synthèse)
   *   - ne sont pas associés à un bordereau de synthèse ou de groupement
   * Si groupable: false les bordereaux retournés:
   *   - sont déjà associés à un bordereau de synthèse ou de groupement
   *   - ou regroupent d'autres bordereaux (groupement ou synthèse)
   */
  groupable?: InputMaybe<Scalars['Boolean']>;
  /** Filtre le résultat sur l'ID des bordereaux */
  id?: InputMaybe<IdFilter>;
  identification?: InputMaybe<BsdasriContainersNumbersWhere>;
  /** (Optionnel) Permet de récupérer uniquement les bordereaux en brouillon */
  isDraft?: InputMaybe<Scalars['Boolean']>;
  /**
   * (Optionnel) Filtre sur le statut des bordereaux
   * Si aucun filtre n'est passé, les bordereaux seront retournés quel que soit leur statut
   * Défaut à vide.
   */
  status?: InputMaybe<BsdasriStatusFilter>;
  transporter?: InputMaybe<BsdasriTransporterWhere>;
  /** (Optionnel) Filtre sur le type de BSDASRI */
  type?: InputMaybe<BsdasriTypeFilter>;
  updatedAt?: InputMaybe<DateFilter>;
};

export type Bsff = {
  __typename?: 'Bsff';
  /** Date de création */
  createdAt: Scalars['DateTime'];
  /**
   * Destination du déchet, qui peut le réceptionner pour traitement, groupement, reconditionnement ou réexpedition.
   * Un nouveau bordereau doit être créé si le déchet connaît un nouveau parcours, par exemple s'il quitte une installation de collecte pour un centre de traitement.
   *
   * Pour plus de détails sur les différents types de bordereau, voir l'enum BsffType.
   */
  destination?: Maybe<BsffDestination>;
  /**
   * Émetteur du déchet. En fonction de la valeur du champ `type` il peut s'agir :
   * - d'un opérateur qui collecte des déchets dangereux de fluides frigorigènes (ou autres déchets dangereux de fluides) lors d'opérations sur
   * les équipements en contenant de ses clients
   * - d'un autre détenteur de déchet.
   * - d'une installation de tri, transit, regroupement lors d'une réexpédition, reconditionnement ou groupement.
   */
  emitter?: Maybe<BsffEmitter>;
  /**
   * Liste des fiches d'intervention associés à ce bordereau.
   * Habituellement renseigné par un opérateur lors de son intervention.
   */
  ficheInterventions: Array<BsffFicheIntervention>;
  forwarding: Array<BsffPackaging>;
  grouping: Array<BsffPackaging>;
  /**
   * Identifiant unique assigné par Trackdéchets.
   * Il est à utiliser pour les échanges avec l'API.
   */
  id: Scalars['ID'];
  /**
   * Si ce BSFF est à l'état de brouillon ou pas.
   *
   * Il y a principalement deux différences entre un brouillon et un BSFF publié :
   * - Il n'y a pas de champs requis sur un brouillon, là où il faut un minimum d'informations pour créer un BSFF publié.
   * - L'état de brouillon peut permettre de distinguer un BSFF prêt à circuler d'un BSFF encore en préparation.
   * Par exemple, sur l'interface Trackdéchets les brouillons sont dans l'onglet "Brouillons" et non pas "Pour action" ou "À collecter".
   */
  isDraft: Scalars['Boolean'];
  /**
   * Liste des contenants utilisés pour le transport des déchets de fluides et
   * informations à propos de l'acceptation et du traitement.
   */
  packagings: Array<BsffPackaging>;
  repackaging: Array<BsffPackaging>;
  /** Statut qui synthétise où en est le déchet dans son cheminement, voir l'enum pour plus de détails. */
  status: BsffStatus;
  /**
   * Transporteur du déchet, effectue l'enlèvement du déchet auprès de l'émetteur et l'emporte à la destination.
   *
   * À noter que l'émetteur peut également être transporteur, par exemple dans le cas de l'opérateur qui dépose lui même ses contenants auprès d'une installation de collecte.
   * Dans ce cas il nous faut quand même savoir qui a effectué le transport, et indiquer l'opérateur à la fois en tant qu'émetteur et transporteur.
   */
  transporter?: Maybe<BsffTransporter>;
  /** Type de BSFF, voir l'enum pour plus de détails. */
  type: BsffType;
  /** Date de dernière modification */
  updatedAt: Scalars['DateTime'];
  /** Détails du déchet. */
  waste?: Maybe<BsffWaste>;
  /** Quantité totale du déchet en kilogrammes, il peut s'agir d'une estimation. */
  weight?: Maybe<BsffWeight>;
};

export type BsffAcceptationInput = {
  /** En cas de refus, la raison */
  refusalReason?: InputMaybe<Scalars['String']>;
  /** Accepté ou refusé */
  status: WasteAcceptationStatus;
};

export type BsffConnection = {
  __typename?: 'BsffConnection';
  edges: Array<BsffEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type BsffDestination = {
  __typename?: 'BsffDestination';
  /** Numéro de CAP. */
  cap?: Maybe<Scalars['String']>;
  /** Entreprise réceptionant le déchet. */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  /** Opération de traitement prévu initialement. */
  plannedOperationCode?: Maybe<BsffOperationCode>;
  /** Déclaration de réception du déchet. */
  reception?: Maybe<BsffReception>;
};

export type BsffDestinationInput = {
  /** Le cas échéant, numéro de certificat d'acceptation préalable des déchets. */
  cap?: InputMaybe<Scalars['String']>;
  company?: InputMaybe<CompanyInput>;
  /** Champ libre */
  customInfo?: InputMaybe<Scalars['String']>;
  /** Code de l'opération d'élimination ou valorisation prévue selon les annexes I et II de la directive 2008/98/CE relative aux déchets susvisée. */
  plannedOperationCode?: InputMaybe<BsffOperationCode>;
  /** Informations concernant la réception du déchet */
  reception?: InputMaybe<BsffDestinationReceptionInput>;
};

export type BsffDestinationReceptionInput = {
  date: Scalars['DateTime'];
};

/** Champs possible pour le filtre sur la destination. */
export type BsffDestinationWhere = {
  company?: InputMaybe<CompanyWhere>;
};

/** Informations sur le détenteur d'un équipement */
export type BsffDetenteur = {
  __typename?: 'BsffDetenteur';
  /** Informations sur l'entreprise détentrice (ou sur le particulier lorsque isPrivateIndividual=true) */
  company?: Maybe<FormCompany>;
  /**
   * Indique si le détenteur est un particulier ou une entreprise.
   * Dans le cas où le détenteur est un particulier, seul les champs `name`,
   * `address`, `mail` et `phone` de l'objet `company` sont renseignés.
   */
  isPrivateIndividual?: Maybe<Scalars['Boolean']>;
};

/**
 * Informations sur le détenteur d'un équipement. Il faut renseigner soit `company`
 * dans le cas d'une entreprise, soit `privateIndividual` dans le cas d'une personne physique
 */
export type BsffDetenteurInput = {
  /** Informations sur l'entreprise détentrice (ou sur le particulier lorsque isPrivateIndividual=true) */
  company?: InputMaybe<CompanyInput>;
  /**
   * Indique si le détenteur est un particulier ou une entreprise.
   * Dans le cas où le détenteur est un particulier, seuls les champs `name` et
   * `address` de l'objet `company` sont requis. La valeur par défaut de `isPrivateIndividual`
   * est `false`.
   */
  isPrivateIndividual?: InputMaybe<Scalars['Boolean']>;
};

/** Champs possibles pour le filtre sur le détenteur du fluide */
export type BsffDetenteurWhere = {
  company?: InputMaybe<CompanyWhere>;
};

export type BsffEdge = {
  __typename?: 'BsffEdge';
  cursor: Scalars['String'];
  node: Bsff;
};

export type BsffEmission = {
  __typename?: 'BsffEmission';
  /** Signature de l'émetteur lors de l'enlèvement par le transporteur. */
  signature?: Maybe<Signature>;
};

/** Champs possibles pour le filtre sur l'émission */
export type BsffEmissionWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

export type BsffEmitter = {
  __typename?: 'BsffEmitter';
  /** Entreprise émettant le déchet. */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  /** Déclaration de l'émetteur lors de l'enlèvement par le transporteur. */
  emission?: Maybe<BsffEmission>;
};

export type BsffEmitterInput = {
  company?: InputMaybe<CompanyInput>;
  /** Champ libre */
  customInfo?: InputMaybe<Scalars['String']>;
};

/** Champs possible pour le filtre sur l'émetteur. */
export type BsffEmitterWhere = {
  company?: InputMaybe<CompanyWhere>;
  emission?: InputMaybe<BsffEmissionWhere>;
};

export type BsffFicheIntervention = {
  __typename?: 'BsffFicheIntervention';
  /** Détenteur de l'équipement sur lequel est intervenu l'opérateur. */
  detenteur?: Maybe<BsffDetenteur>;
  /** Identifiant unique de la fiche d'intervention. */
  id: Scalars['ID'];
  /** Numéro de la fiche d'intervention, habituellement renseigné par l'opérateur. */
  numero: Scalars['String'];
  /** Opérateur à l'origine de l'intervention. */
  operateur?: Maybe<BsffOperateur>;
  /** Code postal du lieu où l'intervention a eu lieu. */
  postalCode: Scalars['String'];
  /** Poids total en kilogrammes des fluides récupérés lors de cette intervention. */
  weight: Scalars['Float'];
};

export type BsffFicheInterventionInput = {
  /** Informations concernnt le détenteur de l'équipement */
  detenteur: BsffDetenteurInput;
  /** Numéro de la fiche d'intervention mentionnée à l'article R. 543-82 du code de l'environnement */
  numero: Scalars['String'];
  /** Informations concernant l'opérateur */
  operateur: BsffOperateurInput;
  /** Le code postal du lieu de collecte */
  postalCode: Scalars['String'];
  /** La quantité totale réelle ou estimée exprimée en kilogramme */
  weight: Scalars['Float'];
};

/** Champs possibles pour le filtre sur les fiches d'intervention */
export type BsffFicheInterventionWhere = {
  /** Filtre sur le détenteur du fluide */
  detenteur?: InputMaybe<BsffDetenteurWhere>;
  /** Filtre sur le numero de fiche d'intervention */
  numero?: InputMaybe<StringFilter>;
};

export type BsffInput = {
  /** Installation de traitement ou de tri transit regroupement. L'installation visée doit être insscrite sur Trackdéchets avec un profil idoine */
  destination?: InputMaybe<BsffDestinationInput>;
  /**
   * Émetteur du déchet. En fonction de la valeur du champ `type` il peut s'agir :
   * - d'un opérateur qui collecte des déchets dangereux de fluides frigorigènes (ou autres déchets dangereux de fluides) lors d'opérations sur
   * les équipements en contenant de ses clients
   * - d'un autre détenteur de déchet.
   * - d'une installation de tri, transit, regroupement lors d'une réexpédition, reconditionnement ou groupement.
   */
  emitter?: InputMaybe<BsffEmitterInput>;
  /**
   * Identifiants des fiches d'intervention permettant d'identifier le ou les détenteurs initiaux des équipements.
   * Peut être défini uniquement lorsque Bsff.type=COLLECTE_PETITES_QUANTITES. Les fiches d'intervention peuvent être
   * créees via la mutation `createFicheInterventionBsff`.
   */
  ficheInterventions?: InputMaybe<Array<Scalars['ID']>>;
  /** Identifiant des contenant réexpédié dans ce BSFF. La liste de contenants doit faire partie du même BSFF */
  forwarding?: InputMaybe<Array<Scalars['ID']>>;
  /** Identifiant des contenants regroupés dans ce BSFF */
  grouping?: InputMaybe<Array<Scalars['ID']>>;
  /**
   * Liste des contenants utilisés pour le transport des déchets de fluides.
   * Ne pas renseigner ce champ en cas de groupement ou de réexpédition car les
   * informations de contenants du nouveau BSFF sont déduites automatiquement à
   * partir des informations des BSFFs initiaux
   */
  packagings?: InputMaybe<Array<BsffPackagingInput>>;
  /** Identifiant des contenant reconditionné dans ce BSFF */
  repackaging?: InputMaybe<Array<Scalars['ID']>>;
  /** Informations sur le trasnporteur du déchet. L'entreprise visée doit être inscrite sur Trackdéchets avec le profil transporteur */
  transporter?: InputMaybe<BsffTransporterInput>;
  /** Type de BSFF, voir l'enum pour plus de détails. - */
  type?: InputMaybe<BsffType>;
  /** Détails du déchet */
  waste?: InputMaybe<BsffWasteInput>;
  /** Quantité */
  weight?: InputMaybe<BsffWeightInput>;
};

export type BsffOperateur = {
  __typename?: 'BsffOperateur';
  /** Entreprise dont l'opérateur fait partie. */
  company: FormCompany;
};

export type BsffOperateurInput = {
  company: CompanyInput;
};

/** Liste des codes de traitement possible. */
export enum BsffOperationCode {
  /** Incinération à terre */
  D10 = 'D10',
  /** Regroupement préalablement à l'une des opérations numérotées D1 à D12 */
  D13 = 'D13',
  /** Reconditionnement préalablement à l’une des opérations numérotées D1 à D13 */
  D14 = 'D14',
  /** Stockage préalablement à l’une des opérations D1 à D14 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production). */
  D15 = 'D15',
  /** Utilisation principale comme combustible ou autre moyen de produire de l'énergie */
  R1 = 'R1',
  /** Récupération ou régénération des solvants */
  R2 = 'R2',
  /** Recyclage ou récupération des substances organiques qui ne sont pas utilisées comme solvants (y compris les opérations de compostage et autres transformations biologiques) */
  R3 = 'R3',
  /** Recyclage ou récupération d’autres matières inorganiques */
  R5 = 'R5',
  /** Échange de déchets en vue de les soumettre à l'une des opérations numérotées R1 à R11 */
  R12 = 'R12',
  /** Stockage de déchets préalablement à l’une des opérations R1 à R12 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production). */
  R13 = 'R13'
}

/** Filtre sur l'opération de traitement effectuée */
export type BsffOperationCodeFilter = {
  _eq?: InputMaybe<BsffOperationCode>;
  _in?: InputMaybe<Array<BsffOperationCode>>;
};

export type BsffPackaging = {
  __typename?: 'BsffPackaging';
  /** Informations sur l'acceptation ou le refus du contenant */
  acceptation?: Maybe<BsffPackagingAcceptation>;
  /** BSFF qui trace ce contenant */
  bsff: Bsff;
  /** Identifiant du BSFF auquel est rattaché ce contenant */
  bsffId: Scalars['ID'];
  /**
   * Identifiant unique correspondant à un contenant sur BSFF en particulier.
   * Un même contenant physique (identifié par un numéro) aura des identifiants différents
   * sur chaque BSFF sur lequel il apparait (en cas de transit ou groupement).
   */
  id: Scalars['ID'];
  /**
   * DEPRECATED - Dénomination du contenant.
   * @deprecated Utiliser `type`
   */
  name?: Maybe<Scalars['String']>;
  /** BSFF faisant immédiatement suite au BSFF traçant ce contenant. */
  nextBsff?: Maybe<Bsff>;
  /** Liste de tous les BSFFs suivants */
  nextBsffs: Array<Bsff>;
  /** Numéro du contenant. */
  numero: Scalars['String'];
  /** Informations sur le traitement effectué par contenant */
  operation?: Maybe<BsffPackagingOperation>;
  /** Précision sur le type de contenant lorsque type=AUTRE */
  other?: Maybe<Scalars['String']>;
  /** Liste de tous les BSFF précédents */
  previousBsffs: Array<InitialBsff>;
  /** Type de contenant : bouteille, ou autre à préciser ; */
  type: BsffPackagingType;
  /** Volume du contenant. */
  volume?: Maybe<Scalars['Float']>;
  /** Poids en kilogrammes. */
  weight: Scalars['Float'];
};

export type BsffPackagingAcceptation = {
  __typename?: 'BsffPackagingAcceptation';
  /** Date de l'acceptation ou du refus */
  date?: Maybe<Scalars['DateTime']>;
  /** En cas de refus, la raison */
  refusalReason?: Maybe<Scalars['String']>;
  /** Signature de la destination lors de l'acceptation ou du refus du déchet. */
  signature?: Maybe<Signature>;
  /** Accepté ou refusé */
  status?: Maybe<WasteAcceptationStatus>;
  /** Code déchet après analyse */
  wasteCode?: Maybe<Scalars['String']>;
  /** Dénomination usuelle du déchet après analyse */
  wasteDescription?: Maybe<Scalars['String']>;
  /** Poids du contenant. Doit être à 0 dans le cas d'un refus */
  weight?: Maybe<Scalars['Float']>;
};

export type BsffPackagingAcceptationInput = {
  /** Date de la réception */
  date: Scalars['DateTime'];
  /** En cas de refus, la raison */
  refusalReason?: InputMaybe<Scalars['String']>;
  /** Accepté ou refusé */
  status: WasteAcceptationStatus;
  /** Code déchet après une éventuelle analyse. Si omis, c'est le code déchet du BSFF qui s'applique. */
  wasteCode?: InputMaybe<Scalars['String']>;
  /** Dénomination usuelle du déchet après une éventuelle analyse. */
  wasteDescription?: InputMaybe<Scalars['String']>;
  /** Poids du contenant. Doit être à 0 dans le cas d'un refus */
  weight: Scalars['Float'];
};

/** Champs possibles pour le filtre sur la réception d'un contenant */
export type BsffPackagingAcceptationWhere = {
  signature?: InputMaybe<SignatureWhere>;
  wasteCode?: InputMaybe<StringFilter>;
};

export type BsffPackagingConnection = {
  __typename?: 'BsffPackagingConnection';
  edges: Array<BsffPackagingEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type BsffPackagingEdge = {
  __typename?: 'BsffPackagingEdge';
  cursor: Scalars['String'];
  node: BsffPackaging;
};

/** Permet de renseigner les informations d'un contenant par l'émetteur du BSFF */
export type BsffPackagingInput = {
  /**
   * DEPRECATED - Dénomination du contenant.
   * @deprecated Utiliser `type`
   */
  name?: InputMaybe<Scalars['String']>;
  /** Numéro du contenant. */
  numero: Scalars['String'];
  /** Précision sur le type de contenant lorsque type=AUTRE */
  other?: InputMaybe<Scalars['String']>;
  /** Type de contenant : bouteille, ou autre à préciser ; */
  type?: InputMaybe<BsffPackagingType>;
  /** Volume du contenant. */
  volume?: InputMaybe<Scalars['Float']>;
  /** Poids en kilogrammes */
  weight: Scalars['Float'];
};

export type BsffPackagingNextDestination = {
  __typename?: 'BsffPackagingNextDestination';
  /** Numéro de certificat d'acceptation préalable des déchets ; */
  cap?: Maybe<Scalars['String']>;
  /** Entreprise qui va réceptionner le déchet par la suite. */
  company?: Maybe<FormCompany>;
  /** Code de l'opération d'élimination ou valorisation prévue  */
  plannedOperationCode?: Maybe<BsffOperationCode>;
};

export type BsffPackagingNextDestinationInput = {
  cap?: InputMaybe<Scalars['String']>;
  company?: InputMaybe<CompanyInput>;
  plannedOperationCode?: InputMaybe<BsffOperationCode>;
};

export type BsffPackagingOperation = {
  __typename?: 'BsffPackagingOperation';
  /** Code de l'opération de traitement. */
  code?: Maybe<BsffOperationCode>;
  /** Date de l'opération */
  date?: Maybe<Scalars['DateTime']>;
  /** Description de l'opération réalisée */
  description?: Maybe<Scalars['String']>;
  /** Qualification du traitement final */
  mode?: Maybe<OperationMode>;
  /** Destination ultérieure prévue, dans le cas d'un envoi vers l'étranger. */
  nextDestination?: Maybe<BsffPackagingNextDestination>;
  /** Rupture de traçabilité autorisée par arrêté préfectoral */
  noTraceability?: Maybe<Scalars['Boolean']>;
  /** Signature de la destination lors du traitement. */
  signature?: Maybe<Signature>;
};

export type BsffPackagingOperationInput = {
  /** Code de l'opération de traitement. */
  code: BsffOperationCode;
  /** Date de l'opération */
  date: Scalars['DateTime'];
  /** Description de l'opération réaliséee */
  description: Scalars['String'];
  /** Qualification du traitement final */
  mode?: InputMaybe<OperationMode>;
  /** Destination ultérieure prévue, dans le cas d'un envoi vers l'étranger. */
  nextDestination?: InputMaybe<BsffPackagingNextDestinationInput>;
  /** Rupture de traçabilité autorisée par arrêté préfectoral */
  noTraceability?: InputMaybe<Scalars['Boolean']>;
};

/** Champs possible pour le filtre sur l'opération sur un contenant */
export type BsffPackagingOperationWhere = {
  code?: InputMaybe<BsffOperationCodeFilter>;
  noTraceability?: InputMaybe<Scalars['Boolean']>;
  signature?: InputMaybe<SignatureWhere>;
};

/** Représente les différents types de contenants possibles */
export enum BsffPackagingType {
  /** Autre, à préciser via le paramètre `other` */
  Autre = 'AUTRE',
  /** Bouteille de récupération, de transfert, etc */
  Bouteille = 'BOUTEILLE',
  /** Citerne */
  Citerne = 'CITERNE',
  /** Conteneur de récupération, de transfert, etc */
  Conteneur = 'CONTENEUR'
}

/** Filtres possibles sur la récupération de contenants */
export type BsffPackagingWhere = {
  /** ET logique */
  _and?: InputMaybe<Array<BsffPackagingWhere>>;
  /** NON logique */
  _not?: InputMaybe<BsffPackagingWhere>;
  /** OU logique */
  _or?: InputMaybe<Array<BsffPackagingWhere>>;
  /** Filtre possible sur l'acceptation des contenants */
  acceptation?: InputMaybe<BsffPackagingAcceptationWhere>;
  /** Filtre possible sur les bsffs */
  bsff?: InputMaybe<BsffWhere>;
  /** Filtre sur l'ID */
  id?: InputMaybe<IdFilter>;
  /** Filtre possible sur le BSFF suivant (le cas échéant) */
  nextBsff?: InputMaybe<BsffWhere>;
  /** Filtre sur le numéro de contenant */
  numero?: InputMaybe<StringFilter>;
  /** Filtre possible sur l'opération effectuée */
  operation?: InputMaybe<BsffPackagingOperationWhere>;
};

export type BsffPackagingsWhere = {
  bsff?: InputMaybe<BsffWhere>;
  numero?: InputMaybe<StringFilter>;
};

export type BsffReception = {
  __typename?: 'BsffReception';
  /** Date de réception du déchet. */
  date?: Maybe<Scalars['DateTime']>;
  /** Signature de la destination lors de l'acceptation ou du refus du déchet. */
  signature?: Maybe<Signature>;
};

export type BsffSignatureInput = {
  /** Nom et prénom du signataire */
  author: Scalars['String'];
  /** Date de la signature */
  date?: InputMaybe<Scalars['DateTime']>;
  /**
   * Identifiant du packaging en cas de signature pour une acceptation ou un traitement
   * Si omis, permet de signer l'acceptation ou le traitement pour l'ensemble des contenants.
   */
  packagingId?: InputMaybe<Scalars['ID']>;
  /**
   * Code de signature de l'auteur de la signature.
   *
   * Ce paramètre est optionnel, il n'est utile que dans le cas où vous souhaitez signer pour un tiers sans moyen de vous authentifier à sa place.
   * Ce tiers peut alors saisir son code de signature dans votre outil.
   */
  securityCode?: InputMaybe<Scalars['Int']>;
  /** Type de signature apposée */
  type: BsffSignatureType;
};

/** Liste des différentes signatures possibles. */
export enum BsffSignatureType {
  /** Signature de la destination, lors de l'acceptation */
  Acceptation = 'ACCEPTATION',
  /** Signature de l'émetteur, avant enlèvement. */
  Emission = 'EMISSION',
  /** Signature de la destination, lors du traitement. */
  Operation = 'OPERATION',
  /** Signature de la destination, lors de la réception. */
  Reception = 'RECEPTION',
  /** Signature du transporteur, lors de l'enlèvement. */
  Transport = 'TRANSPORT'
}

/** Statut qui résume là où en est le BSFF dans son parcours. */
export enum BsffStatus {
  /** Tous les contenants du BSFF ont été acceptés et sont en attente de traitement. */
  Accepted = 'ACCEPTED',
  /** Statut initial à la création d'un BSFF. Le BSFF ne comporte aucune signature. */
  Initial = 'INITIAL',
  /**
   * Une partie des contenants acceptés présents sur le BSFF ont subi un groupement, reconditionnement ou un entreposage provisoire
   * et sont attente d'un traitement final (régénération ou destruction). Les autres contenants acceptés
   * ont subi un traitement final.
   */
  IntermediatelyProcessed = 'INTERMEDIATELY_PROCESSED',
  /** Une partie des contenants a été refusée, l'autre partie acceptée. Les contenants acceptés n'ont pas encore été traités. */
  PartiallyRefused = 'PARTIALLY_REFUSED',
  /** Tous les fluides des contenants acceptés présents sur le BSFF ont subi un traitement final (régénération ou destruction) */
  Processed = 'PROCESSED',
  /**
   * Le BSFF a été réceptionné par l'installation de destination. Les contenants sont en attente d'acceptation
   * ou de refus.
   */
  Received = 'RECEIVED',
  /** Tous les contenants du BSFF ont été refusés. */
  Refused = 'REFUSED',
  /** Le BSFF a été signé par le transporteur. */
  Sent = 'SENT',
  /** Le BSFF a été signé par l'émetteur. */
  SignedByEmitter = 'SIGNED_BY_EMITTER'
}

/** Filtre sur le statut */
export type BsffStatusFilter = {
  _eq?: InputMaybe<BsffStatus>;
  _in?: InputMaybe<Array<BsffStatus>>;
};

export type BsffTransport = {
  __typename?: 'BsffTransport';
  /** Mode de transport utilisé. */
  mode?: Maybe<TransportMode>;
  /** Plaque(s) d'immatriculation */
  plates?: Maybe<Array<Scalars['String']>>;
  /** Signature du transporteur lors de l'enlèvement auprès de l'émetteur. */
  signature?: Maybe<Signature>;
  /** Date de prise en charge */
  takenOverAt?: Maybe<Scalars['DateTime']>;
};

/** Champs possible pour le filtre sur le transport. */
export type BsffTransportWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

export type BsffTransporter = {
  __typename?: 'BsffTransporter';
  /** Entreprise responsable du transport du déchet. */
  company?: Maybe<FormCompany>;
  /** Champ libre */
  customInfo?: Maybe<Scalars['String']>;
  /** Récépissé du transporteur, laisser vide s'il déclare être exempté. */
  recepisse?: Maybe<BsffTransporterRecepisse>;
  /** Déclaration du transporteur lors de l'enlèvement auprès de l'émetteur. */
  transport?: Maybe<BsffTransport>;
};

export type BsffTransporterInput = {
  company?: InputMaybe<CompanyInput>;
  /** Champ libre */
  customInfo?: InputMaybe<Scalars['String']>;
  /** Informations sur le récepissé transporteur. Si 'null', l'exemption de récépissé est assumée (conformément aux dispositions de l'article R.541-50 du code de l'environnement) */
  recepisse?: InputMaybe<BsffTransporterRecepisseInput>;
  transport?: InputMaybe<BsffTransporterTransportInput>;
};

export type BsffTransporterRecepisse = {
  __typename?: 'BsffTransporterRecepisse';
  /** Département auquel est lié le récépissé. */
  department?: Maybe<Scalars['String']>;
  /** Exemption de récépissé (conformément aux dispositions de l'article R.541-50 du code de l'environnement) */
  isExempted?: Maybe<Scalars['Boolean']>;
  /** Numéro du récépissé. */
  number?: Maybe<Scalars['String']>;
  /** Date limite de validité du récépissé. */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

export type BsffTransporterRecepisseInput = {
  /**
   * Le cas échéant, département de la déclaration mentionnée à l'article R. 541-50 du code de l'environnement.
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  department?: InputMaybe<Scalars['String']>;
  /** Exemption de récépissé (conformément aux dispositions de l'article R.541-50 du code de l'environnement) */
  isExempted?: InputMaybe<Scalars['Boolean']>;
  /**
   * Le cas échéant, numéro de récépissé mentionné à l'article R. 541-51 du code de l'environnement.
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  number?: InputMaybe<Scalars['String']>;
  /**
   * Le cas échéant, limite de validité du récépissé.
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

export type BsffTransporterTransportInput = {
  mode?: InputMaybe<TransportMode>;
  /** Plaque(s) d'immatriculation - maximum 2 */
  plates?: InputMaybe<Array<Scalars['String']>>;
  /** Date de prise en charge */
  takenOverAt?: InputMaybe<Scalars['DateTime']>;
};

/** Champs possible pour le filtre sur le transporteur. */
export type BsffTransporterWhere = {
  company?: InputMaybe<CompanyWhere>;
  transport?: InputMaybe<BsffTransportWhere>;
};

/** Représente les différents types de BSFF possibles. */
export enum BsffType {
  /**
   * À utiliser dans le cas d'un opérateur qui collecte des déchets dangereux de fluides frigorigènes (ou autres déchets dangereux de fluides)
   *  lors d'opérations sur les équipements en contenant de ses clients.
   */
  CollectePetitesQuantites = 'COLLECTE_PETITES_QUANTITES',
  /** À utiliser dans le cas d'un groupement de plusieurs contenants sur une installation de tri transit regroupement. */
  Groupement = 'GROUPEMENT',
  /** À utiliser dans le cas d'un reconditionnement de plusieurs contenants dans un plus grand contenant sur une installation de tri transit regroupement. */
  Reconditionnement = 'RECONDITIONNEMENT',
  /** À utiliser dans le cas d'une réexpédition d'un ou plusieurs contenants après transit sur une installation de tri, transit, regroupement. */
  Reexpedition = 'REEXPEDITION',
  /** À utiliser lors de l'émission d'un BSFF par un autre détenteur de déchet. */
  TracerFluide = 'TRACER_FLUIDE'
}

export type BsffWaste = {
  __typename?: 'BsffWaste';
  /** Mention ADR. */
  adr?: Maybe<Scalars['String']>;
  /** Code déchet. */
  code: Scalars['String'];
  /** Nature du fluide, laisser vide lorsqu'il est inconnu. */
  description?: Maybe<Scalars['String']>;
};

export type BsffWasteInput = {
  /** Les informations relatives au transport de marchandises dangereuses par voies terrestres */
  adr?: InputMaybe<Scalars['String']>;
  /**
   * Le code du déchet au regard l'[article R. 541-7 du code de l'environnement](https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839070&dateTexte=&categorieLien=cid) à choisir parmi la liste suivante :
   * 14 06 01*, 14 06 02*, 14 06 03*, 16 05 04*, 13 03 10*.
   */
  code: Scalars['String'];
  /** La dénomination usuelle du déchet */
  description?: InputMaybe<Scalars['String']>;
};

export type BsffWeight = {
  __typename?: 'BsffWeight';
  /** Si il s'agit d'une estimation ou d'un poids réel. */
  isEstimate: Scalars['Boolean'];
  /** Poids total du déchet en kilogrammes. */
  value: Scalars['Float'];
};

export type BsffWeightInput = {
  /** Si cette quantité est estimée ou réelle */
  isEstimate: Scalars['Boolean'];
  /** Quantité totale exprimée en kilogramme */
  value: Scalars['Float'];
};

/** Filtres possibles pour la récupération de bordereaux. */
export type BsffWhere = {
  /** ET logique */
  _and?: InputMaybe<Array<BsffWhere>>;
  /** NON logique */
  _not?: InputMaybe<BsffWhere>;
  /** OU logique */
  _or?: InputMaybe<Array<BsffWhere>>;
  /** Filtre sur la date de création */
  createdAt?: InputMaybe<DateFilter>;
  /** Filtre sur le champ destination. */
  destination?: InputMaybe<BsffDestinationWhere>;
  /** Filtre sur le champ emitter. */
  emitter?: InputMaybe<BsffEmitterWhere>;
  /** Filtre sur les fiches d'intervention */
  ficheInterventions?: InputMaybe<BsffFicheInterventionWhere>;
  /** Filtre sur l'ID */
  id?: InputMaybe<IdFilter>;
  /** Filtre sur le statut de brouillon. */
  isDraft?: InputMaybe<Scalars['Boolean']>;
  /** Filtre sur le conditionnement */
  packagings?: InputMaybe<BsffPackagingsWhere>;
  /** Filtre sur le statut */
  status?: InputMaybe<BsffStatusFilter>;
  /** Filtre sur le champ transporter. */
  transporter?: InputMaybe<BsffTransporterWhere>;
  /** Filtre sur la date de dernière modification */
  updatedAt?: InputMaybe<DateFilter>;
};

export type Bsvhu = {
  __typename?: 'Bsvhu';
  /** Date de création */
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Destinataire du bordereau */
  destination?: Maybe<BsvhuDestination>;
  /** Émetteur du bordereau */
  emitter?: Maybe<BsvhuEmitter>;
  /** Numéro unique attribué par Trackdéchets */
  id: Scalars['ID'];
  /** Identification des VHUs */
  identification?: Maybe<BsvhuIdentification>;
  /** Indique si le bordereau est à l'état de brouillon */
  isDraft: Scalars['Boolean'];
  metadata: BsvhuMetadata;
  /** Conditionnement du déchet */
  packaging?: Maybe<BsvhuPackaging>;
  /** Quantité de VHUs */
  quantity?: Maybe<Scalars['Int']>;
  /** Status du bordereau */
  status: BsvhuStatus;
  /** Transporteur */
  transporter?: Maybe<BsvhuTransporter>;
  /** Date de dernière modification */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Code déchet. Presque toujours 16 01 06 */
  wasteCode?: Maybe<Scalars['String']>;
  /** Poids en tonnes */
  weight?: Maybe<BsvhuWeight>;
};

export type BsvhuConnection = {
  __typename?: 'BsvhuConnection';
  edges: Array<BsvhuEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type BsvhuDestination = {
  __typename?: 'BsvhuDestination';
  /** Numéro d'agrément de receveur */
  agrementNumber?: Maybe<Scalars['String']>;
  /** Coordonnées de l'entreprise qui recoit les déchets */
  company?: Maybe<FormCompany>;
  /** Informations sur l'opétation de traitement */
  operation?: Maybe<BsvhuOperation>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: Maybe<Scalars['String']>;
  /** Informations de réception */
  reception?: Maybe<BsvhuReception>;
  /** Type de receveur: broyeur ou second centre VHU */
  type?: Maybe<BsvhuDestinationType>;
};

export type BsvhuDestinationInput = {
  /** Numéro d'agrément de receveur */
  agrementNumber?: InputMaybe<Scalars['String']>;
  /** Coordonnées de l'entreprise qui recoit les déchets */
  company?: InputMaybe<CompanyInput>;
  /** Informations sur l'opétation de traitement */
  operation?: InputMaybe<BsvhuOperationInput>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  plannedOperationCode?: InputMaybe<Scalars['String']>;
  /** Informations de réception */
  reception?: InputMaybe<BsvhuReceptionInput>;
  /** Type de receveur: broyeur ou second centre VHU */
  type?: InputMaybe<BsvhuDestinationType>;
};

export enum BsvhuDestinationType {
  Broyeur = 'BROYEUR',
  Demolisseur = 'DEMOLISSEUR'
}

/** Champs possible pour le filtre sur la destination. */
export type BsvhuDestinationWhere = {
  company?: InputMaybe<CompanyWhere>;
  operation?: InputMaybe<BsvhuOperationWhere>;
  reception?: InputMaybe<BsvhuReceptionWhere>;
};

export type BsvhuEdge = {
  __typename?: 'BsvhuEdge';
  cursor: Scalars['String'];
  node: Bsvhu;
};

export type BsvhuEmission = {
  __typename?: 'BsvhuEmission';
  signature?: Maybe<Signature>;
};

/** Champs possibles pour le filtre sur l'émission */
export type BsvhuEmissionWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

export type BsvhuEmitter = {
  __typename?: 'BsvhuEmitter';
  /** Numéro d'agrément émetteur */
  agrementNumber?: Maybe<Scalars['String']>;
  /** Coordonnées de l'entreprise émétrice */
  company?: Maybe<FormCompany>;
  /** Déclaration générale de l'émetteur du bordereau */
  emission?: Maybe<BsvhuEmission>;
};

export type BsvhuEmitterInput = {
  /** Numéro d'agrément émetteur */
  agrementNumber?: InputMaybe<Scalars['String']>;
  /** Coordonnées de l'entreprise émétrice */
  company?: InputMaybe<CompanyInput>;
};

/** Champs possible pour le filtre sur l'émetteur. */
export type BsvhuEmitterWhere = {
  company?: InputMaybe<CompanyWhere>;
  emission?: InputMaybe<BsvhuEmissionWhere>;
};

export type BsvhuError = {
  __typename?: 'BsvhuError';
  message: Scalars['String'];
  path: Scalars['String'];
  requiredFor: SignatureTypeInput;
};

export type BsvhuIdentification = {
  __typename?: 'BsvhuIdentification';
  numbers?: Maybe<Array<Maybe<Scalars['String']>>>;
  type?: Maybe<BsvhuIdentificationType>;
};

export type BsvhuIdentificationInput = {
  /** Numéros d'identification */
  numbers?: InputMaybe<Array<Scalars['String']>>;
  /** Type de numéros d'indentification */
  type?: InputMaybe<BsvhuIdentificationType>;
};

export enum BsvhuIdentificationType {
  NumeroOrdreLotsSortants = 'NUMERO_ORDRE_LOTS_SORTANTS',
  NumeroOrdreRegistrePolice = 'NUMERO_ORDRE_REGISTRE_POLICE'
}

export type BsvhuInput = {
  /** Détails sur la destination */
  destination?: InputMaybe<BsvhuDestinationInput>;
  /** Détails sur l'émetteur */
  emitter?: InputMaybe<BsvhuEmitterInput>;
  /** Identification des VHUs */
  identification?: InputMaybe<BsvhuIdentificationInput>;
  /** Conditionnement du déchet */
  packaging?: InputMaybe<BsvhuPackaging>;
  /** Quantité de VHUs */
  quantity?: InputMaybe<Scalars['Int']>;
  /** Détails sur le transporteur */
  transporter?: InputMaybe<BsvhuTransporterInput>;
  /** Code déchet. Presque toujours 16 01 06 */
  wasteCode?: InputMaybe<Scalars['String']>;
  /** Poids des VHUs en tonnes */
  weight?: InputMaybe<BsvhuWeightInput>;
};

export type BsvhuMetadata = {
  __typename?: 'BsvhuMetadata';
  errors?: Maybe<Array<BsvhuError>>;
};

export type BsvhuNextDestination = {
  __typename?: 'BsvhuNextDestination';
  company?: Maybe<FormCompany>;
};

export type BsvhuNextDestinationInput = {
  company?: InputMaybe<CompanyInput>;
};

export type BsvhuOperation = {
  __typename?: 'BsvhuOperation';
  /** Opération de traitement réalisée (R4 ou R12) */
  code?: Maybe<Scalars['String']>;
  /** Date de réalisation */
  date?: Maybe<Scalars['DateTime']>;
  /** Qualification du traitement final */
  mode?: Maybe<OperationMode>;
  /** Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU */
  nextDestination?: Maybe<BsvhuNextDestination>;
  signature?: Maybe<Signature>;
};

export type BsvhuOperationInput = {
  /** Opération de traitement réalisée (R4 ou R12) */
  code?: InputMaybe<Scalars['String']>;
  /** Date de réalisation */
  date?: InputMaybe<Scalars['DateTime']>;
  /** Qualification du traitement final */
  mode?: InputMaybe<OperationMode>;
  /** Broyeur de destination, à remplir uniquement lorsque la destination est lui même un centre VHU */
  nextDestination?: InputMaybe<BsvhuNextDestinationInput>;
};

/** Champs possible pour le filtre sur l'opération. */
export type BsvhuOperationWhere = {
  code?: InputMaybe<StringFilter>;
  signature?: InputMaybe<SignatureWhere>;
};

export enum BsvhuPackaging {
  Lot = 'LOT',
  Unite = 'UNITE'
}

export type BsvhuRecepisse = {
  __typename?: 'BsvhuRecepisse';
  department?: Maybe<Scalars['String']>;
  /** Exemption de récépissé */
  isExempted?: Maybe<Scalars['Boolean']>;
  number?: Maybe<Scalars['String']>;
  validityLimit?: Maybe<Scalars['DateTime']>;
};

export type BsvhuRecepisseInput = {
  /** @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport  */
  department?: InputMaybe<Scalars['String']>;
  /** Exemption de récépissé */
  isExempted?: InputMaybe<Scalars['Boolean']>;
  /** @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport  */
  number?: InputMaybe<Scalars['String']>;
  /** @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport  */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

export type BsvhuReception = {
  __typename?: 'BsvhuReception';
  /** Lot accepté oui/non */
  acceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** Date de présentation sur site */
  date?: Maybe<Scalars['DateTime']>;
  /** Identification éventuelle des VHU à la reception (numéro de lots ou d'ordre) */
  identification?: Maybe<BsvhuIdentification>;
  /** Quantité de VHUs reçue */
  quantity?: Maybe<Scalars['Int']>;
  /** Motif de refus */
  refusalReason?: Maybe<Scalars['String']>;
  /** Poids réel reçu en tonnes */
  weight?: Maybe<Scalars['Float']>;
};

export type BsvhuReceptionInput = {
  /** Lot accepté oui/non */
  acceptationStatus?: InputMaybe<WasteAcceptationStatus>;
  /** Date de présentation sur site */
  date?: InputMaybe<Scalars['DateTime']>;
  /** Identification éventuelle des VHU à la reception (numéro de lots ou d'ordre) */
  identification?: InputMaybe<BsvhuIdentificationInput>;
  /** Quantité de VHUs reçue */
  quantity?: InputMaybe<Scalars['Int']>;
  /** Motif de refus */
  refusalReason?: InputMaybe<Scalars['String']>;
  /** Poids réel reçu en tonnes */
  weight?: InputMaybe<Scalars['Float']>;
};

/** Champs possibles pour le filtre sur la réception */
export type BsvhuReceptionWhere = {
  date?: InputMaybe<DateFilter>;
};

export type BsvhuSignatureInput = {
  /** Nom et prénom du signataire */
  author: Scalars['String'];
  /** Date de la signature */
  date?: InputMaybe<Scalars['DateTime']>;
  /** Code de sécurité de l'entreprise pour laquelle on signe. Permet de signer en tant que. Optionnel */
  securityCode?: InputMaybe<Scalars['Int']>;
  /** Type de signature apposé */
  type: SignatureTypeInput;
};

export enum BsvhuStatus {
  Initial = 'INITIAL',
  Processed = 'PROCESSED',
  Refused = 'REFUSED',
  Sent = 'SENT',
  SignedByProducer = 'SIGNED_BY_PRODUCER'
}

/** Filtre sur le statut */
export type BsvhuStatusFilter = {
  _eq?: InputMaybe<BsvhuStatus>;
  _in?: InputMaybe<Array<BsvhuStatus>>;
};

export type BsvhuTransport = {
  __typename?: 'BsvhuTransport';
  signature?: Maybe<Signature>;
  /** Date de prise en charge */
  takenOverAt?: Maybe<Scalars['DateTime']>;
};

export type BsvhuTransportInput = {
  /** Date de prise en charge */
  takenOverAt?: InputMaybe<Scalars['DateTime']>;
};

/** Champs possible pour le filtre sur le transport. */
export type BsvhuTransportWhere = {
  signature?: InputMaybe<SignatureWhere>;
};

export type BsvhuTransporter = {
  __typename?: 'BsvhuTransporter';
  /** Coordonnées de l'entreprise de transport */
  company?: Maybe<FormCompany>;
  /** Récépissé transporteur */
  recepisse?: Maybe<BsvhuRecepisse>;
  /** Informations liés au transport */
  transport?: Maybe<BsvhuTransport>;
};

export type BsvhuTransporterInput = {
  /** Coordonnées de l'entreprise de transport */
  company?: InputMaybe<CompanyInput>;
  /** Récépissé transporteur */
  recepisse?: InputMaybe<BsvhuRecepisseInput>;
  /** Informations liés au transport */
  transport?: InputMaybe<BsvhuTransportInput>;
};

/** Champs possible pour le filtre sur le transporteur. */
export type BsvhuTransporterWhere = {
  company?: InputMaybe<CompanyWhere>;
  transport?: InputMaybe<BsvhuTransportWhere>;
};

export type BsvhuWeight = {
  __typename?: 'BsvhuWeight';
  isEstimate?: Maybe<Scalars['Boolean']>;
  /** Poids en tonnes */
  value?: Maybe<Scalars['Float']>;
};

export type BsvhuWeightInput = {
  /** Est-ce une estimation? */
  isEstimate?: InputMaybe<Scalars['Boolean']>;
  /** Poids en tonnes */
  value?: InputMaybe<Scalars['Float']>;
};

/** Filtres possibles pour la récupération de bordereaux. */
export type BsvhuWhere = {
  /** ET logique */
  _and?: InputMaybe<Array<BsvhuWhere>>;
  /** NON logique */
  _not?: InputMaybe<BsvhuWhere>;
  /** OU logique */
  _or?: InputMaybe<Array<BsvhuWhere>>;
  /** Filtre sur la date de création */
  createdAt?: InputMaybe<DateFilter>;
  /** Filtre sur le champ destination. */
  destination?: InputMaybe<BsvhuDestinationWhere>;
  /** Filtre sur le champ emitter. */
  emitter?: InputMaybe<BsvhuEmitterWhere>;
  /** Filtre sur l'ID */
  id?: InputMaybe<IdFilter>;
  /** Filtre sur le statut de brouillon. */
  isDraft?: InputMaybe<Scalars['Boolean']>;
  /** Filtre sur le statut */
  status?: InputMaybe<BsvhuStatusFilter>;
  /** Filtre sur le champ transporter. */
  transporter?: InputMaybe<BsvhuTransporterWhere>;
  /** Filtre sur la date de dernière modification */
  updatedAt?: InputMaybe<DateFilter>;
};

/** Vérification de captcha */
export type CaptchaInput = {
  /** Token permettant d'identifier le captcha côté back */
  token: Scalars['String'];
  /** Valeur utilisateur */
  value: Scalars['String'];
};

export type CompanyForVerification = {
  __typename?: 'CompanyForVerification';
  admin?: Maybe<AdminForVerification>;
  companyTypes: Array<CompanyType>;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  name: Scalars['String'];
  /** SIRET ou TVA de l'établissement */
  orgId: Scalars['String'];
  siret?: Maybe<Scalars['String']>;
  vatNumber?: Maybe<Scalars['String']>;
  verificationComment?: Maybe<Scalars['String']>;
  verificationMode?: Maybe<CompanyVerificationMode>;
  verificationStatus: CompanyVerificationStatus;
  verifiedAt?: Maybe<Scalars['DateTime']>;
};

export type CompanyForVerificationConnection = {
  __typename?: 'CompanyForVerificationConnection';
  companies: Array<CompanyForVerification>;
  totalCount: Scalars['Int'];
};

export type CompanyForVerificationWhere = {
  verificationStatus: CompanyVerificationStatus;
};

/**
 * Payload d'un établissement.
 *
 * Nous vous invitons à construire cet input en récupérant les informations relatives à un
 * établissement à partir de son numéro SIRET via la query `companyInfos`.
 *
 * Dans le cas où le nom ou l'adresse de l'établissement ne correspondent pas aux informations du répertoire SIRENE,
 * Trackdéchets les corrigera automatiquement.
 *
 * Une erreur sera levée si vous tentez d'ajouter un établissement qui est fermé selon le répertoire SIRENE.
 */
export type CompanyInput = {
  /** Adresse de l'établissement */
  address?: InputMaybe<Scalars['String']>;
  /** Nom du contact dans l'établissement */
  contact?: InputMaybe<Scalars['String']>;
  /** Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise */
  country?: InputMaybe<Scalars['String']>;
  /** Email du contact dans l'établissement */
  mail?: InputMaybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: InputMaybe<Scalars['String']>;
  /**
   * Numéro OMI ou IMO (International Maritime Organization) pour les navires étrangers (sans SIRET).
   * Il est composé des trois lettres IMO suivi d'un nombre de sept chiffres (ex: IMO 1234567).
   */
  omiNumber?: InputMaybe<Scalars['String']>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone?: InputMaybe<Scalars['String']>;
  /**
   * SIRET de l'établissement composé de 14 caractères numériques.
   *
   * Un établissement visé sur un bordereau en tant que transporteur doit être inscrit sur Trackdéchets avec le profil Transporteur.
   * Un établissement visé sur un bordereau en tant qu'installation de destination doit être inscrit sur Trackdéchets avec un profil d'installation
   * de transit ou de traitement.
   */
  siret?: InputMaybe<Scalars['String']>;
  /**
   * Numéro de TVA intra-communautaire de l'établissement. À renseigner pour
   * les transporteurs étrangers uniquement.
   *
   * Un transporteur étranger visé sur un bordereau par son numéro de TVA intra-communautaire doit être inscrit sur Trackdéchets
   * avec le profil Transporteur.
   */
  vatNumber?: InputMaybe<Scalars['String']>;
};

/** Information sur utilisateur au sein d'un établissement */
export type CompanyMember = {
  __typename?: 'CompanyMember';
  /** Email */
  email: Scalars['String'];
  /** Identifiant opaque */
  id: Scalars['ID'];
  /** Si oui ou non l'email de l'utilisateur a été confirmé */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Si oui ou non cet utilisateur correspond à l'utilisateur authentifié */
  isMe?: Maybe<Scalars['Boolean']>;
  /** Si oui ou non une une invitation à joindre l'établissement est en attente */
  isPendingInvitation?: Maybe<Scalars['Boolean']>;
  /** Nom de l'utilisateur */
  name?: Maybe<Scalars['String']>;
  /** Rôle de l'utilisateur dans l'établissement (admin ou membre) */
  role?: Maybe<UserRole>;
};

/** Information sur un établissement accessible par un utilisateur membre */
export type CompanyPrivate = {
  __typename?: 'CompanyPrivate';
  /** Adresse de l'établissement */
  address?: Maybe<Scalars['String']>;
  /** L'entreprise autorise l'enlèvement d'un Dasri sans sa signature */
  allowBsdasriTakeOverWithoutSignature: Scalars['Boolean'];
  /** Récépissé courtier (le cas échéant, pour les profils courtier) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Profil de l'établissement */
  companyTypes: Array<CompanyType>;
  /** Prénom et nom du contact */
  contact?: Maybe<Scalars['String']>;
  /** Email de contact (visible sur la fiche entreprise) */
  contactEmail?: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact (visible sur la fiche entreprise) */
  contactPhone?: Maybe<Scalars['String']>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements: Array<Scalars['URL']>;
  /** Identifiant GEREP */
  gerepId?: Maybe<Scalars['String']>;
  /**
   * Nom d'usage de l'entreprise qui permet de différencier
   * différents établissements ayant le même nom
   */
  givenName?: Maybe<Scalars['String']>;
  /** Identifiant opaque */
  id: Scalars['ID'];
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement (le cas échéant)
   */
  installation?: Maybe<Installation>;
  /** Libellé NAF de l'établissement */
  libelleNaf?: Maybe<Scalars['String']>;
  /** Code NAF de l'établissement */
  naf?: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars['String']>;
  /** SIRET ou TVA de l'établissement */
  orgId: Scalars['String'];
  /** Liste des automatisations de signature reçues par l'entreprise */
  receivedSignatureAutomations: Array<SignatureAutomation>;
  /** Code de signature permettant de signer les BSD */
  securityCode: Scalars['Int'];
  /** Liste des automatisations de signature accordées par l'entreprise */
  signatureAutomations: Array<SignatureAutomation>;
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars['String']>;
  /** Récépissé négociant (le cas échéant, pour les profils négociant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé transporteur (le cas échéant, pour les profils transporteur) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** Liste des permissions de l'utilisateur authentifié au sein de cet établissement */
  userPermissions: Array<UserPermission>;
  /** Rôle de l'utilisateur authentifié au sein de cet établissement */
  userRole?: Maybe<UserRole>;
  /** Liste des utilisateurs appartenant à cet établissement */
  users?: Maybe<Array<CompanyMember>>;
  /** Numéro de TVA de l'établissement */
  vatNumber?: Maybe<Scalars['String']>;
  /** État du processus de vérification de l'établissement */
  verificationStatus: CompanyVerificationStatus;
  /** Agrément broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
  /** Agrément démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Site web (visible sur la fiche entreprise) */
  website?: Maybe<Scalars['String']>;
  /** Informations de certifications pour les entreprise de travaux */
  workerCertification?: Maybe<WorkerCertification>;
};

export type CompanyPrivateConnection = {
  __typename?: 'CompanyPrivateConnection';
  edges: Array<CompanyPrivateEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type CompanyPrivateEdge = {
  __typename?: 'CompanyPrivateEdge';
  cursor: Scalars['String'];
  node: CompanyPrivate;
};

/** Information sur un établissement accessible publiquement en recherche */
export type CompanyPublic = {
  __typename?: 'CompanyPublic';
  /** Adresse de l'établissement */
  address?: Maybe<Scalars['String']>;
  /** L'entreprise autorise l'enlèvement d'un Dasri sans sa signature */
  allowBsdasriTakeOverWithoutSignature?: Maybe<Scalars['Boolean']>;
  /** Récépissé courtier associé à cet établissement (le cas échant) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Code commune de l'établissement */
  codeCommune?: Maybe<Scalars['String']>;
  /** Code pays de l'établissement */
  codePaysEtrangerEtablissement?: Maybe<Scalars['String']>;
  /**
   * Profil de l'établissement sur Trackdéchets
   * ayant pour valeur un tableau vide quand l'établissement
   * n'est pas inscrit sur la plateforme `isRegistered=false`
   */
  companyTypes: Array<CompanyType>;
  /** Prénom et nom du contact */
  contact?: Maybe<Scalars['String']>;
  /** Email de contact */
  contactEmail?: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact */
  contactPhone?: Maybe<Scalars['String']>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements: Array<Scalars['URL']>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif?: Maybe<Scalars['String']>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement
   */
  installation?: Maybe<Installation>;
  /** Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets */
  isRegistered?: Maybe<Scalars['Boolean']>;
  /** Libellé NAF */
  libelleNaf?: Maybe<Scalars['String']>;
  /** Code NAF */
  naf?: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars['String']>;
  /** SIRET ou TVA de l'établissement */
  orgId: Scalars['String'];
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars['String']>;
  /** Statut de diffusion de l'établissement selon l'INSEE. O = Oui, N = Non */
  statutDiffusionEtablissement?: Maybe<Scalars['String']>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** TVA de l'établissement */
  vatNumber?: Maybe<Scalars['String']>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Site web */
  website?: Maybe<Scalars['String']>;
  /** Certification entreprise de travaux */
  workerCertification?: Maybe<WorkerCertification>;
};

/** Information sur un établissement recherché par le frontend */
export type CompanySearchPrivate = CompanySearchPrivateCommon & {
  __typename?: 'CompanySearchPrivate';
  /** Adresse de l'établissement */
  address?: Maybe<Scalars['String']>;
  /** L'entreprise autorise l'enlèvement d'un Dasri sans sa signature */
  allowBsdasriTakeOverWithoutSignature?: Maybe<Scalars['Boolean']>;
  /** Récépissé courtier (le cas échéant, pour les profils courtier) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Code pays de l'établissement */
  codePaysEtrangerEtablissement?: Maybe<Scalars['String']>;
  /** Profil de l'établissement */
  companyTypes: Array<CompanyType>;
  /** Nom du contact */
  contact?: Maybe<Scalars['String']>;
  /** Email de contact (visible sur la fiche entreprise) */
  contactEmail?: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact (visible sur la fiche entreprise) */
  contactPhone?: Maybe<Scalars['String']>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements?: Maybe<Array<Scalars['URL']>>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif?: Maybe<Scalars['String']>;
  /** Identifiant GEREP */
  gerepId?: Maybe<Scalars['String']>;
  /**
   * Nom d'usage de l'entreprise qui permet de différencier
   * différents établissements ayant le même nom
   */
  givenName?: Maybe<Scalars['String']>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement (le cas échéant)
   */
  installation?: Maybe<Installation>;
  /** Si oui on non cet établissement est inscrit sur TD comme AnonymousCompany */
  isAnonymousCompany?: Maybe<Scalars['Boolean']>;
  /** Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets */
  isRegistered: Scalars['Boolean'];
  /** Libellé NAF de l'établissement */
  libelleNaf?: Maybe<Scalars['String']>;
  /** Code NAF de l'établissement */
  naf?: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars['String']>;
  /** SIRET ou TVA de l'établissement */
  orgId: Scalars['String'];
  /** Liste des automatisations de signature reçues par l'entreprise */
  receivedSignatureAutomations: Array<SignatureAutomation>;
  /** Code de signature permettant de signer les BSD */
  securityCode?: Maybe<Scalars['Int']>;
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars['String']>;
  /** Statut de diffusion de l'établissement selon l'INSEE. O = Oui, N = Non */
  statutDiffusionEtablissement?: Maybe<StatutDiffusionEtablissement>;
  /** Identifiant de l'entreprise sur la plateforme Trackdéchets. N'a une valeur que si l'entreprise est inscrite sur Trackdéchets (`isRegistered=true`) */
  trackdechetsId?: Maybe<Scalars['ID']>;
  /** Récépissé négociant (le cas échéant, pour les profils négociant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé transporteur (le cas échéant, pour les profils transporteur) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** Rôle de l'utilisateur authentifié au sein de cet établissement */
  userRole?: Maybe<UserRole>;
  /** Liste des utilisateurs appartenant à cet établissement */
  users?: Maybe<Array<CompanyMember>>;
  /** Numéro de TVA de l'établissement */
  vatNumber?: Maybe<Scalars['String']>;
  /** État du processus de vérification de l'établissement */
  verificationStatus?: Maybe<CompanyVerificationStatus>;
  /** Agrément broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
  /** Agrément démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Site web (visible sur la fiche entreprise) */
  website?: Maybe<Scalars['String']>;
  /** Certification entreprise de travaux */
  workerCertification?: Maybe<WorkerCertification>;
};

export type CompanySearchPrivateCommon = {
  /** Adresse de l'établissement */
  address?: Maybe<Scalars['String']>;
  /** L'entreprise autorise l'enlèvement d'un Dasri sans sa signature */
  allowBsdasriTakeOverWithoutSignature?: Maybe<Scalars['Boolean']>;
  /** Récépissé courtier associé à cet établissement (le cas échant) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Code pays de l'établissement */
  codePaysEtrangerEtablissement?: Maybe<Scalars['String']>;
  /**
   * Profil de l'établissement sur Trackdéchets
   * ayant pour valeur un tableau vide quand l'établissement
   * n'est pas inscrit sur la plateforme `isRegistered=false`
   */
  companyTypes?: Maybe<Array<CompanyType>>;
  /** Nom et prénom de contact */
  contact?: Maybe<Scalars['String']>;
  /** Email de contact */
  contactEmail?: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact */
  contactPhone?: Maybe<Scalars['String']>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements?: Maybe<Array<Scalars['URL']>>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif?: Maybe<Scalars['String']>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement
   */
  installation?: Maybe<Installation>;
  /** Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets */
  isRegistered?: Maybe<Scalars['Boolean']>;
  /** Libellé NAF */
  libelleNaf?: Maybe<Scalars['String']>;
  /** Code NAF */
  naf?: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars['String']>;
  /** SIRET ou TVA de l'établissement */
  orgId: Scalars['String'];
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars['String']>;
  /** Statut de diffusion des informations de l'établisement selon l'INSEE */
  statutDiffusionEtablissement?: Maybe<StatutDiffusionEtablissement>;
  /** Identifiant de l'entreprise sur la plateforme Trackdéchets. N'a une valeur que si l'entreprise est inscrite sur Trackdéchets (`isRegistered=true`) */
  trackdechetsId?: Maybe<Scalars['ID']>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** TVA de l'établissement */
  vatNumber?: Maybe<Scalars['String']>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Site web */
  website?: Maybe<Scalars['String']>;
  /** Certification entreprise de travaux */
  workerCertification?: Maybe<WorkerCertification>;
};

/** Information sur un établissement accessible publiquement en recherche floue */
export type CompanySearchResult = CompanySearchPrivateCommon & {
  __typename?: 'CompanySearchResult';
  /** Adresse de l'établissement */
  address?: Maybe<Scalars['String']>;
  /** Ville de l'adresse de l'établissement */
  addressCity?: Maybe<Scalars['String']>;
  /** Code Postal de l'adresse de l'établissement */
  addressPostalCode?: Maybe<Scalars['String']>;
  /** Nom de la voie de l'adresse de l'établissement */
  addressVoie?: Maybe<Scalars['String']>;
  /** L'entreprise autorise l'enlèvement d'un Dasri sans sa signature */
  allowBsdasriTakeOverWithoutSignature?: Maybe<Scalars['Boolean']>;
  /** Récépissé courtier associé à cet établissement (le cas échant) */
  brokerReceipt?: Maybe<BrokerReceipt>;
  /** Code commune de l'établissement */
  codeCommune?: Maybe<Scalars['String']>;
  /** Code pays de l'établissement */
  codePaysEtrangerEtablissement?: Maybe<Scalars['String']>;
  /**
   * Profil de l'établissement sur Trackdéchets
   * ayant pour valeur un tableau vide quand l'établissement
   * n'est pas inscrit sur la plateforme `isRegistered=false`
   */
  companyTypes?: Maybe<Array<CompanyType>>;
  /** Nom et prénom de contact */
  contact?: Maybe<Scalars['String']>;
  /** Email de contact */
  contactEmail?: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact */
  contactPhone?: Maybe<Scalars['String']>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements?: Maybe<Array<Scalars['URL']>>;
  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif?: Maybe<Scalars['String']>;
  /**
   * Installation classée pour la protection de l'environnement (ICPE)
   * associé à cet établissement
   */
  installation?: Maybe<Installation>;
  /** Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets */
  isRegistered?: Maybe<Scalars['Boolean']>;
  /** Libellé NAF */
  libelleNaf?: Maybe<Scalars['String']>;
  /** Code NAF */
  naf?: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars['String']>;
  /** SIRET ou TVA de l'établissement */
  orgId: Scalars['String'];
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars['String']>;
  /** Statut de diffusion des informations de l'établisement selon l'INSEE */
  statutDiffusionEtablissement?: Maybe<StatutDiffusionEtablissement>;
  /** Identifiant de l'entreprise sur la plateforme Trackdéchets. N'a une valeur que si l'entreprise est inscrite sur Trackdéchets (`isRegistered=true`) */
  trackdechetsId?: Maybe<Scalars['ID']>;
  /** Récépissé négociant associé à cet établissement (le cas échant) */
  traderReceipt?: Maybe<TraderReceipt>;
  /** Récépissé transporteur associé à cet établissement (le cas échéant) */
  transporterReceipt?: Maybe<TransporterReceipt>;
  /** TVA de l'établissement */
  vatNumber?: Maybe<Scalars['String']>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeur?: Maybe<VhuAgrement>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseur?: Maybe<VhuAgrement>;
  /** Site web */
  website?: Maybe<Scalars['String']>;
  /** Certification entreprise de travaux */
  workerCertification?: Maybe<WorkerCertification>;
};

/** Statistiques d'un établissement */
export type CompanyStat = {
  __typename?: 'CompanyStat';
  /** Établissement */
  company?: Maybe<FormCompany>;
  /** Liste des statistiques */
  stats: Array<Stat>;
};

/** Profil entreprise */
export enum CompanyType {
  /** Courtier */
  Broker = 'BROKER',
  /** Installation de Transit, regroupement ou tri de déchets */
  Collector = 'COLLECTOR',
  /** Crématorium */
  Crematorium = 'CREMATORIUM',
  /** Éco-organisme */
  EcoOrganisme = 'ECO_ORGANISME',
  /** Producteur de déchet */
  Producer = 'PRODUCER',
  /** Négociant */
  Trader = 'TRADER',
  /** Transporteur */
  Transporter = 'TRANSPORTER',
  /** Installation de traitement */
  Wasteprocessor = 'WASTEPROCESSOR',
  /** Installation de collecte de déchets apportés par le producteur initial */
  WasteCenter = 'WASTE_CENTER',
  /** Installation de traitement de VHU (casse automobile et/ou broyeur agréé) */
  WasteVehicles = 'WASTE_VEHICLES',
  /** Entreprise de travaux */
  Worker = 'WORKER'
}

export enum CompanyVerificationMode {
  Letter = 'LETTER',
  Manual = 'MANUAL'
}

/** État du processus de vérification de l'établissement */
export enum CompanyVerificationStatus {
  /**
   * Les vérifications manuelles n'ont pas abouties, une lettre a été envoyée à l'adresse enregistrée
   * auprès du registre du commerce et des sociétés
   */
  LetterSent = 'LETTER_SENT',
  /** L'établissement vient d'être crée, en attente de vérifications manuelles par l'équipe Trackdéchets */
  ToBeVerified = 'TO_BE_VERIFIED',
  /** L'établissement est vérifié */
  Verified = 'VERIFIED'
}

/** Filtre pour les établissement */
export type CompanyWhere = {
  siret?: InputMaybe<StringFilter>;
  vatNumber?: InputMaybe<StringFilter>;
};

/** Consistance du déchet */
export enum Consistence {
  /** Pâteux */
  Doughy = 'DOUGHY',
  /** Gazeux */
  Gaseous = 'GASEOUS',
  /** Liquide */
  Liquid = 'LIQUID',
  /** Solide */
  Solid = 'SOLID'
}

export type CreateAccessTokenInput = {
  /** Note personnelle pour se souvenir à quoi ce token va servir */
  description: Scalars['String'];
};

export type CreateApplicationInput = {
  goal: ApplicationGoal;
  logoUrl: Scalars['String'];
  name: Scalars['String'];
  redirectUris: Array<Scalars['String']>;
};

/** Payload de création d'un récépissé courtier */
export type CreateBrokerReceiptInput = {
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
  /** Numéro de récépissé courtier */
  receiptNumber: Scalars['String'];
  /** Limite de validité du récépissé */
  validityLimit: Scalars['DateTime'];
};

/** Payload de révision d'un bordereau. */
export type CreateBsdaRevisionRequestInput = {
  /** Numéro SIRET du demandeur */
  authoringCompanySiret: Scalars['String'];
  /** Identifiant du bordereau à réviser */
  bsdaId: Scalars['ID'];
  /** Commentaire pour expliquer la demande de révision */
  comment: Scalars['String'];
  /** Contenu de la révision */
  content: BsdaRevisionRequestContentInput;
};

/** Payload de création d'un bordereau */
export type CreateFormInput = {
  /**
   * Annexe 2 - Deprecated : utiliser grouping
   * @deprecated Utiliser `grouping`
   */
  appendix2Forms?: InputMaybe<Array<AppendixFormInput>>;
  /** Courtier */
  broker?: InputMaybe<BrokerInput>;
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: InputMaybe<Scalars['String']>;
  ecoOrganisme?: InputMaybe<EcoOrganismeInput>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: InputMaybe<EmitterInput>;
  /**
   * Bordereaux que celui-ci regroupe (Annexe 2) - Permet une utilisation partielle du bordereau initial.
   * Limité à 250 BSDDs initiaux.
   */
  grouping?: InputMaybe<Array<InitialFormFractionInput>>;
  /**
   * Liste d'entreprises intermédiaires. Un intermédiaire est une entreprise qui prend part à la gestion du déchet,
   * mais pas à la responsabilité de la traçabilité (entreprise de travaux, bureau d'étude, maitre d'oeuvre,
   * collectivité, etc.) Il pourra lire ce bordereau, sans étape de signature.
   *
   * Le nombre maximal d'intermédiaires sur un bordereau est de 3.
   */
  intermediaries?: InputMaybe<Array<CompanyInput>>;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: InputMaybe<RecipientInput>;
  temporaryStorageDetail?: InputMaybe<TemporaryStorageDetailInput>;
  /** Négociant (case 7) */
  trader?: InputMaybe<TraderInput>;
  /** Premier transporteur du déchet (case 8) */
  transporter?: InputMaybe<TransporterInput>;
  /**
   * Liste des différents transporteurs, dans l'ordre de prise en charge du déchet.
   * Contient un seul identifiant en cas d'acheminement direct. Peut contenir au maximum
   * 5 identifiants en cas de transport multi-modal. Les transporteurs peuvent être crées, modifiés,
   * supprimés à l'aide des mutations createFormTransporter, updateFormTransporter, deleteFormTransporter.
   */
  transporters?: InputMaybe<Array<Scalars['ID']>>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: InputMaybe<WasteDetailsInput>;
};

/** Payload de révision d'un bordereau. */
export type CreateFormRevisionRequestInput = {
  /** Numéro SIRET du demandeur */
  authoringCompanySiret: Scalars['String'];
  /** Commentaire pour expliquer la demande de révision */
  comment: Scalars['String'];
  /** Contenu de la révision */
  content: FormRevisionRequestContentInput;
  /** Identifiant du bordereau à réviser */
  formId: Scalars['ID'];
};

export type CreatePasswordResetRequestInput = {
  captcha: CaptchaInput;
  email: Scalars['String'];
};

export type CreatePdfAccessTokenInput = {
  bsdId: Scalars['ID'];
};

/** Payload de création d'un récépissé négociant */
export type CreateTraderReceiptInput = {
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
  /** Numéro de récépissé négociant */
  receiptNumber: Scalars['String'];
  /** Limite de validité du récépissé */
  validityLimit: Scalars['DateTime'];
};

/** Payload de création d'un récépissé transporteur */
export type CreateTransporterReceiptInput = {
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
  /** Numéro de récépissé transporteur */
  receiptNumber: Scalars['String'];
  /** Limite de validité du récépissé */
  validityLimit: Scalars['DateTime'];
};

/** Payload de création d'un agrément VHU */
export type CreateVhuAgrementInput = {
  /** Numéro d'agrément VHU */
  agrementNumber: Scalars['String'];
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
};

export type CreateWorkerCertificationInput = {
  /** Numéro de certification (sous-section 3 uniquement) */
  certificationNumber?: InputMaybe<Scalars['String']>;
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 4 */
  hasSubSectionFour: Scalars['Boolean'];
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 3 */
  hasSubSectionThree: Scalars['Boolean'];
  /**
   * Organisation qui a décerné la certification (sous-section 3 uniquement)
   * Peut prendre uniquement les valeurs suivantes: AFNOR Certification, GLOBAL CERTIFICATION, QUALIBAT
   */
  organisation?: InputMaybe<Scalars['String']>;
  /** Limite de validité de la certification (sous-section 3 uniquement) */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Filtre de date */
export type DateFilter = {
  /** La date de l'enregistrement est strictement égale à la date du filtre */
  _eq?: InputMaybe<Scalars['DateTime']>;
  /** La date de l'enregistrement est strictement supérieure à la date du filtre */
  _gt?: InputMaybe<Scalars['DateTime']>;
  /** La date de l'enregistrement est supérieure ou égale à la date du filtre */
  _gte?: InputMaybe<Scalars['DateTime']>;
  /** La date de l'enregistrement est strictement inférieure à la date du filtre */
  _lt?: InputMaybe<Scalars['DateTime']>;
  /** La date de l'enregistrement est inférieure ou égale à la date du filtre */
  _lte?: InputMaybe<Scalars['DateTime']>;
};

/** Représente une ligne dans une déclaration GEREP */
export type Declaration = {
  __typename?: 'Declaration';
  /** Année de la déclaration */
  annee?: Maybe<Scalars['String']>;
  /** Code du déchet */
  codeDechet?: Maybe<Scalars['String']>;
  /** Type de déclaration GEREP: producteur ou traiteur */
  gerepType?: Maybe<GerepType>;
  /** Description du déchet */
  libDechet?: Maybe<Scalars['String']>;
};

/** Payload de suppression d'un récépissé courtier */
export type DeleteBrokerReceiptInput = {
  /** The id of the broker receipt to delete */
  id: Scalars['ID'];
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

/** Payload de suppression d'un agrément VHU */
export type DeleteVhuAgrementInput = {
  /** ID de l'agrément VHU à supprimer */
  id: Scalars['ID'];
};

export type DeleteWorkerCertificationInput = {
  /** The id of the worker certification to delete */
  id: Scalars['ID'];
};

/** Destination finale après entreposage provisoire ou reconditionement */
export type Destination = {
  __typename?: 'Destination';
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars['String']>;
  /** Établissement de destination */
  company?: Maybe<FormCompany>;
  /**
   * DEPRECATED (renvoie toujours `false`) - Indique si l'information a été saisie par
   * l'émetteur du bordereau ou l'installation d'entreposage
   */
  isFilledByEmitter?: Maybe<Scalars['Boolean']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: Maybe<Scalars['String']>;
};

export type DestinationInput = {
  /** N° de CAP prévu (le cas échéant). Le champ CAP est obligatoire pour les déchets dangereux. */
  cap?: InputMaybe<Scalars['String']>;
  /**
   * Installation de destination prévue (case 14)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  company?: InputMaybe<CompanyInput>;
  /**
   * DEPRECATED (ce champ peut être omis, il n'est plus pris en charge) - Indique si c'est l'émetteur initial ou l'installation d'entreposage
   * ou de reconditionnement qui a saisi les informations
   */
  isFilledByEmitter?: InputMaybe<Scalars['Boolean']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: InputMaybe<Scalars['String']>;
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
  /** Adresse de l'éco-organisme */
  address: Scalars['String'];
  handleBsdasri?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  /** Nom de l'éco-organisme */
  name: Scalars['String'];
  /** Siret de l'éco-organisme */
  siret: Scalars['String'];
};

/** Payload de liaison d'un BSD à un eco-organisme */
export type EcoOrganismeInput = {
  name: Scalars['String'];
  /**
   * SIRET composé de 14 caractères correspondant à un éco-organisme. La liste des éco-organismes
   * est disponible via la [query ecoOrganismes](../user-company/queries#ecoorganismes)
   */
  siret: Scalars['String'];
};

/** Émetteur du BSD (case 1) */
export type Emitter = {
  __typename?: 'Emitter';
  /** Établissement émetteur */
  company?: Maybe<FormCompany>;
  /** Indique si le détenteur est un navire étranger */
  isForeignShip?: Maybe<Scalars['Boolean']>;
  /** Indique si le détenteur est un particulier ou une entreprise */
  isPrivateIndividual?: Maybe<Scalars['Boolean']>;
  /**
   * DEPRECATED - Ancienne adresse chantier
   * @deprecated Migration vers `workSite` obligatoire
   */
  pickupSite?: Maybe<Scalars['String']>;
  /** Type d'émetteur */
  type?: Maybe<EmitterType>;
  /** Adresse du chantier */
  workSite?: Maybe<WorkSite>;
};

/** Payload lié à un l'émetteur du BSD (case 1) */
export type EmitterInput = {
  /** Établissement émetteur */
  company?: InputMaybe<CompanyInput>;
  /** Indique si le détenteur est un navire étranger */
  isForeignShip?: InputMaybe<Scalars['Boolean']>;
  /** Indique si le détenteur est un particulier ou une entreprise */
  isPrivateIndividual?: InputMaybe<Scalars['Boolean']>;
  /** DEPRECATED - Ancienne adresse chantier */
  pickupSite?: InputMaybe<Scalars['String']>;
  /** Type d'émetteur. Le type d'émetteur doit être `OTHER`, `APPENDIX1` ou `APPENDIX2` lorsqu'un éco-organisme est responsable du déchet */
  type?: InputMaybe<EmitterType>;
  /** Adresse du chantier */
  workSite?: InputMaybe<WorkSiteInput>;
};

/** Types d'émetteur de déchet (choix multiple de la case 1) */
export enum EmitterType {
  /** Collecteur de petites quantités de déchets relevant de la même rubrique */
  Appendix1 = 'APPENDIX1',
  /** Producteur d'un déchet collecté dans le cadre d'une annexe 1 */
  Appendix1Producer = 'APPENDIX1_PRODUCER',
  /** Personne ayant transformé ou réalisé un traitement dont la provenance des déchets reste identifiable */
  Appendix2 = 'APPENDIX2',
  /** Autre détenteur */
  Other = 'OTHER',
  /** Producteur de déchet */
  Producer = 'PRODUCER'
}

export enum EtatAdministratif {
  A = 'A',
  F = 'F'
}

/** Type d'établissement favoris */
export enum FavoriteType {
  Broker = 'BROKER',
  Destination = 'DESTINATION',
  Emitter = 'EMITTER',
  NextDestination = 'NEXT_DESTINATION',
  Recipient = 'RECIPIENT',
  TemporaryStorageDetail = 'TEMPORARY_STORAGE_DETAIL',
  Trader = 'TRADER',
  Transporter = 'TRANSPORTER',
  Worker = 'WORKER'
}

/**
 * URL de téléchargement accompagné d'un token
 * permettant de valider le téléchargement.
 */
export type FileDownload = {
  __typename?: 'FileDownload';
  /** Lien de téléchargement */
  downloadLink?: Maybe<Scalars['String']>;
  /** Token ayant une durée de validité de 10s */
  token?: Maybe<Scalars['String']>;
};

/**
 * Bordereau de suivi de déchets (BSD)
 * Version dématérialisée du [CERFA n°12571*01](https://www.service-public.fr/professionnels-entreprises/vosdroits/R14334)
 */
export type Form = {
  __typename?: 'Form';
  /**
   * Bordereaux que celui-ci regroupe (Annexe 2)
   * @deprecated Utiliser `grouping`
   */
  appendix2Forms?: Maybe<Array<InitialForm>>;
  /** Courtier */
  broker?: Maybe<Broker>;
  /** Date de création du BSD */
  createdAt?: Maybe<Scalars['DateTime']>;
  currentTransporterSiret?: Maybe<Scalars['String']>;
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: Maybe<Scalars['String']>;
  /** Mode de traitement */
  destinationOperationMode?: Maybe<OperationMode>;
  ecoOrganisme?: Maybe<FormEcoOrganisme>;
  /** Date à laquelle l'émetteur a signé l'enlèvement initial. */
  emittedAt?: Maybe<Scalars['DateTime']>;
  /** Nom de la personne qui a signé l'enlèvement initial pour l'émetteur. */
  emittedBy?: Maybe<Scalars['String']>;
  /** Indique si l'enlèvement a été signé par l'éco-organisme en charge du déchet ou pas. */
  emittedByEcoOrganisme?: Maybe<Scalars['Boolean']>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: Maybe<Emitter>;
  /** Bordereaux dans lequel celui-ci est regroupé (Annexe 2) */
  groupedIn?: Maybe<Array<FormFraction>>;
  /** Bordereaux que celui-ci regroupe (Annexe 2) */
  grouping?: Maybe<Array<InitialFormFraction>>;
  /** Identifiant unique du bordereau. */
  id: Scalars['ID'];
  /**
   * Entreprises intermédiaires. Un intermédiaire est une entreprise qui prend part à la gestion du déchet,
   * mais pas à la responsabilité de la traçabilité (entreprise de travaux, bureau d'étude, maitre d'oeuvre,
   * collectivité, etc.) Il pourra lire ce bordereau, sans étape de signature.
   */
  intermediaries: Array<FormCompany>;
  /**
   * Permet de savoir si les données du BSD ont été importées depuis un
   * bordereau signé papier via la mutation `importPaperForm`
   */
  isImportedFromPaper: Scalars['Boolean'];
  /** Destination ultérieure prévue (case 12) */
  nextDestination?: Maybe<NextDestination>;
  nextTransporterSiret?: Maybe<Scalars['String']>;
  /** Si oui ou non il y a eu rupture de traçabilité */
  noTraceability?: Maybe<Scalars['Boolean']>;
  /** Date à laquelle le déchet a été traité */
  processedAt?: Maybe<Scalars['DateTime']>;
  /** Personne en charge du traitement */
  processedBy?: Maybe<Scalars['String']>;
  /** Description de l'opération d’élimination / valorisation (case 11) */
  processingOperationDescription?: Maybe<Scalars['String']>;
  /** Traitement réalisé (code D/R) */
  processingOperationDone?: Maybe<Scalars['String']>;
  /** Quantité déjà regroupé dans un ou plusieurs bordereaux de regroupement */
  quantityGrouped?: Maybe<Scalars['Float']>;
  /** Quantité réelle présentée en tonnes (case 10) */
  quantityReceived?: Maybe<Scalars['Float']>;
  /**
   * Identifiant lisible utilisé comme numéro sur le CERFA (case "Bordereau n°****").
   * Il est possible de l'utiliser pour récupérer l'identifiant unique du bordereau via la query form,
   * utilisé pour le reste des opérations.
   * Cet identifiant possède le format BSD-{yyyyMMdd}-{XXXXXXXX} où yyyyMMdd est la date du jour
   * et XXXXXXXXX une chaine de 9 caractères alphanumériques. Ex: BSD-20210101-HY87F54D1
   */
  readableId: Scalars['String'];
  /** Date à laquelle le déchet a été reçu (case 10) */
  receivedAt?: Maybe<Scalars['DateTime']>;
  /** Nom de la personne en charge de la réception du déchet (case 10) */
  receivedBy?: Maybe<Scalars['String']>;
  /** Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2) */
  recipient?: Maybe<Recipient>;
  /**
   * Date de l'envoi du déchet par l'émetteur et de prise en charge du déchet par le transporteur
   * @deprecated Remplacé par takenOverAt
   */
  sentAt?: Maybe<Scalars['DateTime']>;
  /**
   * Nom de la personne responsable de l'envoi du déchet (case 9)
   * @deprecated Remplacé par emittedBy
   */
  sentBy?: Maybe<Scalars['String']>;
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt?: Maybe<Scalars['DateTime']>;
  /**
   * Si oui ou non le BSD a été signé par un transporteur
   * @deprecated Ce champ est redondant avec status et takenOverAt
   */
  signedByTransporter?: Maybe<Scalars['Boolean']>;
  /** Résumé des valeurs clés du bordereau à l'instant T */
  stateSummary?: Maybe<StateSummary>;
  /** Statut du BSD (brouillon, envoyé, reçu, traité, etc) */
  status: FormStatus;
  /** Date à laquelle le transporteur a signé l'enlèvement initial. */
  takenOverAt?: Maybe<Scalars['DateTime']>;
  /** Nom de la personne qui a signé l'enlèvement initial pour le transporteur. */
  takenOverBy?: Maybe<Scalars['String']>;
  /** BSD suite - détail des champs de la partie entreposage provisoire ou reconditionnement */
  temporaryStorageDetail?: Maybe<TemporaryStorageDetail>;
  /** Négociant (case 7) */
  trader?: Maybe<Trader>;
  /** @deprecated Utiliser `Form.transporters` qui permet de lister le premier transporteur et les suivants */
  transportSegments?: Maybe<Array<TransportSegment>>;
  /** Premier transporteur du déchet (case 8) */
  transporter?: Maybe<Transporter>;
  /**
   * Liste des transporteurs du déchet. Contient 1 seul transporteur en cas d'achemniment direct.
   * Peut contenir un maximum de 5 transporteurs différents en cas de transport multi-modal
   */
  transporters: Array<Transporter>;
  /** Date de la dernière modification du BSD */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** Détails du déchet (case 3) */
  wasteDetails?: Maybe<WasteDetails>;
  /** Raison du refus (case 10) */
  wasteRefusalReason?: Maybe<Scalars['String']>;
};

/** Information sur un établissement dans un BSD */
export type FormCompany = {
  __typename?: 'FormCompany';
  /** Adresse de l'établissement */
  address?: Maybe<Scalars['String']>;
  /** Nom du contact dans l'établissement */
  contact?: Maybe<Scalars['String']>;
  /**
   * Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
   * https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2
   *
   * Utilisé uniquement lorsque l'entreprise est à l'étranger
   */
  country?: Maybe<Scalars['String']>;
  /** Email du contact dans l'établissement */
  mail?: Maybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: Maybe<Scalars['String']>;
  /**
   * Numéro OMI ou IMO (International Maritime Organization) pour les navires étrangers (sans SIRET).
   * Il est composé des trois lettres IMO suivi d'un nombre de sept chiffres (ex: IMO 1234567).
   */
  omiNumber?: Maybe<Scalars['String']>;
  /** SIRET ou TVA de l'établissement */
  orgId?: Maybe<Scalars['String']>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone?: Maybe<Scalars['String']>;
  /** SIRET de l'établissement */
  siret?: Maybe<Scalars['String']>;
  /** Numéro de TVA intracommunautaire */
  vatNumber?: Maybe<Scalars['String']>;
};

/** Information sur l'éco-organisme responsable du BSD */
export type FormEcoOrganisme = {
  __typename?: 'FormEcoOrganisme';
  name: Scalars['String'];
  siret: Scalars['String'];
};

/** Fraction d'un bordereau initial affectée à un bordereau de regroupement */
export type FormFraction = {
  __typename?: 'FormFraction';
  /** Bordereau de regroupement */
  form: Form;
  /** Quantité du bordereau initial affectée au bordereau de regroupement */
  quantity: Scalars['Float'];
};

/** Payload de création d'un BSD */
export type FormInput = {
  /**
   * Annexe 2 - Deprecated : utiliser grouping
   * @deprecated Utiliser `grouping`
   */
  appendix2Forms?: InputMaybe<Array<AppendixFormInput>>;
  /** Courtier */
  broker?: InputMaybe<BrokerInput>;
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: InputMaybe<Scalars['String']>;
  ecoOrganisme?: InputMaybe<EcoOrganismeInput>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: InputMaybe<EmitterInput>;
  /** Bordereaux que celui-ci regroupe (Annexe 2) - Permet une utilisation partielle du bordereau initial */
  grouping?: InputMaybe<Array<InitialFormFractionInput>>;
  /** Identifiant opaque */
  id?: InputMaybe<Scalars['ID']>;
  /**
   * Liste d'entreprises intermédiaires. Un intermédiaire est une entreprise qui prend part à la gestion du déchet,
   * mais pas à la responsabilité de la traçabilité (entreprise de travaux, bureau d'étude, maitre d'oeuvre,
   * collectivité, etc.) Il pourra lire ce bordereau, sans étape de signature.
   *
   * Le nombre maximal d'intermédiaires sur un bordereau est de 3.
   */
  intermediaries?: InputMaybe<Array<CompanyInput>>;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: InputMaybe<RecipientInput>;
  temporaryStorageDetail?: InputMaybe<TemporaryStorageDetailInput>;
  /** Négociant (case 7) */
  trader?: InputMaybe<TraderInput>;
  /** Premier transporteur du déchet (case 8) */
  transporter?: InputMaybe<TransporterInput>;
  /**
   * Liste des différents transporteurs, dans l'ordre de prise en charge du déchet.
   * Contient un seul identifiant en cas d'achemninement direct. Peut contenir au maximum
   * 5 identifiants en cas de transport multi-modal. Les transporteurs peuvent être crées, modifiés,
   * supprimés à l'aide des mutations createFormTransporter, updateFormTransporter, deleteFormTransporter.
   */
  transporters?: InputMaybe<Array<Scalars['ID']>>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: InputMaybe<WasteDetailsInput>;
};

/** Demande de révision BSDD */
export type FormRevisionRequest = {
  __typename?: 'FormRevisionRequest';
  /** Liste des approbations apposées sur la révision */
  approvals: Array<FormRevisionRequestApproval>;
  /** Entreprise à l'origine de la demande de révision */
  authoringCompany: FormCompany;
  /** Commentaire explicatif, saisi par l'auteur de la demande de révision */
  comment: Scalars['String'];
  /** Contenu de la révision */
  content: FormRevisionRequestContent;
  /** Date de création de la demande */
  createdAt: Scalars['DateTime'];
  /** Aperçu du bordereau concerné au moment de la création de la demande de révision. Il ne reflète pas le bordereau actuel. */
  form: Form;
  /** Identifiant de la demande de révison */
  id: Scalars['ID'];
  /** Statut d'acceptation de la révision */
  status: RevisionRequestStatus;
};

/** Approbation d'une demande de révision */
export type FormRevisionRequestApproval = {
  __typename?: 'FormRevisionRequestApproval';
  /** Siret de l'entreprise responsable de cette approbation */
  approverSiret: Scalars['String'];
  /** Commentaire explicatif, saisi par l'approbateur */
  comment?: Maybe<Scalars['String']>;
  /** Statut d'acceptation de l'approbation */
  status: RevisionRequestApprovalStatus;
};

export type FormRevisionRequestConnection = {
  __typename?: 'FormRevisionRequestConnection';
  edges: Array<FormRevisionRequestEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

/** Payload de révision d'un bordereau. Disponible sur une liste restreinte de champs. */
export type FormRevisionRequestContent = {
  __typename?: 'FormRevisionRequestContent';
  /** Courtier */
  broker?: Maybe<Broker>;
  /** Mode de traitement */
  destinationOperationMode?: Maybe<OperationMode>;
  /** Demande d'annulation du bordereau */
  isCanceled?: Maybe<Scalars['Boolean']>;
  /** Description de l'opération d’élimination / valorisation réalisée */
  processingOperationDescription?: Maybe<Scalars['String']>;
  /** Traitement réalisé (code D/R) */
  processingOperationDone?: Maybe<Scalars['String']>;
  /** Quantité reçue sur l'installation de destination, en tonnes */
  quantityReceived?: Maybe<Scalars['Float']>;
  /** Informations sur l'installation de destination ou d’entreposage ou de reconditionnement prévue (édition partielle uniquement) */
  recipient?: Maybe<FormRevisionRequestRecipient>;
  /** Entreposage provisoire (édition partielle uniquement) */
  temporaryStorageDetail?: Maybe<FormRevisionRequestTemporaryStorageDetail>;
  /** Négociant */
  trader?: Maybe<Trader>;
  /** Détails du déchet (édition partielle uniquement) */
  wasteDetails?: Maybe<FormRevisionRequestWasteDetails>;
};

/** Payload du contenu de la révision d'un bordereau. Disponible sur une liste restreinte de champs. */
export type FormRevisionRequestContentInput = {
  /** Courtier */
  broker?: InputMaybe<BrokerInput>;
  /** Mode de traitement */
  destinationOperationMode?: InputMaybe<OperationMode>;
  /** Annuler le bordereau. Exclusif des autres opérations */
  isCanceled?: InputMaybe<Scalars['Boolean']>;
  /** Description de l'opération d’élimination / valorisation réalisée */
  processingOperationDescription?: InputMaybe<Scalars['String']>;
  /** Traitement réalisé (code D/R) */
  processingOperationDone?: InputMaybe<Scalars['String']>;
  /** Quantité reçue sur l'installation de destination, en tonnes */
  quantityReceived?: InputMaybe<Scalars['Float']>;
  /** Informations sur l'installation de destination ou d’entreposage ou de reconditionnement prévue (édition partielle uniquement) */
  recipient?: InputMaybe<FormRevisionRequestRecipientInput>;
  /** Entreposage provisoire (édition partielle uniquement) */
  temporaryStorageDetail?: InputMaybe<FormRevisionRequestTemporaryStorageDetailInput>;
  /** Négociant */
  trader?: InputMaybe<TraderInput>;
  /** Détails du déchet (édition partielle uniquement) */
  wasteDetails?: InputMaybe<FormRevisionRequestWasteDetailsInput>;
};

export type FormRevisionRequestDestination = {
  __typename?: 'FormRevisionRequestDestination';
  /** N° de CAP de l'installation de destination */
  cap?: Maybe<Scalars['String']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: Maybe<Scalars['String']>;
};

export type FormRevisionRequestDestinationInput = {
  /** N° de CAP de l'installation de destination */
  cap?: InputMaybe<Scalars['String']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: InputMaybe<Scalars['String']>;
};

export type FormRevisionRequestEdge = {
  __typename?: 'FormRevisionRequestEdge';
  cursor: Scalars['String'];
  node: FormRevisionRequest;
};

export type FormRevisionRequestRecipient = {
  __typename?: 'FormRevisionRequestRecipient';
  /** CAP de l'installation de destination ou d'entreposage ou de reconditionnement prévue */
  cap?: Maybe<Scalars['String']>;
};

export type FormRevisionRequestRecipientInput = {
  /** CAP de l'installation de destination ou d'entreposage ou de reconditionnement prévue */
  cap?: InputMaybe<Scalars['String']>;
};

export type FormRevisionRequestTemporaryStorageDetail = {
  __typename?: 'FormRevisionRequestTemporaryStorageDetail';
  /** Révision des informations du destinataire finale */
  destination?: Maybe<FormRevisionRequestDestination>;
  /** Révision des informations sur l'entreposage provisoire */
  temporaryStorer?: Maybe<FormRevisionRequestTemporaryStorer>;
};

export type FormRevisionRequestTemporaryStorageDetailInput = {
  /** Révision des informations du destinataire finale */
  destination?: InputMaybe<FormRevisionRequestDestinationInput>;
  /** Révision des informations sur l'entreposage provisoire */
  temporaryStorer?: InputMaybe<FormRevisionRequestTemporaryStorerInput>;
};

export type FormRevisionRequestTemporaryStorer = {
  __typename?: 'FormRevisionRequestTemporaryStorer';
  /** Quantité reçue sur l'installation d'entreposage provisoire ou de reconditionnement (en tonnes) */
  quantityReceived?: Maybe<Scalars['Float']>;
};

export type FormRevisionRequestTemporaryStorerInput = {
  /** Quantité reçue sur l'installation d'entreposage provisoire ou de reconditionnement (en tonnes) */
  quantityReceived?: InputMaybe<Scalars['Float']>;
};

export type FormRevisionRequestWasteDetails = {
  __typename?: 'FormRevisionRequestWasteDetails';
  /** Code CED */
  code?: Maybe<Scalars['String']>;
  /** Description du déchet */
  name?: Maybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos?: Maybe<Array<PackagingInfo>>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: Maybe<Scalars['Boolean']>;
};

export type FormRevisionRequestWasteDetailsInput = {
  /** Code CED */
  code?: InputMaybe<Scalars['String']>;
  /** Description du déchet */
  name?: InputMaybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos?: InputMaybe<Array<PackagingInfoInput>>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: InputMaybe<Scalars['Boolean']>;
};

export type FormRevisionRequestWhere = {
  /** Permet de filtrer sur un numéro de bordereau */
  bsddId?: InputMaybe<StringFilter>;
  /** Permet de filtrer sur un statut de demande de révision */
  status?: InputMaybe<RevisionRequestStatus>;
};

export enum FormRole {
  /** Les BSD's dont je suis le courtier */
  Broker = 'BROKER',
  /** Les BSD's dont je suis éco-organisme */
  EcoOrganisme = 'ECO_ORGANISME',
  /** Les BSD's dont je suis l'émetteur */
  Emitter = 'EMITTER',
  /** Les BSD's dont je suis intermédiare */
  Intermediary = 'INTERMEDIARY',
  /** Les BSD's dont je suis la destination de traitement */
  Recipient = 'RECIPIENT',
  /** Les BSD's dont je suis le négociant */
  Trader = 'TRADER',
  /** Les BSD's dont je suis transporteur */
  Transporter = 'TRANSPORTER'
}

/** Différents statuts d'un BSD au cours de son cycle de vie */
export enum FormStatus {
  /** BSD accepté par l'établissement de destination */
  Accepted = 'ACCEPTED',
  /** BSD en attente de regroupement */
  AwaitingGroup = 'AWAITING_GROUP',
  /** Bordereau annulé. L'annulation peut être demandée via le processus de révision */
  Canceled = 'CANCELED',
  /**
   * BSD à l'état de brouillon
   * Des champs obligatoires peuvent manquer
   */
  Draft = 'DRAFT',
  /** BSD dont les déchets ont été traités en dehors de France sans rupture de traçabilité */
  FollowedWithPnttd = 'FOLLOWED_WITH_PNTTD',
  /** Regroupement effectué */
  Grouped = 'GROUPED',
  /** Perte de traçabalité */
  NoTraceability = 'NO_TRACEABILITY',
  /** BSD dont les déchets ont été traités */
  Processed = 'PROCESSED',
  /** BSD reçu par l'établissement de destination */
  Received = 'RECEIVED',
  /** Déchet refusé */
  Refused = 'REFUSED',
  /** Déchet avec les cadres 14-19 complétées (si besoin), prêt à partir du site d'entreposage ou reconditionnement */
  Resealed = 'RESEALED',
  /** Déchet envoyé du site d'entreposage ou reconditionnement vers sa destination de traitement */
  Resent = 'RESENT',
  /**
   * BSD finalisé
   * Les champs sont validés pour détecter des valeurs manquantes ou erronnées
   */
  Sealed = 'SEALED',
  /** BSD envoyé vers l'établissement de destination */
  Sent = 'SENT',
  /** BSD signé par l'émetteur du bordereau */
  SignedByProducer = 'SIGNED_BY_PRODUCER',
  /** BSD signé par l'entreposage provisoire pour enlèvement */
  SignedByTempStorer = 'SIGNED_BY_TEMP_STORER',
  /** Déchet arrivé sur le site d'entreposage ou reconditionnement */
  TempStored = 'TEMP_STORED',
  /** Déchet accepté par le site d'entreposage ou reconditionnement */
  TempStorerAccepted = 'TEMP_STORER_ACCEPTED'
}

/**
 * DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`
 *
 * Mise à jour d'un BSD
 */
export type FormSubscription = {
  __typename?: 'FormSubscription';
  /** Type de mutation */
  mutation?: Maybe<Scalars['String']>;
  /** BSD concerné */
  node?: Maybe<Form>;
  /** Ancienne valeurs */
  previousValues?: Maybe<Form>;
  /** Liste des champs mis à jour */
  updatedFields?: Maybe<Array<Maybe<Scalars['String']>>>;
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
  /** Registre courtier */
  Brokered = 'BROKERED',
  /**
   * Registre traiteur, TTR
   * Art 2: Les exploitants des installations de transit, de regroupement ou de traitement de déchets,
   * notamment de tri, établissent et tiennent à jour un registre chronologique où sont consignés
   * tous les déchets entrants.
   */
  Incoming = 'INCOMING',
  /**
   * Registre producteur, déchets sortants
   * Art 1: Les exploitants des établissements produisant ou expédiant des déchets tiennent à jour
   * un registre chronologique où sont consignés tous les déchets sortants.
   */
  Outgoing = 'OUTGOING',
  /**
   * Registre négociants
   * Art 4: Les négociants tiennent à jour un registre chronologique des déchets détenus.
   */
  Traded = 'TRADED',
  /**
   * Registre transporteur
   * Art 3: Les transporteurs et les collecteurs de déchets tiennent à jour un registre chronologique
   * des déchets transportés ou collectés.
   */
  Transported = 'TRANSPORTED'
}

/** Type d'une déclaration GEREP */
export enum GerepType {
  Producteur = 'Producteur',
  Traiteur = 'Traiteur'
}

/** Filtre pour les identifiants */
export type IdFilter = {
  /** L'identifiant de l'enregistrement est exactement égale à la valeur du filtre */
  _eq?: InputMaybe<Scalars['ID']>;
  /** L'identifiant de l'enregistrement fait partie de la liste du filtre */
  _in?: InputMaybe<Array<Scalars['ID']>>;
};

/** Payload d'import d'un BSD papier */
export type ImportPaperFormInput = {
  /** Courtier */
  broker?: InputMaybe<BrokerInput>;
  /**
   * Identifiant libre qui peut éventuellement servir à faire le lien dans Trackdéchets
   * entre le BSD papier et le BSD numérique dans le cas de l'import d'un BSD n'ayant
   * pas été émis initialement dans Trackdéchets.
   */
  customId?: InputMaybe<Scalars['String']>;
  /** Éco-organisme (apparait en case 1) */
  ecoOrganisme?: InputMaybe<EcoOrganismeInput>;
  /** Établissement émetteur/producteur du déchet (case 1) */
  emitter?: InputMaybe<EmitterInput>;
  /**
   * Numéro de BSD Trackdéchets (uniquement dans le cas d'une mise à jour d'un
   * bordereau émis initialement dans Trackdéchets)
   */
  id?: InputMaybe<Scalars['ID']>;
  /** Informations liées au traitement du déchet (case 11) */
  processedInfo: ProcessedFormInput;
  /** Informations liées à la réception du déchet (case 10) */
  receivedInfo: ReceivedFormInput;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: InputMaybe<RecipientInput>;
  /** Informations liées aux signatures transporteur et émetteur (case 8 et 9) */
  signingInfo: SignatureFormInput;
  /** Négociant (case 7) */
  trader?: InputMaybe<TraderInput>;
  /** Premier transporteur du déchet (case 8) */
  transporter?: InputMaybe<TransporterInput>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: InputMaybe<WasteDetailsInput>;
};

/**
 * Déchet entrant: https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884574.
 * Les champs notés "Extra" ne figurent pas dans l'arrêté registre.
 */
export type IncomingWaste = {
  __typename?: 'IncomingWaste';
  /** La raison sociale du courtier si le déchet est géré par un courtier */
  brokerCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du courtier si le déchet est géré par un courtier */
  brokerCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du courtier mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un courtier */
  brokerRecepisseNumber?: Maybe<Scalars['String']>;
  /** Extra - Type de bordereau */
  bsdType?: Maybe<BsdType>;
  /** Extra - Date de création du bordereeau */
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Identifiant secondaire du bordereau (BSDD uniquement) */
  customId?: Maybe<Scalars['String']>;
  /** Extra - N° de CAP (Certificat d'acceptation préalable) */
  destinationCap?: Maybe<Scalars['String']>;
  /** L'adresse de l'établissement vers lequel le déchet est expédié */
  destinationCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale de l'établissement vers lequel le déchet est expédié */
  destinationCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET de l'établissement vers lequel le déchet est expédié */
  destinationCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Champ libre fourni par le destinataire (tous les bordereaux sauf BSDD) */
  destinationCustomInfo?: Maybe<Scalars['String']>;
  /** Le code du traitement qui va être opéré dans l'établissement selon les annexes I et II de la directive 2008/98/CE relative aux déchets */
  destinationOperationCode?: Maybe<Scalars['String']>;
  /** Extra - Date de réalisation de l'opération */
  destinationOperationDate?: Maybe<Scalars['DateTime']>;
  /** Qualification du traitement final vis-à-vis de la hiérarchie des modes de traitement définie à l'article L. 541-1 du code de l'environnement */
  destinationOperationMode?: Maybe<OperationMode>;
  /** Extra - Autorisation par arrêté préfectoral, à la perte d'identification de la provenance à l'origine */
  destinationOperationNoTraceability?: Maybe<Scalars['Boolean']>;
  /** Extra - Statut d'acceptation du déchet */
  destinationReceptionAcceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** Date de réception du déchet */
  destinationReceptionDate?: Maybe<Scalars['DateTime']>;
  /** La quantité de déchet entrant exprimée en tonne */
  destinationReceptionWeight?: Maybe<Scalars['Float']>;
  /**
   * la raison sociale de l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeName?: Maybe<Scalars['String']>;
  /**
   * Le N°SIREN l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeSiren?: Maybe<Scalars['String']>;
  /** L'adresse de l'établissement expéditeur des déchets */
  emitterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'expéditeur du déchet */
  emitterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de l'établissement expéditeur des déchets */
  emitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET de l'établissement expéditeur des déchets */
  emitterCompanySiret?: Maybe<Scalars['String']>;
  /** L'adresse de prise en charge lorsqu'elle se distingue de l'adresse de l'établissement expéditeur des déchets */
  emitterPickupsiteAddress?: Maybe<Scalars['String']>;
  /** Le nom du point de prise en charge lorsqu'il se distingue du nom de l'établissement */
  emitterPickupsiteName?: Maybe<Scalars['String']>;
  /**
   * Le numéro du ou des bordereaux de suivi de déchets mentionnés aux articles R. 541-45 du code de l'environnement et R. 1335-4 du code de la santé publique
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839119&dateTexte=&categorieLien=cid
   * https://www.legifrance.gouv.fr/affichCode.do?cidTexte=LEGITEXT000006072665&dateTexte=&categorieLien=cid
   */
  id?: Maybe<Scalars['ID']>;
  /** L'adresse du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanySiret?: Maybe<Scalars['String']>;
  /** Lorsque les déchets apportés proviennent de plusieurs producteurs, le ou les codes postaux de la commune de collecte des déchets  */
  initialEmitterPostalCodes?: Maybe<Array<Scalars['String']>>;
  /**
   * S'il s'agit de déchets POP au sens de l'article R. 541-8 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839071&dateTexte=&categorieLien=cid
   */
  pop?: Maybe<Scalars['Boolean']>;
  /** Extra - Statut du bordereau */
  status?: Maybe<Scalars['String']>;
  /** La raison sociale du négociant si le déchet est géré par un négociant */
  traderCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du négociant si le déchet est géré par un négociant */
  traderCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du négociant mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un négociant */
  traderRecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°2 */
  transporter2CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur n°2 */
  transporter2RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°2 (en cas de transport multimodal) */
  transporter2RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°3 */
  transporter3CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur n°3 */
  transporter3RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°3 (en cas de transport multimodal) */
  transporter3RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur */
  transporterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur */
  transporterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur */
  transporterCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur */
  transporterCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur */
  transporterRecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le numéro de récépissé du trasnporteur mentionné à l'article R. 541-53 du code de l'environnement */
  transporterRecepisseNumber?: Maybe<Scalars['String']>;
  /** Extra - Date de dernière modification du bordereau */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /**
   * Extra - Dans le cas de déchets dangereux, selon le cas, le code transport lié aux réglementations internationales
   * relatives au transport international des marchandises dangereuses par route, au transport international
   * ferroviaire des marchandises dangereuses, au transport de matières dangereuses sur le Rhin, ou au
   * transport maritime de marchandises dangereuses
   */
  wasteAdr?: Maybe<Scalars['String']>;
  /**
   * Code du déchet entrant au regard l'article R. 541-7 du code de l'environnement
   * https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032191751/
   */
  wasteCode?: Maybe<Scalars['String']>;
  /** Dénomination usuelle du déchet */
  wasteDescription?: Maybe<Scalars['String']>;
  /** Extra - Certains déchets avec un code déchet sans astérisque peuvent, selon les cas, être dangereux ou non dangereux. */
  wasteIsDangerous?: Maybe<Scalars['Boolean']>;
  /** Extra - L'adresse de l'entreprise de travaux (amiante uniquement) */
  workerCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - La raison sociale de l'entreprise de travaux (amiante uniquement) */
  workerCompanyName?: Maybe<Scalars['String']>;
  /** Extra - Le numéro SIRET de l'entreprise de travaux (amiante uniquement) */
  workerCompanySiret?: Maybe<Scalars['String']>;
};

export type IncomingWasteConnection = {
  __typename?: 'IncomingWasteConnection';
  edges: Array<IncomingWasteEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type IncomingWasteEdge = {
  __typename?: 'IncomingWasteEdge';
  cursor: Scalars['String'];
  node: IncomingWaste;
};

export type InitialBsda = {
  __typename?: 'InitialBsda';
  /**
   * Destination du déchet, qui peut le réceptionner pour traitement, groupement ou réexpedition.
   * Un nouveau bordereau doit être créé si le déchet connaît un nouveau parcours, par exemple s'il quitte une installation de collecte pour un centre de traitement.
   *
   * Pour plus de détails sur les différents types de bordereau, voir l'enum BsdaType.
   */
  destination?: Maybe<BsdaDestination>;
  /** Émetteur du déchet, qui n'est pas nécessairement le producteur. */
  emitter?: Maybe<BsdaEmitter>;
  /**
   * Identifiant unique assigné par Trackdéchets.
   * Il est à utiliser pour les échanges avec l'API.
   */
  id: Scalars['ID'];
  /** Liste des contenants utilisés pour le transport du déchet. */
  packagings: Array<BsdaPackaging>;
  /** Détails du déchet. */
  waste?: Maybe<BsdaWaste>;
  /** Quantité totale du déchet en tonnes, il peut s'agir d'une estimation. */
  weight?: Maybe<BsdaWeight>;
};

/** Bordereau Bsdasri regroupé */
export type InitialBsdasri = {
  __typename?: 'InitialBsdasri';
  /** Identifiant du bordereau regroupé  */
  id: Scalars['ID'];
  /** Code postal du lieu de collecte */
  postalCode?: Maybe<Scalars['String']>;
  /** Nombre de contenants reçus */
  quantity?: Maybe<Scalars['Int']>;
  /** Date de collecte initiale */
  takenOverAt?: Maybe<Scalars['DateTime']>;
  /** Volume reçu dans le cas d'un groupement, émis dans le cas d'une synthèse */
  volume?: Maybe<Scalars['Float']>;
  /** Poids de déchets (en kg) traités dans le cas d'un groupement, émis (si renseigné) dans le cas d'une synthèse */
  weight?: Maybe<Scalars['Float']>;
};

/** Extrait d'un bordereau initial dans le cas d'une réexpedition, d'un reconditionnement ou d'un groupement */
export type InitialBsff = {
  __typename?: 'InitialBsff';
  /**
   * Destination du déchet, qui peut le réceptionner pour traitement, groupement, reconditionnement ou réexpedition.
   * Un nouveau bordereau doit être créé si le déchet connaît un nouveau parcours, par exemple s'il quitte une installation de collecte pour un centre de traitement.
   *
   * Pour plus de détails sur les différents types de bordereau, voir l'enum BsffType.
   */
  destination?: Maybe<BsffDestination>;
  /**
   * Émetteur du déchet, qui n'est pas nécessairement le producteur.
   * Il s'agit par exemple de l'opérateur ayant collecté des fluides lors d'interventions,
   * ou alors d'une installation de collecte qui procède à la réexpédition pour traitement final.
   */
  emitter?: Maybe<BsffEmitter>;
  /**
   * Liste des fiches d'intervention associés à ce bordereau.
   * Habituellement renseigné par un opérateur lors de son intervention.
   */
  ficheInterventions: Array<BsffFicheIntervention>;
  /**
   * Identifiant unique assigné par Trackdéchets.
   * Il est à utiliser pour les échanges avec l'API.
   */
  id: Scalars['ID'];
  /** Liste des contenants utilisés pour le transport du déchet. */
  packagings: Array<BsffPackaging>;
  /** Type de BSFF, voir l'enum pour plus de détails. */
  type: BsffType;
  /** Détails du déchet. */
  waste?: Maybe<BsffWaste>;
  /** Quantité totale du déchet en kilogrammes, il peut s'agir d'une estimation. */
  weight?: Maybe<BsffWeight>;
};

/**
 * Information sur le bordereau initial lors d'une réexpédition après transformation ou traitement aboutissant
 * à des déchets dont la provenance reste identifiable (annexe 2 ou 1)
 */
export type InitialForm = {
  __typename?: 'InitialForm';
  /**
   * Émetteur du bordereau initial
   * Les établissements apparaissant sur le bordereau de regroupement mais pas sur le bordereau initial (ex: l'exutoire finale)
   * n'ont pas accès à ce champs pour préserver les informations commerciales de l'établissement effectuant le regroupemnt
   */
  emitter?: Maybe<Emitter>;
  /**
   * Code postal de l'émetteur du bordereau initial permettant aux établissements qui apparaissent sur le bordereau de regroupement
   * mais pas sur le bordereau initial (ex: l'exutoire finale) de connaitre la zone de chalandise de l'émetteur initial.
   */
  emitterPostalCode?: Maybe<Scalars['String']>;
  /** Identifiant unique du bordereau initial */
  id: Scalars['ID'];
  /**
   * Opération de transformation ou un traitement aboutissant à des déchets dont la provenance reste identifiable effectuée
   * par l'installation de regroupement
   */
  processingOperationDone?: Maybe<Scalars['String']>;
  /** Quantité déjà regroupé dans un ou plusieurs bordereaux de regroupement */
  quantityGrouped?: Maybe<Scalars['Float']>;
  /**
   * Quantité reçue par l’installation réalisant une transformation ou un traitement aboutissant à des déchets
   * dont la provenance reste identifiable (en tonnes)
   */
  quantityReceived?: Maybe<Scalars['Float']>;
  /** Identifiant lisible du bordereau initial */
  readableId: Scalars['String'];
  /** Destinataire du bordereau initial */
  recipient?: Maybe<Recipient>;
  /**
   * Date d’acceptation du lot initial par l’installation réalisant une transformation ou un traitement aboutissant à des déchets
   * dont la provenance reste identifiable. C'est la date qui figure au cadre 10 du bordereau initial.
   */
  signedAt?: Maybe<Scalars['DateTime']>;
  /** Statut du bordereau initial */
  status?: Maybe<FormStatus>;
  /** Date à laquelle le transporteur a signé l'enlèvement initial. */
  takenOverAt?: Maybe<Scalars['DateTime']>;
  /** Transporteur du bordereau initial */
  transporter?: Maybe<Transporter>;
  /** Détails du déchet du bordereau initial (case 3) */
  wasteDetails?: Maybe<WasteDetails>;
};

/** Fraction d'un bordereau ajouté en annexe 2 d'un bordereau de regroupement */
export type InitialFormFraction = {
  __typename?: 'InitialFormFraction';
  /** Bordereau initial */
  form: InitialForm;
  /** Quantité du bordereau initial affectée au bordereau de regroupement */
  quantity: Scalars['Float'];
};

/** Fraction d'un bordereau ajouté en annexe d'un bordereau de regroupement */
export type InitialFormFractionInput = {
  /** Bordereau annexé */
  form: AppendixFormInput;
  /**
   * Quantité du bordereau initial affectée au bordereau de regroupement. Si omis,
   * la totalité de la quantité restante est affectée. La quantité renseignée ne peut
   * pas être supérieure à la quantité restante.
   * Cette quantité est ignorée dans le cas des annexes 1.
   */
  quantity?: InputMaybe<Scalars['Float']>;
};

/** Installation pour la protection de l'environnement (ICPE) */
export type Installation = {
  __typename?: 'Installation';
  /** Identifiant S3IC */
  codeS3ic?: Maybe<Scalars['String']>;
  /** Liste des déclarations GEREP */
  declarations?: Maybe<Array<Declaration>>;
  /** Liste des rubriques associées */
  rubriques?: Maybe<Array<Rubrique>>;
  /** URL de la fiche ICPE sur Géorisques */
  urlFiche?: Maybe<Scalars['String']>;
};

/**
 * Payload d'un établissement pouvant se situer en France
 * ou à l'étranger
 */
export type InternationalCompanyInput = {
  /** Adresse de l'établissement */
  address?: InputMaybe<Scalars['String']>;
  /** Nom du contact dans l'établissement */
  contact?: InputMaybe<Scalars['String']>;
  /**
   * Code ISO 3166-1 alpha-2 du pays d'origine de l'entreprise :
   * https://fr.wikipedia.org/wiki/ISO_3166-1_alpha-2
   *
   * En l'absence de code, le pays est FR si un siret est donné, ou détecté depuis le numéro de TVA si vatNumber est donné.
   * Une incohérence du pays avec le siret ou le numéro pays détecté du numéro de TVA résultera en une erreur type BAD_USER_INPUT.
   */
  country?: InputMaybe<Scalars['String']>;
  /** Email du contact dans l'établissement */
  mail?: InputMaybe<Scalars['String']>;
  /** Nom de l'établissement */
  name?: InputMaybe<Scalars['String']>;
  /** Numéro de téléphone de contact dans l'établissement */
  phone?: InputMaybe<Scalars['String']>;
  /** SIRET de l'établissement, optionnel dans le cas d'un établissement à l'étranger */
  siret?: InputMaybe<Scalars['String']>;
  /** Numéro de TVA intra-communautaire de l'établissement. */
  vatNumber?: InputMaybe<Scalars['String']>;
};

/**
 * Invitation à rejoindre une entreprise
 * lorsque l'utilisateur invité n'est pas encore inscrit
 * sur Trackdéchets
 */
export type Invitation = {
  __typename?: 'Invitation';
  /** Date when the invitation was accepted and the user joined */
  acceptedAt?: Maybe<Scalars['DateTime']>;
  /** Siret de l'entreprise à laquelle l'utilisateur est invité */
  companySiret: Scalars['String'];
  /** Email de l'utilisateur invité */
  email: Scalars['String'];
  /** Hash unique inclus dans le lien d'invitation envoyé par email */
  hash: Scalars['String'];
  /** Identifiant unique */
  id: Scalars['ID'];
  /** Rôle de l'utilisateur au sein de l'entreprise */
  role: UserRole;
};

/**
 * Déchet géré (négociant ou courtier) : https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884599
 * Les champs notés "Extra" ne figurent pas dans l'arrêté registre.
 */
export type ManagedWaste = {
  __typename?: 'ManagedWaste';
  /** La raison sociale du courtier si le déchet est géré par un courtier */
  brokerCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du courtier si le déchet est géré par un courtier */
  brokerCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Type de bordereau */
  bsdType?: Maybe<BsdType>;
  /** Extra - Date de création du bordereeau */
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Identifiant secondaire du bordereau (BSDD uniquement) */
  customId?: Maybe<Scalars['String']>;
  /** Extra - N° de CAP (Certificat d'acceptation préalable) */
  destinationCap?: Maybe<Scalars['String']>;
  /** L'adresse de l'établissement vers lequel le déchet est expédié */
  destinationCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'installation de destination */
  destinationCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de l'établissement vers lequel le déchet est expédié */
  destinationCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET de l'établissement vers lequel le déchet est expédié */
  destinationCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Date de réalisation de l'opération */
  destinationOperationDate?: Maybe<Scalars['DateTime']>;
  /** Extra - Autorisation par arrêté préfectoral, à la perte d'identification de la provenance à l'origine */
  destinationOperationNoTraceability?: Maybe<Scalars['Boolean']>;
  /** Le code du traitement qui va être opéré dans l'installation vers laquelle le déchet est expédié, selon les annexes I et II de la directive 2008/98/CE relative aux déchets ; */
  destinationPlannedOperationCode?: Maybe<Scalars['String']>;
  /** NON IMPLÉMENTÉ - La qualification du traitement final vis-à-vis de la hiérarchie des modes de traitement définie à l'article L. 541-1 du code de l'environnement */
  destinationPlannedOperationMode?: Maybe<OperationMode>;
  /** Extra - Statut d'acceptation du déchet */
  destinationReceptionAcceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** La quantité de déchet entrant exprimée en tonne */
  destinationReceptionWeight?: Maybe<Scalars['Float']>;
  /**
   * la raison sociale de l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeName?: Maybe<Scalars['String']>;
  /**
   * Le N°SIREN l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeSiren?: Maybe<Scalars['String']>;
  /** L'adresse de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'expéditeur du déchet */
  emitterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanySiret?: Maybe<Scalars['String']>;
  /** L'adresse de prise en charge lorsqu'elle se distingue de l'adresse de l'établissement */
  emitterPickupsiteAddress?: Maybe<Scalars['String']>;
  /** Le nom du point de prise en charge lorsqu'il se distingue du nom de l'établissement */
  emitterPickupsiteName?: Maybe<Scalars['String']>;
  /**
   * Le numéro du ou des bordereaux de suivi de déchets mentionnés aux articles R. 541-45 du code de l'environnement et R. 1335-4 du code de la santé publique
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839119&dateTexte=&categorieLien=cid
   * https://www.legifrance.gouv.fr/affichCode.do?cidTexte=LEGITEXT000006072665&dateTexte=&categorieLien=cid
   */
  id?: Maybe<Scalars['ID']>;
  /** L'adresse du producteur initial du déchet */
  initialEmitterCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du producteur initial du déchet */
  initialEmitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET du producteur initial du déchet */
  initialEmitterCompanySiret?: Maybe<Scalars['String']>;
  /** Lorsque les déchets apportés proviennent de plusieurs producteurs, le ou les codes postaux de la commune de collecte des déchets  */
  initialEmitterPostalCodes?: Maybe<Array<Scalars['String']>>;
  /** NON IMPLÉMENTÉ. La date de cession du déchet par le négociant, ou la date de fin de gestion du déchet par le courtier */
  managedEndDate?: Maybe<Scalars['DateTime']>;
  /** NON IMPLÉMENTÉ. La date d'acquisition du déchet par le négociant, ou la date de début de gestion du déchet par le courtier */
  managedStartDate?: Maybe<Scalars['DateTime']>;
  /**
   * S'il s'agit de déchets POP au sens de l'article R. 541-8 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839071&dateTexte=&categorieLien=cid
   */
  pop?: Maybe<Scalars['Boolean']>;
  /** Extra - Statut du bordereau */
  status?: Maybe<Scalars['String']>;
  /** La raison sociale du négociant si le déchet est géré par un courtier */
  traderCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du négociant si le déchet est géré par un négociant */
  traderCompanySiret?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°2 */
  transporter2CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur n°2 */
  transporter2RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°2 (en cas de transport multimodal) */
  transporter2RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°3 */
  transporter3CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur n°3 */
  transporter3RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°3 (en cas de transport multimodal) */
  transporter3RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur */
  transporterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur */
  transporterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur */
  transporterCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur */
  transporterCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur */
  transporterRecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur */
  transporterRecepisseNumber?: Maybe<Scalars['String']>;
  /** Extra - Date de dernière modification du bordereau */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /**
   * Extra - Dans le cas de déchets dangereux, selon le cas, le code transport lié aux réglementations internationales
   * relatives au transport international des marchandises dangereuses par route, au transport international
   * ferroviaire des marchandises dangereuses, au transport de matières dangereuses sur le Rhin, ou au
   * transport maritime de marchandises dangereuses
   */
  wasteAdr?: Maybe<Scalars['String']>;
  /**
   * Code du déchet entrant au regard l'article R. 541-7 du code de l'environnement
   * https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032191751/
   */
  wasteCode?: Maybe<Scalars['String']>;
  /** Dénomination usuelle du déchet */
  wasteDescription?: Maybe<Scalars['String']>;
  /** Extra - Certains déchets avec un code déchet sans astérisque peuvent, selon les cas, être dangereux ou non dangereux. */
  wasteIsDangerous?: Maybe<Scalars['Boolean']>;
  /** Extra - L'adresse de l'entreprise de travaux (amiante uniquement) */
  workerCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - La raison sociale de l'entreprise de travaux (amiante uniquement) */
  workerCompanyName?: Maybe<Scalars['String']>;
  /** Extra - Le numéro SIRET de l'entreprise de travaux (amiante uniquement) */
  workerCompanySiret?: Maybe<Scalars['String']>;
};

export type ManagedWasteConnection = {
  __typename?: 'ManagedWasteConnection';
  edges: Array<ManagedWasteEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type ManagedWasteEdge = {
  __typename?: 'ManagedWasteEdge';
  cursor: Scalars['String'];
  node: ManagedWaste;
};

/**
 * Demande de rattachement à un établissement effectué par
 * un utilisateur.
 */
export type MembershipRequest = {
  __typename?: 'MembershipRequest';
  /** Email de l'utilisateur faisant la demande */
  email: Scalars['String'];
  id: Scalars['ID'];
  /** Nom de l'établissement */
  name: Scalars['String'];
  /**
   * Liste des adresses email correspondant aux comptes administrateurs à qui la demande
   * de rattachement a été envoyée. Si l'email associé au compte qui effectue la requête
   * n'appartient pas au même domaine, les adresses emails sont partiellement masquées de la
   * façon suivante j********w@trackdechets.fr.
   * Les adresses emails issues de fournisseurs de boite mail (gmail, orange, yahoo etc)
   * sont toujours partiellement masquées.
   */
  sentTo: Array<Scalars['String']>;
  /** SIRET de l'établissement */
  siret: Scalars['String'];
  /** Statut de la demande de rattachement */
  status: MembershipRequestStatus;
};

/**
 * Différents statuts possibles pour une demande de rattachement
 * à un établissement
 */
export enum MembershipRequestStatus {
  Accepted = 'ACCEPTED',
  Pending = 'PENDING',
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
  addSignatureAutomation: SignatureAutomation;
  /**
   * USAGE INTERNE
   * Tente de désactiver un compte utilisateur (soft-delete et anonymisation)
   */
  anonymizeUser: Scalars['String'];
  /**
   * Annule une demande de révision de Bsda.
   * Peut être fait uniquement par l'auteur de la révision, si celle-ci n'a pas encore été acceptée
   */
  cancelBsdaRevisionRequest: Scalars['Boolean'];
  /**
   * Annule une demande de révision de BSDD.
   * Peut être fait uniquement par l'auteur de la révision, si celle-ci n'a pas encore été acceptée
   */
  cancelFormRevisionRequest: Scalars['Boolean'];
  /**
   * USAGE INTERNE
   * Modifie le mot de passe d'un utilisateur
   */
  changePassword: User;
  /**
   * USAGE INTERNE
   * Crée un jeton d'accès personnel
   */
  createAccessToken: NewAccessToken;
  createAnonymousCompany: AnonymousCompany;
  createApplication: Application;
  /**
   * USAGE INTERNE
   * Crée un récépissé courtier
   */
  createBrokerReceipt: BrokerReceipt;
  /** Crée un Bsda */
  createBsda: Bsda;
  /** Crée une demande de révision sur un Bsda existant */
  createBsdaRevisionRequest: BsdaRevisionRequest;
  /** Crée un nouveau dasri */
  createBsdasri: Bsdasri;
  /**
   * Mutation permettant de créer un nouveau BSFF.
   *
   * Ces champs sont requis :
   *
   * ```
   * type
   * emitter {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * transporter {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * destination {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   *   plannedOperationCode
   * }
   * waste {
   *   code
   *   adr
   *   description
   * }
   * weight {
   *   value
   *   isEstimate
   * }
   * packagings {
   *   name
   *   numero
   *   volume
   *   weight
   * }
   * ```
   *
   * Si vous souhaitez créer un BSFF sans ces informations, utilisez createDraftBsff.
   */
  createBsff: Bsff;
  /** Crée un BSVHU */
  createBsvhu: Bsvhu;
  /**
   * USAGE INTERNE
   * Rattache un établissement à l'utilisateur authentifié
   */
  createCompany: CompanyPrivate;
  /** Crée un Bsda en brouillon */
  createDraftBsda: Bsda;
  /** Crée un nouveau dasri en brouillon */
  createDraftBsdasri: Bsdasri;
  /**
   * Mutation permettant de créer un nouveau BSFF à l'état de brouillon.
   * Les seuls champs requis sont le type du BSFF et le n°SIRET de l'émetteur, du transporteur ou du destinataire.
   */
  createDraftBsff: Bsff;
  /** Crée un BSVHU en brouillon */
  createDraftBsvhu: Bsvhu;
  /**
   * Mutation permettant de créer une fiche d'intervention dans Trackdéchets.
   * Permet de reporter une partie des infos d'une fiche d'intervention papier
   * et d'identifier un détenteur d'équipement. Une fois créee, la fiche d'intervention
   * peut-être jointe à un BSFF.
   */
  createFicheInterventionBsff: BsffFicheIntervention;
  /** Crée un nouveau bordereau */
  createForm: Form;
  /** Crée une demande de révision sur un BSDD existant */
  createFormRevisionRequest: FormRevisionRequest;
  /** Crée un transporteur BSDD */
  createFormTransporter?: Maybe<Transporter>;
  /**
   * USAGE INTERNE
   * Envoie un email pour la réinitialisation du mot de passe
   */
  createPasswordResetRequest: Scalars['Boolean'];
  /**
   * Mutation permettant d'obtenir un lien de téléchargement valide 30 minutes.
   * A destination des forces de l'ordre qui ne disposent pas d'accès à Trackdéchets, le lien
   * est accessible sans authentification, et peut être transmis sous la form de QR-code.
   * La chaîne retournée est l'url de téléchargement.
   */
  createPdfAccessToken: Scalars['String'];
  /**
   * USAGE INTERNE
   * Génère un N°SIRET factice pouvant être utilisé pour le
   * rattachement d'un établissement de test
   */
  createTestCompany: Scalars['String'];
  /**
   * USAGE INTERNE
   * Crée un récépissé négociant
   */
  createTraderReceipt: TraderReceipt;
  /** Crée un récépissé transporteur */
  createTransporterReceipt: TransporterReceipt;
  /**
   * USAGE INTERNE
   * Crée un agrément VHU
   */
  createVhuAgrement: VhuAgrement;
  /** Crée un nouveau WebhookSetting */
  createWebhookSetting: WebhookSetting;
  /**
   * USAGE INTERNE
   * Crée une certification d'entreprise de travaux
   */
  createWorkerCertification: WorkerCertification;
  deleteApplication: Application;
  /**
   * USAGE INTERNE
   * Supprime un récépissé courtier
   */
  deleteBrokerReceipt: BrokerReceipt;
  /** Supprime un Bsda */
  deleteBsda: Bsda;
  /** Supprime un BSDASRI */
  deleteBsdasri: Bsdasri;
  /**
   * Mutation permettant de supprimer un bordereau existant de suivi de fluides frigorigènes.
   * À condition qu'il n'ait pas encore été signé.
   */
  deleteBsff: Bsff;
  /** Supprime un BSVHU */
  deleteBsvhu: Bsvhu;
  deleteCompany: CompanyPrivate;
  /** Supprime un BSD */
  deleteForm: Form;
  /** Supprime un transporteur BSDD */
  deleteFormTransporter: Scalars['ID'];
  /**
   * USAGE INTERNE
   * Supprime une invitation à un établissement
   */
  deleteInvitation: CompanyPrivate;
  /**
   * USAGE INTERNE
   * Supprime un récépissé négociant
   */
  deleteTraderReceipt: TraderReceipt;
  /**
   * USAGE INTERNE
   * Supprime un récépissé transporteur
   */
  deleteTransporterReceipt: TransporterReceipt;
  /**
   * USAGE INTERNE
   * Supprime un agrément VHU
   */
  deleteVhuAgrement: VhuAgrement;
  /** Supprime un WebhookSetting */
  deleteWebhookSetting?: Maybe<WebhookSetting>;
  /**
   * USAGE INTERNE
   * Supprime une certification d'entreprise de travaux
   */
  deleteWorkerCertification: WorkerCertification;
  /** Duplique un Bsda */
  duplicateBsda: Bsda;
  /** Duplique un bordereau Dasri (non applicable pour les bordereau de synthese ou de groupement) */
  duplicateBsdasri: Bsdasri;
  /**
   * Mutation permettant de dupliquer les informations de base d'un BSFF.
   * Renvoie un nouveau BSFF à l'état brouillon.
   */
  duplicateBsff: Bsff;
  /** Duplique un BSVHU */
  duplicateBsvhu: Bsvhu;
  /** Duplique un BSD */
  duplicateForm: Form;
  /**
   * USAGE INTERNE
   * Met à jour les informations de l'utilisateur
   */
  editProfile: User;
  /**
   * Édite un segment existant
   * @deprecated Utiliser le champ `Form.transporters` pour ajouter un transporteur, `updateFormTransporter` pour le modifier et `signTransportForm` pour signer
   */
  editSegment: TransportSegment;
  /**
   * Permet d'importer les informations d'un BSD papier dans Trackdéchet après la réalisation de l'opération
   * de traitement. Le BSD signé papier original doit être conservé à l'installation de destination qui doit
   * être en mesure de retrouver le bordereau papier correspondant à un bordereau numérique. Le champ `customId`
   * de l'input peut-être utilisé pour faire le lien.
   */
  importPaperForm: Form;
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
  /** Valide l'acceptation du BSD */
  markAsAccepted: Form;
  /** Valide le traitement d'un BSD */
  markAsProcessed: Form;
  /** Valide la réception d'un BSD */
  markAsReceived: Form;
  /** Valide la complétion des cadres 14 à 19 lors d'un entreposage provisoire ou reconditionnement */
  markAsResealed: Form;
  /**
   * Valide l'envoi du BSD après un entreposage provisoire ou reconditionnement
   * @deprecated Utiliser la mutation signedByTransporter permettant d'apposer les signatures du collecteur-transporteur (case 18) et de l'exploitant du site d'entreposage provisoire ou de reconditionnement (case 19)
   */
  markAsResent: Form;
  /**
   * Finalise un BSD
   * Les champs suivants sont obligatoires pour pouvoir finaliser un bordereau et
   * doivent avoir été renseignés au préalable
   * ```
   * emitter {
   *   type
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * recipient {
   *   processingOperation
   *   cap // requis pour les déchets dangereux uniquement
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * transporter {
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   *   receipt // non requis si isExemptedOfReceipt=true
   *   department // non requis si isExemptedOfReceipt=true
   *   validityLimit // peut-être omis si isExemptedOfReceipt=true
   * }
   * wasteDetails {
   *   code
   *   onuCode // requis pour les déchets dangereux uniquement
   *   packagingInfos {
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
   * Lorsqu'un courtier ou un négociant est présent sur le BSDD, les informations de contact,
   * ainsi que le numéro, la limite de validité et le département du récépissé sont obligatoires.
   */
  markAsSealed: Form;
  /** Valide la réception d'un BSD d'un entreposage provisoire ou reconditionnement */
  markAsTempStored: Form;
  /** Valide l'acceptation ou le refus d'un BSD d'un entreposage provisoire ou reconditionnement */
  markAsTempStorerAccepted: Form;
  /**
   * Marque un segment de transport comme prêt à être emporté
   * @deprecated Utiliser le champ `Form.transporters` pour ajouter un transporteur et `signTransportForm` pour signer
   */
  markSegmentAsReadyToTakeOver: TransportSegment;
  /**
   * Prépare un nouveau segment de transport multimodal (Siret ou TVA pour les transporteurs étrangers seulement)
   * @deprecated Utiliser le champ `Form.transporters` pour ajouter un transporteur et `signTransportForm` pour signer
   */
  prepareSegment: TransportSegment;
  /** Permet de publier un brouillon pour le marquer comme prêt à être envoyé */
  publishBsda: Bsda;
  /** Marque un dasri brouillon comme publié (isDraft=false) */
  publishBsdasri: Bsdasri;
  /** Mutation permettant de publier un brouillon. */
  publishBsff: Bsff;
  /** Permet de publier un brouillon pour le marquer comme prêt à être envoyé */
  publishBsvhu: Bsvhu;
  /**
   * USAGE INTERNE
   * Refuse une demande de rattachement à un un établissement
   */
  refuseMembershipRequest: CompanyPrivate;
  reindexBsd: Scalars['Boolean'];
  removeSignatureAutomation: SignatureAutomation;
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
  resendActivationEmail: Scalars['Boolean'];
  /**
   * USAGE INTERNE
   * Renvoie l'email d'invitation à un établissement
   */
  resendInvitation: Scalars['Boolean'];
  /**
   * USAGE INTERNE
   * Met à jour le mot de passe de l'utilisateur correspondant au hash
   */
  resetPassword: Scalars['Boolean'];
  /**
   * USAGE INTERNE
   * Révoque un jeton d'accès personnel
   */
  revokeAccessToken: AccessToken;
  /**
   * USAGE INTERNE
   * Révoque l'ensemble des jetons d'accès personnels
   */
  revokeAllAccessTokens: Array<AccessToken>;
  /**
   * USAGE INTERNE
   * Révoque l'accès à une application tierce
   */
  revokeAuthorizedApplication: AuthorizedApplication;
  /**
   * DEPRECATED - Sauvegarde un BSD (création ou modification, si `FormInput` contient un ID)
   * @deprecated Utiliser createForm / updateForm selon le besoin
   */
  saveForm: Form;
  /**
   * DEPRECATED - Envoie une demande de rattachement de l'utilisateur courant
   * à rejoindre l'établissement dont le siret est précisé en paramètre.
   * Cette demande est communiquée à l'ensemble des administrateurs de
   * l'établissement qui ont le choix de l'accepter ou de la refuser.
   */
  sendMembershipRequest?: Maybe<MembershipRequest>;
  sendVerificationCodeLetter: CompanyForVerification;
  /**
   * Signe un Bsda.
   *
   * **Champs requis pour `EMISSION` :**
   *
   * ```
   * emitter {
   *   isPrivateIndividual
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   * }
   * waste {
   *   code
   *   name
   * }
   * destination {
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   *   cap
   *   plannedOperationCode
   * }
   * worker {
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   * }
   * ```
   *
   * **Champs requis pour `WORK` :**
   *
   * ```
   * waste {
   *   consistence
   * }
   * weight {
   *   value
   *   isEstimate
   * }
   * ```
   *
   * **Champs requis pour `TRANSPORT` :**
   *
   * ```
   * transporter {
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   *   recepisse {
   *     number
   *     department
   *     validityLimit
   *   }
   * }
   * ```
   *
   * **Champs requis pour `OPERATION` :**
   *
   * ```
   * destination {
   *   reception {
   *     date
   *     weight
   *     acceptationStatus
   *   }
   *   operation {
   *     code
   *     date
   *   }
   * }
   * ```
   */
  signBsda: Bsda;
  /**
   * Appose une signature sur un Bsdasri, verrouille les cadres correspondant.
   *
   * Une signature ne peut être apposée que par un membre de l'entreprise figurant sur le cadre concerné.
   * Ex: la signature TRANSPORT ne peut être apposée que par un membre de l'entreprise de transport.
   *
   * Pour signer l'emission avec un compte transporteur (cas de la signature sur device transporteur),
   * utiliser la mutation signBsdasriEmissionWithSecretCode.
   *
   * **Champs requis pour `EMISSION` :**
   *
   * ```
   * emitter {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *   }
   *   emission {
   *     packagings {
   *       type
   *       volume
   *       quantity
   *     }
   *   }
   * }
   * waste {
   *   code
   *   adr
   * }
   * ```
   *
   * **Champs requis pour `TRANSPORT` :**
   *
   * ```
   * transporter {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *   }
   *   transport {
   *     acceptation {
   *       status
   *     }
   *     packagings {
   *       type
   *       volume
   *       quantity
   *     }
   *     takenOverAt
   *   }
   *   recepisse {
   *     isExempted
   *   }
   * }
   * ```
   *
   * **Champs requis pour `RECEPTION` :**
   *
   * ```
   * destination {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *   }
   *   reception {
   *     acceptation {
   *       status
   *     }
   *     packagings {
   *       type
   *       volume
   *       quantity
   *     }
   *     date
   *   }
   * }
   * ```
   *
   * **Champs requis pour `OPERATION` :**
   *
   * ```
   * destination {
   *   operation {
   *     weight {
   *       value
   *     }
   *     code
   *     date
   *   }
   * }
   * ```
   */
  signBsdasri: Bsdasri;
  /**
   * Appose une signature de type EMISSION via un compte n'appartenant pas à l'émetteur.
   * Permet de signer un enlèvement sur le device transporteur grâce au code de sécurité de l'émetteur du dasri
   */
  signBsdasriEmissionWithSecretCode: Bsdasri;
  /**
   * Mutation permettant de signer un `BSFF` lors des différentes étapes : émission, transport, réception,
   * acceptation, opération. Chaque mutation verrouille les informations et fait passer le BSFF d'un statut
   * à un autre.
   *
   * **Champs requis pour `EMISSION` :**
   *
   * ```
   * type
   * emitter {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * transporter {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   * }
   * destination {
   *   company {
   *     name
   *     siret
   *     address
   *     contact
   *     phone
   *     mail
   *   }
   *   plannedOperationCode
   * }
   * waste {
   *   code
   *   adr
   *   description
   * }
   * weight {
   *   value
   *   isEstimate
   * }
   * packagings {
   *   name
   *   numero
   *   volume
   *   weight
   * }
   * ```
   *
   * **Champs additionnels requis pour `TRANSPORT` :**
   *
   * ```
   * transporter {
   *   transport {
   *     mode
   *     takenOverAt
   *   }
   * }
   * ```
   *
   * **Champs additionnels requis pour `RECEPTION` :**
   *
   * ```
   * destination {
   *   reception {
   *     date
   *   }
   * }
   * ```
   *
   * **Champs additionnels requis pour `ACCEPTATION` :**
   *
   * À mettre à jour via la mutation `updateBsffPackaging`. L'acceptation de chaque contenant peut-être signée séparement
   * en précisant un identifiant de contenant.
   *
   * ```
   * packagings {
   *   acceptation {
   *     date
   *     status
   *     weight
   *   }
   * }
   * ```
   *
   * **Champs additionnels requis pour `OPERATION` :**
   *
   * À mettre à jour via la mutation `updateBsffPackaging`. L'opération de chaque contenant peut-être signée séparement
   * en précisant un identifiant de contenant.
   *
   * ```
   * packagings {
   *   operation {
   *     date
   *     code
   *     description
   *   }
   * }
   * ```
   */
  signBsff: Bsff;
  /**
   * Signe un BSVHU.
   *
   * **Champs requis pour `EMISSION` :**
   *
   * ```
   * emitter {
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   *   agrementNumber
   * }
   * quantity
   * weight {
   *   value
   * }
   * identification {
   *   type
   * }
   * packaging
   * destination {
   *   type
   *   plannedOperationCode
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   * }
   * ```
   *
   * **Champs requis pour `TRANSPORT` :**
   *
   * ```
   * transporter {
   *   company {
   *     siret
   *     name
   *     address
   *     contact
   *     mail
   *     phone
   *   }
   *   recepisse {
   *     isExempted
   *     number
   *     department
   *     validityLimit
   *   }
   * }
   * ```
   *
   * **Champs requis pour `OPERATION` :**
   *
   * ```
   * destination {
   *   reception {
   *     weight
   *     acceptationStatus
   *   }
   *   operation {
   *     code
   *   }
   *   agrementNumber
   * }
   * ```
   */
  signBsvhu: Bsvhu;
  /**
   * Permet de signer pour le détenteur du déchet afin de le transférer au transporteur.
   * Par exemple lors de l'enlèvement initial ou après un entreposage provisoire.
   */
  signEmissionForm: Form;
  /**
   * Permet de signer pour le transporteur afin de valider l'enlèvement.
   * Par exemple lors de l'enlèvement initial ou après un entreposage provisoire.
   */
  signTransportForm: Form;
  /**
   * Permet de transférer le déchet à un transporteur lors de la collecte initiale (signatures en case 8 et 9)
   * ou après une étape d'entreposage provisoire ou de reconditionnement (signatures en case 18 et 19).
   * Cette mutation doit être appelée avec le token du collecteur-transporteur.
   * L'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement) est authentifié quant à lui
   * grâce à son code de signature disponible sur le tableau de bord Trackdéchets (Mon Compte > Établissements > Sécurité).
   * D'un point de vue pratique, cela implique qu'un responsable de l'établissement émetteur (resp. d'entreposage provisoire ou de reconditionnement)
   * renseigne le code de signature sur le terminal du collecteur-transporteur.
   * Dans le cas où un éco-organisme figure sur le BSD, il est également possible de signer avec son code plutôt que celui de l'émetteur.
   * Il faut alors fournir le code de l'éco-organisme en indiquant qu'il est l'auteur de la signature (signingInfo.signatureAuthor doit valoir ECO_ORGANISME).
   * @deprecated Remplacé par signEmission et signTransport
   */
  signedByTransporter: Form;
  /**
   * USAGE INTERNE
   * Permet de créer un nouvel utilisateur
   */
  signup: User;
  /**
   * Répond à une demande d'approbation d'une révision.
   * En cas de refus, la révision associée est automatiquement refusée et les autres validations supprimées.
   * En cas d'acceptation, si c'était la dernière approbation attendue, la révision associée est automatiquement approuvée et appliquée sur le Bsda.
   */
  submitBsdaRevisionRequestApproval: BsdaRevisionRequest;
  /**
   * Répond à une demande d'approbation d'une révision.
   * En cas de refus, la révision associée est automatiquement refusée et les autres validations supprimées.
   * En cas d'acceptation, si c'était la dernière approbation attendue, la révision associée est automatiquement approuvée et appliquée sur le BSDD.
   */
  submitFormRevisionRequestApproval: FormRevisionRequest;
  /**
   * Marque un segment comme pris en charge par le nouveau transporteur
   * @deprecated Utiliser le champ `Form.transporters` pour ajouter un transporteur et `signTransportForm` pour signer
   */
  takeOverSegment: TransportSegment;
  updateApplication: Application;
  /**
   * USAGE INTERNE
   * Édite les informations d'un récépissé courtier
   */
  updateBrokerReceipt: BrokerReceipt;
  /** Met à jour un Bsda */
  updateBsda: Bsda;
  /**
   * Met à jour un dasri existant.
   * Par défaut, tous les champs sont modifiables.
   */
  updateBsdasri: Bsdasri;
  /** Mutation permettant de modifier un bordereau existant de suivi de fluides frigorigènes. */
  updateBsff: Bsff;
  /**
   * Mutation permettant de modifier les informations de réception
   * et traitement par contenant
   */
  updateBsffPackaging: BsffPackaging;
  /** Met à jour un BSVHU */
  updateBsvhu: Bsvhu;
  /**
   * Édite les informations d'un établissement
   *
   * Seul le champ `transporterReceiptId` est modifiable
   * par API. Pour les autres champs, il faut passer par
   * l'interface Trackdéchets.
   */
  updateCompany: CompanyPrivate;
  /** Mutation permettant de mettre à jour une fiche d'intervention. */
  updateFicheInterventionBsff: BsffFicheIntervention;
  /** Met à jour un bordereau existant */
  updateForm: Form;
  /** Modifie un transporteur BSDD */
  updateFormTransporter?: Maybe<Transporter>;
  /**
   * USAGE INTERNE
   * Édite les informations d'un récépissé négociant
   */
  updateTraderReceipt: TraderReceipt;
  /**
   * Met à jour la plaque d'immatriculation ou le champ libre du transporteur.
   * Disponible pour le Bsdd au statut SEALED ou SIGNED_BY_PRODUCER.
   */
  updateTransporterFields: Form;
  /** Édite les informations d'un récépissé transporteur */
  updateTransporterReceipt: TransporterReceipt;
  /**
   * USAGE INTERNE
   * Édite un agrément VHU
   */
  updateVhuAgrement: VhuAgrement;
  /** Met à jour un WebhookSetting existant. */
  updateWebhookSetting: WebhookSetting;
  /**
   * USAGE INTERNE
   * Édite une certification d'entreprise de travaux
   */
  updateWorkerCertification: WorkerCertification;
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
  id: Scalars['ID'];
  role: UserRole;
};


export type MutationAddSignatureAutomationArgs = {
  input: SignatureAutomationInput;
};


export type MutationAnonymizeUserArgs = {
  id: Scalars['ID'];
};


export type MutationCancelBsdaRevisionRequestArgs = {
  id: Scalars['ID'];
};


export type MutationCancelFormRevisionRequestArgs = {
  id: Scalars['ID'];
};


export type MutationChangePasswordArgs = {
  newPassword: Scalars['String'];
  oldPassword: Scalars['String'];
};


export type MutationCreateAccessTokenArgs = {
  input: CreateAccessTokenInput;
};


export type MutationCreateAnonymousCompanyArgs = {
  input: AnonymousCompanyInput;
};


export type MutationCreateApplicationArgs = {
  input: CreateApplicationInput;
};


export type MutationCreateBrokerReceiptArgs = {
  input: CreateBrokerReceiptInput;
};


export type MutationCreateBsdaArgs = {
  input: BsdaInput;
};


export type MutationCreateBsdaRevisionRequestArgs = {
  input: CreateBsdaRevisionRequestInput;
};


export type MutationCreateBsdasriArgs = {
  input: BsdasriInput;
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
  input: BsdasriInput;
};


export type MutationCreateDraftBsffArgs = {
  input: BsffInput;
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


export type MutationCreateFormRevisionRequestArgs = {
  input: CreateFormRevisionRequestInput;
};


export type MutationCreateFormTransporterArgs = {
  input: TransporterInput;
};


export type MutationCreatePasswordResetRequestArgs = {
  input: CreatePasswordResetRequestInput;
};


export type MutationCreatePdfAccessTokenArgs = {
  input: CreatePdfAccessTokenInput;
};


export type MutationCreateTraderReceiptArgs = {
  input: CreateTraderReceiptInput;
};


export type MutationCreateTransporterReceiptArgs = {
  input: CreateTransporterReceiptInput;
};


export type MutationCreateVhuAgrementArgs = {
  input: CreateVhuAgrementInput;
};


export type MutationCreateWebhookSettingArgs = {
  input: WebhookSettingCreateInput;
};


export type MutationCreateWorkerCertificationArgs = {
  input: CreateWorkerCertificationInput;
};


export type MutationDeleteApplicationArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBrokerReceiptArgs = {
  input: DeleteBrokerReceiptInput;
};


export type MutationDeleteBsdaArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBsdasriArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBsffArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBsvhuArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteCompanyArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteFormArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteFormTransporterArgs = {
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


export type MutationDeleteVhuAgrementArgs = {
  input: DeleteVhuAgrementInput;
};


export type MutationDeleteWebhookSettingArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteWorkerCertificationArgs = {
  input: DeleteWorkerCertificationInput;
};


export type MutationDuplicateBsdaArgs = {
  id: Scalars['ID'];
};


export type MutationDuplicateBsdasriArgs = {
  id: Scalars['ID'];
};


export type MutationDuplicateBsffArgs = {
  id: Scalars['ID'];
};


export type MutationDuplicateBsvhuArgs = {
  id: Scalars['ID'];
};


export type MutationDuplicateFormArgs = {
  id: Scalars['ID'];
};


export type MutationEditProfileArgs = {
  name?: InputMaybe<Scalars['String']>;
  phone?: InputMaybe<Scalars['String']>;
};


export type MutationEditSegmentArgs = {
  id: Scalars['ID'];
  nextSegmentInfo: NextSegmentInfoInput;
  siret: Scalars['String'];
};


export type MutationImportPaperFormArgs = {
  input: ImportPaperFormInput;
};


export type MutationInviteUserToCompanyArgs = {
  email: Scalars['String'];
  role: UserRole;
  siret: Scalars['String'];
};


export type MutationJoinWithInviteArgs = {
  inviteHash: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
};


export type MutationMarkAsAcceptedArgs = {
  acceptedInfo: AcceptedFormInput;
  id: Scalars['ID'];
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


export type MutationMarkAsTempStoredArgs = {
  id: Scalars['ID'];
  tempStoredInfos: TempStoredFormInput;
};


export type MutationMarkAsTempStorerAcceptedArgs = {
  id: Scalars['ID'];
  tempStorerAcceptedInfo: TempStorerAcceptedFormInput;
};


export type MutationMarkSegmentAsReadyToTakeOverArgs = {
  id: Scalars['ID'];
};


export type MutationPrepareSegmentArgs = {
  id: Scalars['ID'];
  nextSegmentInfo: NextSegmentInfoInput;
  siret: Scalars['String'];
};


export type MutationPublishBsdaArgs = {
  id: Scalars['ID'];
};


export type MutationPublishBsdasriArgs = {
  id: Scalars['ID'];
};


export type MutationPublishBsffArgs = {
  id: Scalars['ID'];
};


export type MutationPublishBsvhuArgs = {
  id: Scalars['ID'];
};


export type MutationRefuseMembershipRequestArgs = {
  id: Scalars['ID'];
};


export type MutationReindexBsdArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveSignatureAutomationArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveUserFromCompanyArgs = {
  siret: Scalars['String'];
  userId: Scalars['ID'];
};


export type MutationRenewSecurityCodeArgs = {
  siret: Scalars['String'];
};


export type MutationResendActivationEmailArgs = {
  input: ResendActivationEmailInput;
};


export type MutationResendInvitationArgs = {
  email: Scalars['String'];
  siret: Scalars['String'];
};


export type MutationResetPasswordArgs = {
  hash: Scalars['String'];
  newPassword: Scalars['String'];
};


export type MutationRevokeAccessTokenArgs = {
  id: Scalars['ID'];
};


export type MutationRevokeAuthorizedApplicationArgs = {
  id: Scalars['ID'];
};


export type MutationSaveFormArgs = {
  formInput: FormInput;
};


export type MutationSendMembershipRequestArgs = {
  siret: Scalars['String'];
};


export type MutationSendVerificationCodeLetterArgs = {
  input: SendVerificationCodeLetterInput;
};


export type MutationSignBsdaArgs = {
  id: Scalars['ID'];
  input: BsdaSignatureInput;
};


export type MutationSignBsdasriArgs = {
  id: Scalars['ID'];
  input: BsdasriSignatureInput;
};


export type MutationSignBsdasriEmissionWithSecretCodeArgs = {
  id: Scalars['ID'];
  input: BsdasriSignatureWithSecretCodeInput;
};


export type MutationSignBsffArgs = {
  id: Scalars['ID'];
  input: BsffSignatureInput;
};


export type MutationSignBsvhuArgs = {
  id: Scalars['ID'];
  input: BsvhuSignatureInput;
};


export type MutationSignEmissionFormArgs = {
  id: Scalars['ID'];
  input: SignEmissionFormInput;
  securityCode?: InputMaybe<Scalars['Int']>;
};


export type MutationSignTransportFormArgs = {
  id: Scalars['ID'];
  input: SignTransportFormInput;
  securityCode?: InputMaybe<Scalars['Int']>;
};


export type MutationSignedByTransporterArgs = {
  id: Scalars['ID'];
  signingInfo: TransporterSignatureFormInput;
};


export type MutationSignupArgs = {
  userInfos: SignupInput;
};


export type MutationSubmitBsdaRevisionRequestApprovalArgs = {
  comment?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  isApproved: Scalars['Boolean'];
};


export type MutationSubmitFormRevisionRequestApprovalArgs = {
  comment?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  isApproved: Scalars['Boolean'];
};


export type MutationTakeOverSegmentArgs = {
  id: Scalars['ID'];
  takeOverInfo: TakeOverInput;
};


export type MutationUpdateApplicationArgs = {
  id: Scalars['ID'];
  input: UpdateApplicationInput;
};


export type MutationUpdateBrokerReceiptArgs = {
  input: UpdateBrokerReceiptInput;
};


export type MutationUpdateBsdaArgs = {
  id: Scalars['ID'];
  input: BsdaInput;
};


export type MutationUpdateBsdasriArgs = {
  id: Scalars['ID'];
  input: BsdasriInput;
};


export type MutationUpdateBsffArgs = {
  id: Scalars['ID'];
  input: BsffInput;
};


export type MutationUpdateBsffPackagingArgs = {
  id: Scalars['ID'];
  input: UpdateBsffPackagingInput;
};


export type MutationUpdateBsvhuArgs = {
  id: Scalars['ID'];
  input: BsvhuInput;
};


export type MutationUpdateCompanyArgs = {
  allowBsdasriTakeOverWithoutSignature?: InputMaybe<Scalars['Boolean']>;
  brokerReceiptId?: InputMaybe<Scalars['String']>;
  companyTypes?: InputMaybe<Array<CompanyType>>;
  contact?: InputMaybe<Scalars['String']>;
  contactEmail?: InputMaybe<Scalars['String']>;
  contactPhone?: InputMaybe<Scalars['String']>;
  ecoOrganismeAgreements?: InputMaybe<Array<Scalars['URL']>>;
  gerepId?: InputMaybe<Scalars['String']>;
  givenName?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  traderReceiptId?: InputMaybe<Scalars['String']>;
  transporterReceiptId?: InputMaybe<Scalars['String']>;
  vhuAgrementBroyeurId?: InputMaybe<Scalars['String']>;
  vhuAgrementDemolisseurId?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
  workerCertificationId?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateFicheInterventionBsffArgs = {
  id: Scalars['ID'];
  input: BsffFicheInterventionInput;
};


export type MutationUpdateFormArgs = {
  updateFormInput: UpdateFormInput;
};


export type MutationUpdateFormTransporterArgs = {
  id: Scalars['ID'];
  input: TransporterInput;
};


export type MutationUpdateTraderReceiptArgs = {
  input: UpdateTraderReceiptInput;
};


export type MutationUpdateTransporterFieldsArgs = {
  id: Scalars['ID'];
  transporterCustomInfo?: InputMaybe<Scalars['String']>;
  transporterNumberPlate?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateTransporterReceiptArgs = {
  input: UpdateTransporterReceiptInput;
};


export type MutationUpdateVhuAgrementArgs = {
  input: UpdateVhuAgrementInput;
};


export type MutationUpdateWebhookSettingArgs = {
  id: Scalars['ID'];
  input: WebhookSettingUpdateInput;
};


export type MutationUpdateWorkerCertificationArgs = {
  input: UpdateWorkerCertificationInput;
};


export type MutationVerifyCompanyArgs = {
  input: VerifyCompanyInput;
};


export type MutationVerifyCompanyByAdminArgs = {
  input: VerifyCompanyByAdminInput;
};

/** Personnal access token */
export type NewAccessToken = {
  __typename?: 'NewAccessToken';
  /** Permet de décrire l'utilité de ce token */
  description: Scalars['String'];
  id: Scalars['ID'];
  /** Token en clair */
  token: Scalars['String'];
};

/** Destination ultérieure prévue (case 12) */
export type NextDestination = {
  __typename?: 'NextDestination';
  /** Établissement ultérieure */
  company?: Maybe<FormCompany>;
  /**
   * N° du document prévu à l'annexe I-B du règlement n°1013/2006
   * ou le numéro de notification et numéro de saisie du document
   * prévue à l'annexe I-B du règlement N°1013/2006 (si connu).
   */
  notificationNumber?: Maybe<Scalars['String']>;
  /** Traitement prévue (code D/R) */
  processingOperation?: Maybe<Scalars['String']>;
};

export type NextDestinationInput = {
  /** Établissement de destination ultérieur */
  company?: InputMaybe<InternationalCompanyInput>;
  /**
   * N° du document prévu à l'annexe I-B du règlement n°1013/2006
   * ou le numéro de notification et numéro de saisie du document
   * prévue à l'annexe I-B du règlement N°1013/2006 (si connu).
   * Format: PPNNNN, avec PP le code pays et NNNN un numéro d'ordre
   */
  notificationNumber?: InputMaybe<Scalars['String']>;
  /** Traitement prévue (code D/R) */
  processingOperation: Scalars['String'];
};

/** Payload lié à l'ajout de segment de transport multimodal (case 20 à 21) */
export type NextSegmentInfoInput = {
  mode: TransportMode;
  transporter?: InputMaybe<TransporterInput>;
};

/** Filtre pour les valeurs numériques */
export type NumericFilter = {
  _eq?: InputMaybe<Scalars['Float']>;
  _gt?: InputMaybe<Scalars['Float']>;
  _gte?: InputMaybe<Scalars['Float']>;
  _lt?: InputMaybe<Scalars['Float']>;
  _lte?: InputMaybe<Scalars['Float']>;
};

/**
 * Qualification du traitement final vis-à-vis de la hiérarchie des modes
 * de traitement définie à l'article L. 541-1 du code de l'environnement
 *
 * Les correspondances entre les codes D/R & modes de traitement sont:
 * - D1, D2, D3, D4, D5, D6, D7, D8, D9, D9F, D10, D11, D12: Elimination
 * - R0: Réutilisation
 * - R1: Valorisation énergétique
 * - R2, R3, R4, R5, R7, R9, R11: Réutilisation ou recyclage
 * - R6, R8, R10: Recyclage
 * - D13, D14, D15, R12, R13: aucun mode possible.
 */
export enum OperationMode {
  /** Incinération sans valorisation énergétique ou stockage en décharge */
  Elimination = 'ELIMINATION',
  /** Recyclage et autres formes de valorisation de la matière */
  Recyclage = 'RECYCLAGE',
  /** Réutilisation */
  Reutilisation = 'REUTILISATION',
  /** Valorisation énergétique */
  ValorisationEnergetique = 'VALORISATION_ENERGETIQUE'
}

export type OrderBy = {
  destinationCompanyName?: InputMaybe<OrderType>;
  emitterCompanyName?: InputMaybe<OrderType>;
  readableId?: InputMaybe<OrderType>;
  type?: InputMaybe<OrderType>;
  wasteCode?: InputMaybe<OrderType>;
};

export enum OrderType {
  Asc = 'ASC',
  Desc = 'DESC'
}

/**
 * Déchet sortant : https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884583.
 * Les champs notés "Extra" ne figurent pas dans l'arrêté registre.
 */
export type OutgoingWaste = {
  __typename?: 'OutgoingWaste';
  /** La raison sociale du courtier si le déchet est géré par un courtier */
  brokerCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du courtier si le déchet est géré par un courtier */
  brokerCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du courtier mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un courtier */
  brokerRecepisseNumber?: Maybe<Scalars['String']>;
  /** Extra - Type de bordereau */
  bsdType?: Maybe<BsdType>;
  /** Extra - Date de création du bordereeau */
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Identifiant secondaire du bordereau (BSDD uniquement) */
  customId?: Maybe<Scalars['String']>;
  /** Extra - N° de CAP (Certificat d'acceptation préalable) */
  destinationCap?: Maybe<Scalars['String']>;
  /** L'adresse de l'établissement vers lequel le déchet est expédié */
  destinationCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'installation de destination */
  destinationCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de l'établissement vers lequel le déchet est expédié */
  destinationCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET de l'établissement vers lequel le déchet est expédié */
  destinationCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Date de réalisation de l'opération */
  destinationOperationDate?: Maybe<Scalars['DateTime']>;
  /** Extra - Autorisation par arrêté préfectoral, à la perte d'identification de la provenance à l'origine */
  destinationOperationNoTraceability?: Maybe<Scalars['Boolean']>;
  /** Le code du traitement qui va être opéré dans l'installation vers laquelle le déchet est expédié, selon les annexes I et II de la directive 2008/98/CE relative aux déchets ; */
  destinationPlannedOperationCode?: Maybe<Scalars['String']>;
  /** NON IMPLÉMENTÉ - La qualification du traitement final vis-à-vis de la hiérarchie des modes de traitement définie à l'article L. 541-1 du code de l'environnement */
  destinationPlannedOperationMode?: Maybe<OperationMode>;
  /** Extra - Statut d'acceptation du déchet */
  destinationReceptionAcceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** Extra - La quantité de déchet reçu sur l'installation de destination ou d'entreposage provisoire exprimée en tonne */
  destinationReceptionWeight?: Maybe<Scalars['Float']>;
  /**
   * la raison sociale de l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeName?: Maybe<Scalars['String']>;
  /**
   * Le N°SIREN l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeSiren?: Maybe<Scalars['String']>;
  /** L'adresse de l'établissement */
  emitterCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale de l'établissement expéditeur des déchets */
  emitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET de l'établissement expéditeur des déchets */
  emitterCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Champ libre fourni par l'expéditeur (tous les bordereaux sauf BSDD) */
  emitterCustomInfo?: Maybe<Scalars['String']>;
  /** L'adresse de prise en charge lorsqu'elle se distingue de l'adresse de l'établissement */
  emitterPickupsiteAddress?: Maybe<Scalars['String']>;
  /** Le nom du point de prise en charge lorsqu'il se distingue du nom de l'établissement */
  emitterPickupsiteName?: Maybe<Scalars['String']>;
  /**
   * Le numéro du ou des bordereaux de suivi de déchets mentionnés aux articles R. 541-45 du code de l'environnement et R. 1335-4 du code de la santé publique
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839119&dateTexte=&categorieLien=cid
   * https://www.legifrance.gouv.fr/affichCode.do?cidTexte=LEGITEXT000006072665&dateTexte=&categorieLien=cid
   */
  id?: Maybe<Scalars['ID']>;
  /** L'adresse du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanySiret?: Maybe<Scalars['String']>;
  /** Lorsque les déchets apportés proviennent de plusieurs producteurs, le ou les codes postaux de la commune de collecte des déchets  */
  initialEmitterPostalCodes?: Maybe<Array<Scalars['String']>>;
  /** S'il s'agit, de déchets POP au sens de l'article R. 541-8 du code de l'environnement */
  pop?: Maybe<Scalars['Boolean']>;
  /** Extra - Statut du bordereau */
  status?: Maybe<Scalars['String']>;
  /** La raison sociale du négociant si le déchet est géré par un négociant */
  traderCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du négociant si le déchet est géré par un négociant */
  traderCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du négociant mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un négociant */
  traderRecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°2 */
  transporter2CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°2 (en cas de transport multimodal) */
  transporter2CompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur n°2 */
  transporter2RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°2 (en cas de transport multimodal) */
  transporter2RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur n°3 */
  transporter3CompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°3 (en cas de transport multimodal) */
  transporter3CompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur n°3 */
  transporter3RecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le récepissé transporteur n°3 (en cas de transport multimodal) */
  transporter3RecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur */
  transporterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact du transporteur */
  transporterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur */
  transporterCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur */
  transporterCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Exemption de récépissé transporteur */
  transporterRecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** Le numéro de récépissé du trasnporteur mentionné à l'article R. 541-53 du code de l'environnement */
  transporterRecepisseNumber?: Maybe<Scalars['String']>;
  /** La date de l'expédition du déchet */
  transporterTakenOverAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Date de dernière modification du bordereau */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /**
   * Extra - Dans le cas de déchets dangereux, selon le cas, le code transport lié aux réglementations internationales
   * relatives au transport international des marchandises dangereuses par route, au transport international
   * ferroviaire des marchandises dangereuses, au transport de matières dangereuses sur le Rhin, ou au
   * transport maritime de marchandises dangereuses
   */
  wasteAdr?: Maybe<Scalars['String']>;
  /** Le code du déchet sortant au regard de l'article R. 541-7 du code de l'environnement */
  wasteCode?: Maybe<Scalars['String']>;
  /** La dénomination usuelle du déchet */
  wasteDescription?: Maybe<Scalars['String']>;
  /** Extra - Certains déchets avec un code déchet sans astérisque peuvent, selon les cas, être dangereux ou non dangereux. */
  wasteIsDangerous?: Maybe<Scalars['Boolean']>;
  /** La quantité de déchet sortant en tonne */
  weight?: Maybe<Scalars['Float']>;
  /** Extra - L'adresse de l'entreprise de travaux (amiante uniquement) */
  workerCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - La raison sociale de l'entreprise de travaux (amiante uniquement) */
  workerCompanyName?: Maybe<Scalars['String']>;
  /** Extra - Le numéro SIRET de l'entreprise de travaux (amiante uniquement) */
  workerCompanySiret?: Maybe<Scalars['String']>;
};

export type OutgoingWasteConnection = {
  __typename?: 'OutgoingWasteConnection';
  edges: Array<OutgoingWasteEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type OutgoingWasteEdge = {
  __typename?: 'OutgoingWasteEdge';
  cursor: Scalars['String'];
  node: OutgoingWaste;
};

/** Informations sur le conditionnement */
export type PackagingInfo = {
  __typename?: 'PackagingInfo';
  /** Description du conditionnement dans le cas où le type de conditionnement est `AUTRE` */
  other?: Maybe<Scalars['String']>;
  /** Nombre de colis associés à ce conditionnement */
  quantity: Scalars['Int'];
  /** Type de conditionnement */
  type: Packagings;
};

/** Payload lié à un élément de conditionnement */
export type PackagingInfoInput = {
  /** Description du conditionnement dans le cas où le type de conditionnement est `OTHER` */
  other?: InputMaybe<Scalars['String']>;
  /**
   * Nombre de colis associés à ce conditionnement. Dans le cas d'un conditionnemt BENNE ou CITERNE,
   * le nombre de colis ne peut être supérieur à 2.
   */
  quantity: Scalars['Int'];
  /** Type de conditionnement */
  type: Packagings;
};

/** Type de packaging du déchet */
export enum Packagings {
  /** Autre */
  Autre = 'AUTRE',
  /** Benne */
  Benne = 'BENNE',
  /** Citerne */
  Citerne = 'CITERNE',
  /** Fut */
  Fut = 'FUT',
  /** GRV */
  Grv = 'GRV',
  /** Conditionné pour pipeline */
  Pipeline = 'PIPELINE'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['String']>;
};

/** Identification des parcelles cadastrales */
export type ParcelNumber = {
  __typename?: 'ParcelNumber';
  /** Ville */
  city: Scalars['String'];
  /** Numéro de parcelle cadastrale */
  number?: Maybe<Scalars['String']>;
  /** Code postal */
  postalCode: Scalars['String'];
  /** Prefixe cadastral */
  prefix?: Maybe<Scalars['String']>;
  /** Numéro de section cadastrale */
  section?: Maybe<Scalars['String']>;
  /** Coordonnée X au format WGS 84, en cas de domaine non cadastré */
  x?: Maybe<Scalars['Float']>;
  /** Coordonnée Y au format WGS 84, en cas de domaine non cadastré */
  y?: Maybe<Scalars['Float']>;
};

/** Payload lié au numéro de parcelle cadastrale */
export type ParcelNumberInput = {
  /** Ville */
  city: Scalars['String'];
  /** Numéro de parcelle cadastrale */
  number?: InputMaybe<Scalars['String']>;
  /** Code postal */
  postalCode: Scalars['String'];
  /** Prefixe cadastral */
  prefix?: InputMaybe<Scalars['String']>;
  /** Numéro de section cadastrale */
  section?: InputMaybe<Scalars['String']>;
  /** Coordonnée X au format WGS 84, à utiliser uniquement en cas de domaine non cadastré */
  x?: InputMaybe<Scalars['Float']>;
  /** Coordonnée Y au format WGS 84, à utiliser uniquement en cas de domaine non cadastré */
  y?: InputMaybe<Scalars['Float']>;
};

/** Informations sur une adresse d'enlèvement */
export type PickupSite = {
  __typename?: 'PickupSite';
  address?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  infos?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  postalCode?: Maybe<Scalars['String']>;
};

export type PickupSiteInput = {
  address?: InputMaybe<Scalars['String']>;
  city?: InputMaybe<Scalars['String']>;
  infos?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  postalCode?: InputMaybe<Scalars['String']>;
};

/** Payload permettant le rattachement d'un établissement à un utilisateur */
export type PrivateCompanyInput = {
  /** Adresse de l'établissement */
  address: Scalars['String'];
  /** L'entreprise autorise l'enlèvement d'un Dasri sans sa signature */
  allowBsdasriTakeOverWithoutSignature?: InputMaybe<Scalars['Boolean']>;
  /** Récipissé courtier (le cas échéant, pour les profils courtier) */
  brokerReceiptId?: InputMaybe<Scalars['String']>;
  /** Code NAF */
  codeNaf?: InputMaybe<Scalars['String']>;
  /** Nom de l'établissement */
  companyName: Scalars['String'];
  /** Profil de l'établissement */
  companyTypes: Array<CompanyType>;
  /** Prénom et nom du contact dans l'entreprise */
  contact?: InputMaybe<Scalars['String']>;
  /** Email de contact */
  contactEmail?: InputMaybe<Scalars['String']>;
  /** Numéro de téléphone de contact */
  contactPhone?: InputMaybe<Scalars['String']>;
  /** Liste des agréments de l'éco-organisme */
  ecoOrganismeAgreements?: InputMaybe<Array<Scalars['URL']>>;
  /** Identifiant GEREP de l'établissement */
  gerepId?: InputMaybe<Scalars['String']>;
  /** Nom d'usage de l'établissement */
  givenName?: InputMaybe<Scalars['String']>;
  /** SIRET de l'établissement */
  siret?: InputMaybe<Scalars['String']>;
  /** Récipissé négociant (le cas échéant, pour les profils négociant) */
  traderReceiptId?: InputMaybe<Scalars['String']>;
  /** Récipissé transporteur (le cas échéant, pour les profils transporteur) */
  transporterReceiptId?: InputMaybe<Scalars['String']>;
  /** TVA de l'établissement */
  vatNumber?: InputMaybe<Scalars['String']>;
  /** Agrément VHU broyeur (le cas échéant, pour les profils VHU) */
  vhuAgrementBroyeurId?: InputMaybe<Scalars['String']>;
  /** Agrément VHU démolisseur (le cas échéant, pour les profils VHU) */
  vhuAgrementDemolisseurId?: InputMaybe<Scalars['String']>;
};

/** Payload de traitement d'un BSD */
export type ProcessedFormInput = {
  /** Mode de traitement */
  destinationOperationMode?: InputMaybe<OperationMode>;
  /** Destination ultérieure prévue (case 12) */
  nextDestination?: InputMaybe<NextDestinationInput>;
  /** Si oui ou non il y a eu perte de traçabalité */
  noTraceability?: InputMaybe<Scalars['Boolean']>;
  /** Date à laquelle le déchet a été traité */
  processedAt: Scalars['DateTime'];
  /** Personne en charge du traitement */
  processedBy: Scalars['String'];
  /**
   * Description de l'opération d’élimination / valorisation (case 11)
   * Elle se complète automatiquement lorsque non fournie
   */
  processingOperationDescription?: InputMaybe<Scalars['String']>;
  /** Traitement réalisé (code D/R) */
  processingOperationDone: Scalars['String'];
};

/** Type de quantité lors de l'émission */
export enum QuantityType {
  /** Quantité estimée */
  Estimated = 'ESTIMATED',
  /** Quntité réelle */
  Real = 'REAL'
}

/** Views of the Company ressource for the admin panel */
export type Query = {
  __typename?: 'Query';
  /**
   * USAGE INTERNE
   * Liste tous les tokens peronnels générés
   */
  accessTokens: Array<AccessToken>;
  /**
   * Registre de déchets "exhaustif" permettant d'exporter l'intégralité
   * des déchets sortants, entrants, collectés ou gérés, trié par la date
   * d'expédition du déchet.
   */
  allWastes: AllWasteConnection;
  /**
   * USAGE INTERNE > Mon Compte > Générer un token
   * Renvoie un token permettant de s'authentifier à l'API Trackdéchets
   */
  apiKey: Scalars['String'];
  /** Renvoie des BSD candidats à un regroupement dans une annexe 2 */
  appendixForms: Array<Form>;
  application?: Maybe<Application>;
  /**
   * USAGE INTERNE
   * Liste toutes les applications tierces ayant accès à mon compte
   */
  authorizedApplications: Array<AuthorizedApplication>;
  bsda: Bsda;
  /**
   * Renvoie un token pour télécharger un pdf de bordereau
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  bsdaPdf: FileDownload;
  /** Renvoie les demandes de révisions Bsda associées à un SIRET (demandes soumises et approbations requises) */
  bsdaRevisionRequests: BsdaRevisionRequestConnection;
  bsdas: BsdaConnection;
  bsdasri: Bsdasri;
  /**
   * Renvoie un token pour télécharger un pdf de bordereau
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  bsdasriPdf: FileDownload;
  /**
   * Renvoie les Bsdasris.
   * Par défaut, les dasris des différentes companies de l'utilisateur sont renvoyés.
   */
  bsdasris: BsdasriConnection;
  bsds: BsdConnection;
  /** Retourne un bordereau avec l'identifiant donné. */
  bsff: Bsff;
  /**
   * Renvoie les informations sur un contenant ainsi que sur la traçabilité
   * du contenu (BSFFs antérieurs et BSFFs ultérieurs dans la chaîne de traçabilité)
   */
  bsffPackaging: BsffPackaging;
  /**
   * Retourne tous les contenants qui apparaissent sur un BSFF visant un des établissements
   * de l'utilisateur connecté, en respectant les différents filtres. Cette query permet
   * notamment à un centre de tri, transit, regroupement de récupérer les contenants présent sur
   * son site éligibles au regroupement, réexpédition, ou reconditionnement.
   */
  bsffPackagings: BsffPackagingConnection;
  /** Retourne un lien de téléchargement au format PDF du bordereau avec l'identifiant donné. */
  bsffPdf: FileDownload;
  /** Retourne tous les bordereaux de l'utilisateur connecté, en respectant les différents filtres. */
  bsffs: BsffConnection;
  bsvhu: Bsvhu;
  /**
   * Renvoie un token pour télécharger un pdf de bordereau
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  bsvhuPdf: FileDownload;
  /**
   * Tous les arguments sont optionnels.
   * Par défaut, retourne les 50 premiers bordereaux associés à entreprises dont vous êtes membres
   */
  bsvhus: BsvhuConnection;
  /** List companies for the company verfication table of the admin panel */
  companiesForVerification: CompanyForVerificationConnection;
  /**
   * Renvoie des informations autorisées à la diffusion publique sur un établissement
   * Les informations proviennent de l'INSEE (Sirene) ou de la base européenne VIES
   * pour les numéros de TVA intracommunautaires (entreprises hors France)
   * ainsi que de la base des installations classées pour la protection de l'environnement (ICPE)
   */
  companyInfos: CompanyPublic;
  /**
   * Renvoie des informations restreintes sur un établissement
   * selon la même recherche par siret ou TVA que companyInfos
   */
  companyPrivateInfos: CompanySearchPrivate;
  /** Renvoie la liste des éco-organismes */
  ecoOrganismes: Array<EcoOrganisme>;
  /**
   * Renvoie les établissements favoris de l'utilisateur. C'est à dire les
   * établissements qui font souvent partis des BSD édités
   */
  favorites: Array<CompanySearchResult>;
  /** Renvoie un BSD sélectionné par son ID (opaque ou lisible, l'un des deux doit être fourni) */
  form: Form;
  /**
   * Renvoie un token pour télécharger un pdf de BSD
   * Ce token doit être transmis à la route /download pour obtenir le fichier.
   * Il est valable 10 secondes
   */
  formPdf: FileDownload;
  /** Renvoie les demandes de révisions BSDD associées à un SIRET (demandes soumises et approbations requises) */
  formRevisionRequests: FormRevisionRequestConnection;
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
   * - les résultats sont paginés par 50. Il est possible de modifier cette valeur via `first` ou `last` en fonction du curseur utilisé
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
   * DEPRECATED - Renvoie un lien de téléchargement pour télécharger le registre BSDD
   * Le lien est valable 10 secondes
   * @deprecated Utiliser wastesDownloadLink
   */
  formsRegister: FileDownload;
  /**
   * Registre de déchets entrants, trié par date de réception
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884574
   */
  incomingWastes: IncomingWasteConnection;
  /**
   * USAGE INTERNE
   * Recherche une invitation à rejoindre une entreprise
   * par son hash
   */
  invitation?: Maybe<Invitation>;
  /**
   * Registre de déchets gérés, trié par date d'expédition du déchet
   * (la date d'acquisition ou de début de gestion du déchet n'apparaissant pas
   * sur les bordereaux de suivi de déchet, il n'est pas possible de trier
   * le registre suivant cette date)
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884599
   */
  managedWastes: ManagedWasteConnection;
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
  membershipRequest: MembershipRequest;
  myApplications: Array<Application>;
  /**
   * Liste paginée des établissements de l'utilisateur authentifié triée par ordre alphabétique
   * du nom usuel et par défaut par date de création de l'établissement
   */
  myCompanies: CompanyPrivateConnection;
  /**
   * Registre de déchets sortants, trié par date d'expédition du déchet
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884583
   */
  outgoingWastes: OutgoingWasteConnection;
  /**
   * USAGE INTERNE
   * Vérifie la validité d'un lien de changement de mot de passe par son hash
   */
  passwordResetRequest?: Maybe<Scalars['ID']>;
  /**
   * Effectue une recherche floue sur la base SIRENE et enrichie
   * avec des informations provenant de Trackdéchets
   * Si vous envoyez un numéro de SIRET ou de TVA la recherche renverra un seul item
   * idendique à celui de la requête companyInfos (ignorant alors le champ department).
   */
  searchCompanies: Array<CompanySearchResult>;
  /**
   * DEPRECATED - Renvoie des statistiques sur le volume de déchets entrant et sortant
   * @deprecated Ne fonctionne pas avec des comptes utilisateurs ayant de nombreux établissements
   */
  stats: Array<CompanyStat>;
  /**
   * Registre de déchets collectés, trié par date de prise en charge du déchet
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884592
   */
  transportedWastes: TransportedWasteConnection;
  /**
   * USAGE INTERNE
   * Message d'avertissement à afficher à l'utilisateur.
   * Par exemple lorsqu'un administrateur personnifie un compte utilisateur.
   */
  warningMessage?: Maybe<Scalars['String']>;
  /** Renvoie un lien permettant de télécharger un registre au format CSV */
  wastesRegistryCsv: FileDownload;
  /** Renvoie un lien permettant de télécharger un registre au format Excel */
  wastesRegistryXls: FileDownload;
  webhooksetting: WebhookSetting;
  /**
   * Renvoie les WebhooksSettings.
   * Les WebhooksSettings des différentes companies de l'utilisateur sont renvoyés.
   */
  webhooksettings: WebhookSettingConnection;
};


/** Views of the Company ressource for the admin panel */
export type QueryAllWastesArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  sirets: Array<Scalars['String']>;
  where?: InputMaybe<WasteRegistryWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryAppendixFormsArgs = {
  siret: Scalars['String'];
  wasteCode?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryApplicationArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdaArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdaPdfArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdaRevisionRequestsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  siret: Scalars['String'];
  where?: InputMaybe<BsdaRevisionRequestWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdasArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<BsdaWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdasriArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdasriPdfArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdasrisArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<BsdasriWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryBsdsArgs = {
  after?: InputMaybe<Scalars['String']>;
  clue?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<OrderBy>;
  where?: InputMaybe<BsdWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryBsffArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsffPackagingArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsffPackagingsArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<BsffPackagingWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryBsffPdfArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsffsArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<BsffWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryBsvhuArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsvhuPdfArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryBsvhusArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<BsvhuWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryCompaniesForVerificationArgs = {
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<CompanyForVerificationWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryCompanyInfosArgs = {
  clue?: InputMaybe<Scalars['String']>;
  siret?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryCompanyPrivateInfosArgs = {
  clue: Scalars['String'];
};


/** Views of the Company ressource for the admin panel */
export type QueryFavoritesArgs = {
  allowForeignCompanies?: InputMaybe<Scalars['Boolean']>;
  orgId: Scalars['String'];
  type: FavoriteType;
};


/** Views of the Company ressource for the admin panel */
export type QueryFormArgs = {
  id?: InputMaybe<Scalars['ID']>;
  readableId?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryFormPdfArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryFormRevisionRequestsArgs = {
  after?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  siret: Scalars['String'];
  where?: InputMaybe<FormRevisionRequestWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryFormsArgs = {
  cursorAfter?: InputMaybe<Scalars['ID']>;
  cursorBefore?: InputMaybe<Scalars['ID']>;
  customId?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  hasNextStep?: InputMaybe<Scalars['Boolean']>;
  last?: InputMaybe<Scalars['Int']>;
  roles?: InputMaybe<Array<FormRole>>;
  sentAfter?: InputMaybe<Scalars['String']>;
  siret?: InputMaybe<Scalars['String']>;
  siretPresentOnForm?: InputMaybe<Scalars['String']>;
  skip?: InputMaybe<Scalars['Int']>;
  status?: InputMaybe<Array<FormStatus>>;
  updatedAfter?: InputMaybe<Scalars['String']>;
  wasteCode?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryFormsLifeCycleArgs = {
  cursorAfter?: InputMaybe<Scalars['String']>;
  cursorBefore?: InputMaybe<Scalars['String']>;
  formId?: InputMaybe<Scalars['ID']>;
  loggedAfter?: InputMaybe<Scalars['String']>;
  loggedBefore?: InputMaybe<Scalars['String']>;
  siret?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryFormsRegisterArgs = {
  endDate?: InputMaybe<Scalars['DateTime']>;
  exportFormat?: InputMaybe<FormsRegisterExportFormat>;
  exportType?: InputMaybe<FormsRegisterExportType>;
  sirets: Array<Scalars['String']>;
  startDate?: InputMaybe<Scalars['DateTime']>;
  wasteCode?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryIncomingWastesArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  sirets: Array<Scalars['String']>;
  where?: InputMaybe<WasteRegistryWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryInvitationArgs = {
  hash: Scalars['String'];
};


/** Views of the Company ressource for the admin panel */
export type QueryManagedWastesArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  sirets: Array<Scalars['String']>;
  where?: InputMaybe<WasteRegistryWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryMembershipRequestArgs = {
  id?: InputMaybe<Scalars['ID']>;
  siret?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryMyCompaniesArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  search?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryOutgoingWastesArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  sirets: Array<Scalars['String']>;
  where?: InputMaybe<WasteRegistryWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryPasswordResetRequestArgs = {
  hash: Scalars['String'];
};


/** Views of the Company ressource for the admin panel */
export type QuerySearchCompaniesArgs = {
  allowForeignCompanies?: InputMaybe<Scalars['Boolean']>;
  clue: Scalars['String'];
  department?: InputMaybe<Scalars['String']>;
};


/** Views of the Company ressource for the admin panel */
export type QueryTransportedWastesArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  sirets: Array<Scalars['String']>;
  where?: InputMaybe<WasteRegistryWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryWastesRegistryCsvArgs = {
  registryType: WasteRegistryType;
  sirets: Array<Scalars['String']>;
  where?: InputMaybe<WasteRegistryWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryWastesRegistryXlsArgs = {
  registryType: WasteRegistryType;
  sirets: Array<Scalars['String']>;
  where?: InputMaybe<WasteRegistryWhere>;
};


/** Views of the Company ressource for the admin panel */
export type QueryWebhooksettingArgs = {
  id: Scalars['ID'];
};


/** Views of the Company ressource for the admin panel */
export type QueryWebhooksettingsArgs = {
  after?: InputMaybe<Scalars['ID']>;
  before?: InputMaybe<Scalars['ID']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

/** Payload de réception d'un BSD */
export type ReceivedFormInput = {
  /**
   * Quantité réelle présentée en tonnes (case 10).
   *
   * Doit être supérieure à 0 lorsque le déchet est accepté.
   * Doit être égale à 0 lorsque le déchet est refusé.
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantityReceived?: InputMaybe<Scalars['Float']>;
  /** Date à laquelle le déchet a été reçu (case 10) */
  receivedAt: Scalars['DateTime'];
  /** Nom de la personne en charge de la réception du déchet (case 10) */
  receivedBy: Scalars['String'];
  /** Date à laquelle le déchet a été accepté ou refusé (case 10) */
  signedAt?: InputMaybe<Scalars['DateTime']>;
  /** Statut d'acceptation du déchet (case 10) */
  wasteAcceptationStatus?: InputMaybe<WasteAcceptationStatus>;
  /** Raison du refus (case 10). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: InputMaybe<Scalars['String']>;
};

/**
 * Installation de destination ou d'entreprosage
 * ou de reconditionnement prévue (case 2)
 */
export type Recipient = {
  __typename?: 'Recipient';
  /** N° de CAP (le cas échéant) */
  cap?: Maybe<Scalars['String']>;
  /** Établissement de destination */
  company?: Maybe<FormCompany>;
  /** Indique si c'est un établissement d'entreposage temporaire ou de reocnditionnement */
  isTempStorage?: Maybe<Scalars['Boolean']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: Maybe<Scalars['String']>;
};

/**
 * Payload lié à l'installation de destination ou d'entreprosage
 * ou de reconditionnement prévue (case 2)
 */
export type RecipientInput = {
  /** N° de CAP (le cas échéant) */
  cap?: InputMaybe<Scalars['String']>;
  /** Établissement de destination */
  company?: InputMaybe<CompanyInput>;
  /** Si c'est un entreprosage provisoire ou reconditionnement */
  isTempStorage?: InputMaybe<Scalars['Boolean']>;
  /** Opération d'élimination / valorisation prévue (code D/R) */
  processingOperation?: InputMaybe<Scalars['String']>;
};

/** Payload lié au détails du déchet du BSD suite (case 14 à 19) */
export type ResealedFormInput = {
  /** Destination finale du déchet (case 14) */
  destination?: InputMaybe<DestinationInput>;
  /** Transporteur du déchet reconditionné */
  transporter?: InputMaybe<TransporterInput>;
  /** Détail du déchet en cas de reconditionnement (case 15 à 19) */
  wasteDetails?: InputMaybe<WasteDetailsRepackagingInput>;
};

export type ResendActivationEmailInput = {
  captcha: CaptchaInput;
  email: Scalars['String'];
};

/** Payload lié au détails du déchet du BSD suite et à la signature de l'envoi (case 14 à 20) */
export type ResentFormInput = {
  /** Destination finale du déchet (case 14) */
  destination?: InputMaybe<DestinationInput>;
  /** Date de signature du BSD suite (case 19). Défaut à la date d'aujourd'hui. */
  signedAt: Scalars['DateTime'];
  /** Nom du signataire du BSD suite  (case 19) */
  signedBy: Scalars['String'];
  /** Transporteur du déchet reconditionné */
  transporter?: InputMaybe<TransporterInput>;
  /** Détail du déchet en cas de reconditionnement (case 15 à 19) */
  wasteDetails?: InputMaybe<WasteDetailsRepackagingInput>;
};

/** Statut d'une demande d'approbation sur une révision */
export enum RevisionRequestApprovalStatus {
  /** Acceptée */
  Accepted = 'ACCEPTED',
  /** Annulée - quand un des approbateurs refuse la révision, toutes les approbations en attente sont annulées et la révision est refusée */
  Canceled = 'CANCELED',
  /** En attente de validation */
  Pending = 'PENDING',
  /** Refusée */
  Refused = 'REFUSED'
}

/** Statut d'une demande de révision */
export enum RevisionRequestStatus {
  /** Acceptée */
  Accepted = 'ACCEPTED',
  /** En attente de validation */
  Pending = 'PENDING',
  /** Refusée */
  Refused = 'REFUSED'
}

/**
 * Rubrique ICPE d'un établissement avec les autorisations associées
 * Pour plus de détails, se référer à la
 * [nomenclature des ICPE](https://www.georisques.gouv.fr/articles-risques/les-installations-classees-pour-la-protection-de-lenvironnement#nomenclature-des-installations-classees)
 */
export type Rubrique = {
  __typename?: 'Rubrique';
  /**
   * Description de l'activité:
   * Ex: traitement thermique de déchets dangereux
   */
  activite?: Maybe<Scalars['String']>;
  /** Alinéa pour la rubrique concerné */
  alinea?: Maybe<Scalars['String']>;
  /** Catégorie d'établissement associé: TTR, VHU, Traitement */
  category: Scalars['String'];
  /** État de l'activité, ex: 'En fonct', 'À l'arrêt' */
  etatActivite?: Maybe<Scalars['String']>;
  /** Régime autorisé pour la rubrique: déclaratif, autorisation, seveso, etc */
  regimeAutorise?: Maybe<Scalars['String']>;
  /**
   * Numéro de rubrique tel que défini dans la nomenclature des ICPE
   * Ex: 2710
   */
  rubrique: Scalars['String'];
  /** Unité utilisé pour le volume autorisé */
  unite?: Maybe<Scalars['String']>;
  /** Volume autorisé */
  volume?: Maybe<Scalars['String']>;
  /** Type de déchets autorisé */
  wasteType?: Maybe<WasteType>;
};

export type SendVerificationCodeLetterInput = {
  siret: Scalars['String'];
};

export type SignEmissionFormInput = {
  /** Date de signature de l'émetteur */
  emittedAt: Scalars['DateTime'];
  /** Nom de la personne signant pour l'émetteur */
  emittedBy: Scalars['String'];
  /** Si c'est l'éco-organisme qui a signé ou pas */
  emittedByEcoOrganisme?: InputMaybe<Scalars['Boolean']>;
  /** Code ONU */
  onuCode?: InputMaybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos?: InputMaybe<Array<PackagingInfoInput>>;
  /**
   * Poids en tonnes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantity: Scalars['Float'];
  /** Numéro de la plaque d'immatriculation transporteur */
  transporterNumberPlate?: InputMaybe<Scalars['String']>;
};

export type SignTransportFormInput = {
  /** Date de signature du transporteur */
  takenOverAt: Scalars['DateTime'];
  /** Nom de la personne signant pour le transporteur */
  takenOverBy: Scalars['String'];
  /** Numéro de la plaque d'immatriculation transporteur */
  transporterNumberPlate?: InputMaybe<Scalars['String']>;
};

export type Signature = {
  __typename?: 'Signature';
  author?: Maybe<Scalars['String']>;
  date?: Maybe<Scalars['DateTime']>;
};

/** Dénomination de l'auteur de la signature */
export enum SignatureAuthor {
  /** L'auteur de la signature est l'éco-organisme figurant sur le BSD */
  EcoOrganisme = 'ECO_ORGANISME',
  /** L'auteur de la signature est l'émetteur du déchet */
  Emitter = 'EMITTER'
}

/**
 * Automatisation de la signature pour les annexes 1.
 * Permet à une entreprise de ne pas avoir à signer la collecte de ses annexes.
 * Si l'entreprise ciblée collecte l'annexe 1, Trackdéchets signera automatiquement pour l'entreprise émettrice.
 */
export type SignatureAutomation = {
  __typename?: 'SignatureAutomation';
  /** Date de création de l'automatisation de signature */
  createdAt: Scalars['DateTime'];
  /** Entreprise qui met en place l'automatisation */
  from: CompanyPublic;
  id: Scalars['ID'];
  /** Entreprise qui, si collecteur, déclenche la signature automatique */
  to: CompanyPublic;
};

/**
 * Payload pour permettre à une entreprise de ne pas avoir à signer la collecte de ses annexes 1.
 * Si l'entreprise ciblée collecte l'annexe 1, Trackdéchets signera automatiquement pour l'entreprise émettrice.
 */
export type SignatureAutomationInput = {
  /** ID de l'entreprise qui donne délégation */
  from: Scalars['ID'];
  /** ID de l'entreprise qui a délégation */
  to: Scalars['ID'];
};

/** Payload simplifié de signature d'un BSD par un transporteur */
export type SignatureFormInput = {
  /** Date de l'envoi du déchet par l'émetteur et de prise en charge du déchet par le transporteur */
  sentAt: Scalars['DateTime'];
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars['String'];
};

export type SignatureInput = {
  author: Scalars['String'];
  date: Scalars['DateTime'];
};

export enum SignatureTypeInput {
  Emission = 'EMISSION',
  Operation = 'OPERATION',
  Transport = 'TRANSPORT'
}

/** Filtre pour les signatures */
export type SignatureWhere = {
  date?: InputMaybe<DateFilter>;
};

export type SignupInput = {
  /** Email de l'utilisateur */
  email: Scalars['String'];
  /** Nom de l'utilisateur */
  name: Scalars['String'];
  /** Mot de passe de l'utilisateur */
  password: Scalars['String'];
  /** Numéro de téléphone de l'utilisateur */
  phone?: InputMaybe<Scalars['String']>;
};

/** Statistiques */
export type Stat = {
  __typename?: 'Stat';
  /** Quantité entrante en tonnes */
  incoming: Scalars['Float'];
  /** Qantité sortante */
  outgoing: Scalars['Float'];
  /** Code déchet */
  wasteCode: Scalars['String'];
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
  /** Prochaine entreprise à émettre le déchet (entreprise en case 1 ou 13) */
  emitter?: Maybe<FormCompany>;
  /** Date de la dernière action sur le bordereau */
  lastActionOn?: Maybe<Scalars['DateTime']>;
  /** Code ONU le plus à jour */
  onuCode?: Maybe<Scalars['String']>;
  /** Packaging le plus à jour */
  packagingInfos: Array<PackagingInfo>;
  /**
   * DEPRECATED Packaging le plus à jour
   * @deprecated Utiliser packagingInfos
   */
  packagings: Array<Packagings>;
  /** Quantité la plus à jour (en tonnes) */
  quantity?: Maybe<Scalars['Float']>;
  /** Prochaine entreprise à recevoir le déchet (entreprise en case 2 ou 14) */
  recipient?: Maybe<FormCompany>;
  /** Prochaine entreprise à transporter le déchet (entreprise en case 8 ou 18) */
  transporter?: Maybe<FormCompany>;
  /** Information libre, destinée aux transporteurs */
  transporterCustomInfo?: Maybe<Scalars['String']>;
  /** Numéro de plaque d'immatriculation */
  transporterNumberPlate?: Maybe<Scalars['String']>;
};

/** Changement de statut d'un bordereau */
export type StatusLog = {
  __typename?: 'StatusLog';
  /** BSD concerné */
  form?: Maybe<StatusLogForm>;
  /** Identifiant du log */
  id?: Maybe<Scalars['ID']>;
  /** Date à laquelle le changement de statut a été effectué */
  loggedAt?: Maybe<Scalars['DateTime']>;
  /** Statut du bordereau après le changement de statut */
  status?: Maybe<FormStatus>;
  /** Valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription) */
  updatedFields?: Maybe<Scalars['JSON']>;
  /** Utilisateur à l'origine de la modification */
  user?: Maybe<StatusLogUser>;
};

/** Information sur un BSD dans les logs de modifications de statuts */
export type StatusLogForm = {
  __typename?: 'StatusLogForm';
  /** Identifiant du BSD */
  id?: Maybe<Scalars['ID']>;
  /**
   * N° du bordereau
   * @deprecated Le readableId apparaît sur le CERFA mais l'id doit être utilisé comme identifiant.
   */
  readableId?: Maybe<Scalars['String']>;
};

/** Utilisateur ayant modifié le BSD */
export type StatusLogUser = {
  __typename?: 'StatusLogUser';
  email?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
};

export enum StatutDiffusionEtablissement {
  N = 'N',
  O = 'O'
}

/** Filtre pour les chaîne de caractères */
export type StringFilter = {
  /** La chaîne de caractère de l'enregistrement contient la valeur du filtre */
  _contains?: InputMaybe<Scalars['String']>;
  /** La chaîne de caractère de l'enregistrement doit correspondre exactement à la valeur du filtre */
  _eq?: InputMaybe<Scalars['String']>;
  /** La chaîne de caractère de l'enregistrement existe dans la liste du filtre */
  _in?: InputMaybe<Array<Scalars['String']>>;
};

/** Filtre pour les listes de chaînes de caractères */
export type StringNullableListFilter = {
  /** La liste correspond exactement à la liste fournie. N'est pas implémenté dans la query `bsds` */
  _eq?: InputMaybe<Array<Scalars['String']>>;
  /** La valeur est présente dans la liste */
  _has?: InputMaybe<Scalars['String']>;
  /** Toutes les valeurs existes dans la liste */
  _hasEvery?: InputMaybe<Array<Scalars['String']>>;
  /** Au moins une valeur existe dans la liste */
  _hasSome?: InputMaybe<Array<Scalars['String']>>;
  /**
   * Au moins une valeur existe dans la liste
   * @deprecated use _hasSome instead
   */
  _in?: InputMaybe<Array<Scalars['String']>>;
  /** La chaîne de caractère est contenu dans au moins un élément de la liste. N'est impléménté que sur la query `bsds` */
  _itemContains?: InputMaybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /**
   * DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`
   *
   * Permet de s'abonner aux changements de statuts d'un BSD
   */
  forms?: Maybe<FormSubscription>;
};


export type SubscriptionFormsArgs = {
  token: Scalars['String'];
};

/** Payload de prise en charge de segment */
export type TakeOverInput = {
  numberPlate?: InputMaybe<Scalars['String']>;
  takenOverAt: Scalars['DateTime'];
  takenOverBy: Scalars['String'];
};

export type TempStoredFormInput = {
  /**
   * Quantité réelle présentée en tonnes (case 13)
   *
   * Doit être supérieure à 0 lorsque le déchet est accepté.
   * Doit être égale à 0 lorsque le déchet est refusé.
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantityReceived: Scalars['Float'];
  /** Réelle ou estimée */
  quantityType: QuantityType;
  /** Date à laquelle le déchet a été reçu (case 13) */
  receivedAt: Scalars['DateTime'];
  /** Nom de la personne en charge de la réception du déchet (case 13) */
  receivedBy: Scalars['String'];
  /** Date à laquelle le déchet a été accepté ou refusé (case 13). Défaut à la date d'aujourd'hui. */
  signedAt?: InputMaybe<Scalars['DateTime']>;
  /** Statut d'acceptation du déchet (case 13) */
  wasteAcceptationStatus?: InputMaybe<WasteAcceptationStatus>;
  /** Raison du refus (case 13). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: InputMaybe<Scalars['String']>;
};

export type TempStorerAcceptedFormInput = {
  /**
   * Quantité réelle présentée en tonnes (case 13)
   *
   * Doit être supérieure à 0 lorsque le déchet est accepté.
   * Doit être égale à 0 lorsque le déchet est refusé.
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantityReceived: Scalars['Float'];
  /** Réelle ou estimée */
  quantityType: QuantityType;
  /** Date à laquelle le déchet a été accepté ou refusé (case 13). */
  signedAt: Scalars['DateTime'];
  /** Nom de la personne en charge de l'acceptation du déchet (case 13) */
  signedBy: Scalars['String'];
  /** Statut d'acceptation du déchet (case 13) */
  wasteAcceptationStatus: WasteAcceptationStatus;
  /** Raison du refus (case 13). Obligatoire en cas de refus de déchet */
  wasteRefusalReason?: InputMaybe<Scalars['String']>;
};

/** Données du BSD suite sur la partie entreposage provisoire ou reconditionnement, rattachées à un BSD existant */
export type TemporaryStorageDetail = {
  __typename?: 'TemporaryStorageDetail';
  /**
   * Installation de destination prévue (case 14) à remplir par le producteur ou
   * le site d'entreposage provisoire
   */
  destination?: Maybe<Destination>;
  /** Date à laquelle l'entreposage provisoire a signé l'enlèvement. */
  emittedAt?: Maybe<Scalars['DateTime']>;
  /** Nom de la personne qui a signé l'enlèvement pour l'entreposage provisoire. */
  emittedBy?: Maybe<Scalars['String']>;
  /**
   * Date de signature du BSD suite (case 19)
   * @deprecated Remplacé par takenOverAt
   */
  signedAt?: Maybe<Scalars['DateTime']>;
  /**
   * Nom du signataire du BSD suite  (case 19)
   * @deprecated Remplacé par emittedBy
   */
  signedBy?: Maybe<Scalars['String']>;
  /** Date à laquelle le transporteur a signé l'enlèvement. */
  takenOverAt?: Maybe<Scalars['DateTime']>;
  /** Nom de la personne qui a signé l'enlèvement pour le transporteur. */
  takenOverBy?: Maybe<Scalars['String']>;
  /** Établissement qui stocke temporairement le déchet (case 13) */
  temporaryStorer?: Maybe<TemporaryStorer>;
  /** Transporteur du déchet (case 18) */
  transporter?: Maybe<Transporter>;
  /** Détails du déchet (cases 15, 16 et 17) */
  wasteDetails?: Maybe<WasteDetails>;
};

export type TemporaryStorageDetailInput = {
  destination?: InputMaybe<DestinationInput>;
};

export type TemporaryStorer = {
  __typename?: 'TemporaryStorer';
  /** Quantité reçue en tonnes */
  quantityReceived?: Maybe<Scalars['Float']>;
  quantityType?: Maybe<QuantityType>;
  receivedAt?: Maybe<Scalars['DateTime']>;
  receivedBy?: Maybe<Scalars['String']>;
  wasteAcceptationStatus?: Maybe<WasteAcceptationStatus>;
  wasteRefusalReason?: Maybe<Scalars['String']>;
};

/** Filtre pour les champs textuels */
export type TextFilter = {
  /** Le texte de l'enregistrement a une correspondance en recherche textuelle avec la valeur du filtre */
  _match?: InputMaybe<Scalars['String']>;
};

/** Négociant (case 7) */
export type Trader = {
  __typename?: 'Trader';
  /** Établissement négociant */
  company?: Maybe<FormCompany>;
  /** Département */
  department?: Maybe<Scalars['String']>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars['String']>;
  /** Limite de validité */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

/** Payload lié au négociant */
export type TraderInput = {
  /** Établissement négociant */
  company?: InputMaybe<CompanyInput>;
  /** Département */
  department?: InputMaybe<Scalars['String']>;
  /** N° de récipissé */
  receipt?: InputMaybe<Scalars['String']>;
  /** Limite de validité */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Récépissé négociant */
export type TraderReceipt = {
  __typename?: 'TraderReceipt';
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
  id: Scalars['ID'];
  /** Numéro de récépissé négociant */
  receiptNumber: Scalars['String'];
  /** Limite de validité du récépissé */
  validityLimit: Scalars['DateTime'];
};

export enum TransportMode {
  Air = 'AIR',
  Other = 'OTHER',
  Rail = 'RAIL',
  River = 'RIVER',
  Road = 'ROAD',
  Sea = 'SEA'
}

export type TransportSegment = {
  __typename?: 'TransportSegment';
  id: Scalars['ID'];
  /** Mode de transport */
  mode?: Maybe<TransportMode>;
  /** Siret ou numéro de TVA intra-communautaire du transporteur précédent */
  previousTransporterCompanySiret?: Maybe<Scalars['String']>;
  /** Prêt à être pris en charge */
  readyToTakeOver?: Maybe<Scalars['Boolean']>;
  /** Numéro du segment */
  segmentNumber?: Maybe<Scalars['Int']>;
  /** Date de prise en charge */
  takenOverAt?: Maybe<Scalars['DateTime']>;
  /** Reponsable de la prise en charge */
  takenOverBy?: Maybe<Scalars['String']>;
  /** Transporteur du segment */
  transporter?: Maybe<Transporter>;
};

/**
 * Déchet collecté : https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884592.
 * Les champs notés "Extra" ne figurent pas dans l'arrêté registre.
 */
export type TransportedWaste = {
  __typename?: 'TransportedWaste';
  /** La raison sociale du courtier si le déchet est géré par un courtier */
  brokerCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du courtier si le déchet est géré par un courtier */
  brokerCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du courtier mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un courtier */
  brokerRecepisseNumber?: Maybe<Scalars['String']>;
  /** Extra - Type de bordereau */
  bsdType?: Maybe<BsdType>;
  /** Extra - Date de création du bordereeau */
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Identifiant secondaire du bordereau (BSDD uniquement) */
  customId?: Maybe<Scalars['String']>;
  /** Extra - N° de CAP (Certificat d'acceptation préalable) */
  destinationCap?: Maybe<Scalars['String']>;
  /** L'adresse de l'établissement vers lequel le déchet est expédié */
  destinationCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'installation de destination */
  destinationCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de l'établissement vers lequel le déchet est expédié */
  destinationCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET de l'établissement vers lequel le déchet est expédié */
  destinationCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Date de réalisation de l'opération */
  destinationOperationDate?: Maybe<Scalars['DateTime']>;
  /** Extra - Autorisation par arrêté préfectoral, à la perte d'identification de la provenance à l'origine */
  destinationOperationNoTraceability?: Maybe<Scalars['Boolean']>;
  /** Extra - Statut d'acceptation du déchet */
  destinationReceptionAcceptationStatus?: Maybe<WasteAcceptationStatus>;
  /** La date de déchargement du déchet */
  destinationReceptionDate?: Maybe<Scalars['DateTime']>;
  /** Extra - La quantité de déchet reçu sur l'installation de destination ou d'entreposage provisoire exprimée en tonne */
  destinationReceptionWeight?: Maybe<Scalars['Float']>;
  /**
   * la raison sociale de l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeName?: Maybe<Scalars['String']>;
  /**
   * Le N°SIREN l'éco-organisme si le déchet est pris en charge par un éco-organisme mis en place dans
   * le cadre d'une filière à responsabilité élargie du producteur définie à l'article L. 541-10-1 du code de l'environnement
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006834455&dateTexte=&categorieLien=cid
   */
  ecoOrganismeSiren?: Maybe<Scalars['String']>;
  /** L'adresse de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - Adresse email de contact de l'émetteur */
  emitterCompanyMail?: Maybe<Scalars['String']>;
  /** La raison sociale de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET de la personne remettant les déchets au transporteur ou au collecteur */
  emitterCompanySiret?: Maybe<Scalars['String']>;
  /** L'adresse de prise en charge lorsqu'elle se distingue de l'adresse de l'établissement */
  emitterPickupsiteAddress?: Maybe<Scalars['String']>;
  /** Le nom du point de prise en charge lorsqu'il se distingue du nom de l'établissement */
  emitterPickupsiteName?: Maybe<Scalars['String']>;
  /**
   * Le numéro du ou des bordereaux de suivi de déchets mentionnés aux articles R. 541-45 du code de l'environnement et R. 1335-4 du code de la santé publique
   * https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006074220&idArticle=LEGIARTI000006839119&dateTexte=&categorieLien=cid
   * https://www.legifrance.gouv.fr/affichCode.do?cidTexte=LEGITEXT000006072665&dateTexte=&categorieLien=cid
   */
  id?: Maybe<Scalars['ID']>;
  /** L'adresse du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanyName?: Maybe<Scalars['String']>;
  /** Le numéro SIRET du producteur initial du déchet - optionnel lorsque les déchets proviennet de plusieurs producteurs */
  initialEmitterCompanySiret?: Maybe<Scalars['String']>;
  /** Lorsque les déchets apportés proviennent de plusieurs producteurs, le ou les codes postaux de la commune de collecte des déchets  */
  initialEmitterPostalCodes?: Maybe<Array<Scalars['String']>>;
  /** S'il s'agit, de déchets POP au sens de l'article R. 541-8 du code de l'environnement */
  pop?: Maybe<Scalars['Boolean']>;
  /** Extra - Statut du bordereau */
  status?: Maybe<Scalars['String']>;
  /** La raison sociale du négociant si le déchet est géré par un courtier */
  traderCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du négociant si le déchet est géré par un négociant */
  traderCompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro de récépissé du négociant mentionné à l'article R. 541-56 du code de l'environnement si le déchet est géré par un négociant */
  traderRecepisseNumber?: Maybe<Scalars['String']>;
  /** L'adresse du transporteur n°2 (en cas de transport multi-modal) */
  transporter2CompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°2 (en cas de transport multi-modal) */
  transporter2CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°2 (en cas de transport multi-modal) */
  transporter2CompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro d'immatriculation du ou des véhicules du transporteur n°2 (en cas de transport multi-modal) */
  transporter2NumberPlates?: Maybe<Array<Scalars['String']>>;
  /** L'adresse du transporteur n°3 (en cas de transport multi-modal) */
  transporter3CompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur n°3 (en cas de transport multi-modal) */
  transporter3CompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur n°3 (en cas de transport multi-modal) */
  transporter3CompanySiret?: Maybe<Scalars['String']>;
  /** Le numéro d'immatriculation du ou des véhicules du transporteur n°3 (en cas de transport multi-modal) */
  transporter3NumberPlates?: Maybe<Array<Scalars['String']>>;
  /** L'adresse du transporteur */
  transporterCompanyAddress?: Maybe<Scalars['String']>;
  /** La raison sociale du transporteur */
  transporterCompanyName?: Maybe<Scalars['String']>;
  /** Le N°SIRET du transporteur */
  transporterCompanySiret?: Maybe<Scalars['String']>;
  /** Extra - Champ libre fourni par le transporteur (tous les bordereaux sauf BSDD) */
  transporterCustomInfo?: Maybe<Scalars['String']>;
  /** Le numéro d'immatriculation du ou des véhicules transportant le déchet */
  transporterNumberPlates?: Maybe<Array<Scalars['String']>>;
  /** Extra - Exemption de récépissé transporteur */
  transporterRecepisseIsExempted?: Maybe<Scalars['Boolean']>;
  /** La date d'enlèvement du déchet */
  transporterTakenOverAt?: Maybe<Scalars['DateTime']>;
  /** Extra - Date de dernière modification du bordereau */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /**
   * Dans le cas de déchets dangereux, selon le cas, le code transport lié aux réglementations internationales
   * relatives au transport international des marchandises dangereuses par route, au transport international
   * ferroviaire des marchandises dangereuses, au transport de matières dangereuses sur le Rhin, ou au
   * transport maritime de marchandises dangereuses
   */
  wasteAdr?: Maybe<Scalars['String']>;
  /** Le code du déchet au regard de l'article R. 541-7 du code de l'environnement */
  wasteCode?: Maybe<Scalars['String']>;
  /** La dénomination usuelle du déchet */
  wasteDescription?: Maybe<Scalars['String']>;
  /** Extra - Certains déchets avec un code déchet sans astérisque peuvent, selon les cas, être dangereux ou non dangereux. */
  wasteIsDangerous?: Maybe<Scalars['Boolean']>;
  /** La quantité de déchet sortant en tonne */
  weight?: Maybe<Scalars['Float']>;
  /** Extra - L'adresse de l'entreprise de travaux (amiante uniquement) */
  workerCompanyAddress?: Maybe<Scalars['String']>;
  /** Extra - La raison sociale de l'entreprise de travaux (amiante uniquement) */
  workerCompanyName?: Maybe<Scalars['String']>;
  /** Extra - Le numéro SIRET de l'entreprise de travaux (amiante uniquement) */
  workerCompanySiret?: Maybe<Scalars['String']>;
};

export type TransportedWasteConnection = {
  __typename?: 'TransportedWasteConnection';
  edges: Array<TransportedWasteEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type TransportedWasteEdge = {
  __typename?: 'TransportedWasteEdge';
  cursor: Scalars['String'];
  node: TransportedWaste;
};

/** Collecteur - transporteur (case 8) */
export type Transporter = {
  __typename?: 'Transporter';
  /** Établissement collecteur - transporteur */
  company?: Maybe<FormCompany>;
  /** Information libre, destinée aux transporteurs */
  customInfo?: Maybe<Scalars['String']>;
  /** Département */
  department?: Maybe<Scalars['String']>;
  /** Identifiant du transporteur */
  id: Scalars['ID'];
  /** Exemption de récipissé */
  isExemptedOfReceipt?: Maybe<Scalars['Boolean']>;
  /** Mode de transport */
  mode?: Maybe<TransportMode>;
  /** Numéro de plaque d'immatriculation */
  numberPlate?: Maybe<Scalars['String']>;
  /** N° de récipissé */
  receipt?: Maybe<Scalars['String']>;
  /** Limite de validité du récipissé */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

/** Collecteur - transporteur */
export type TransporterInput = {
  /** Établissement collecteur - transporteur */
  company?: InputMaybe<CompanyInput>;
  /** Information libre, destinée aux transporteurs */
  customInfo?: InputMaybe<Scalars['String']>;
  /**
   * Département du récépissé. Obligatoire lorsque l'exemption de récépissé n'est pas précisée
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  department?: InputMaybe<Scalars['String']>;
  /** Exemption de récépissé */
  isExemptedOfReceipt?: InputMaybe<Scalars['Boolean']>;
  /** Mode de transport. 'Route' par défaut */
  mode?: InputMaybe<TransportMode>;
  /** Numéro de plaque d'immatriculation */
  numberPlate?: InputMaybe<Scalars['String']>;
  /**
   * N° de récipissé. Obligatoire lorsque l'exemption de récépissé n'est pas précisée
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  receipt?: InputMaybe<Scalars['String']>;
  /**
   * Limite de validité du récépissé. Obligatoire lorsque l'exemption de récépissé n'est pas précisée
   * @deprecated Ignoré - Complété par Trackdéchets en fonction des informations renseignées par l'entreprise de transport
   */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Récépissé transporteur */
export type TransporterReceipt = {
  __typename?: 'TransporterReceipt';
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
  id: Scalars['ID'];
  /** Numéro de récépissé transporteur */
  receiptNumber: Scalars['String'];
  /** Limite de validité du récépissé */
  validityLimit: Scalars['DateTime'];
};

/** Payload de signature d'un BSD par un transporteur */
export type TransporterSignatureFormInput = {
  /** Code ONU */
  onuCode?: InputMaybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos?: InputMaybe<Array<PackagingInfoInput>>;
  /** DEPRECATED - Conditionnement */
  packagings?: InputMaybe<Array<InputMaybe<Packagings>>>;
  /**
   * Poids en tonnes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantity: Scalars['Float'];
  /** Code de signature permettant d'authentifier l'émetteur */
  securityCode: Scalars['Int'];
  /** Date de l'envoi du déchet par l'émetteur et de prise en charge du déchet par le transporteur */
  sentAt: Scalars['DateTime'];
  /** Nom de la personne responsable de l'envoi du déchet (case 9) */
  sentBy: Scalars['String'];
  /** Dénomination de l'auteur de la signature, par défaut il s'agit de l'émetteur */
  signatureAuthor?: InputMaybe<SignatureAuthor>;
  /** Si oui on non le BSD a été signé par l'émetteur */
  signedByProducer: Scalars['Boolean'];
  /** Si oui ou non le BSD a été signé par un transporteur */
  signedByTransporter: Scalars['Boolean'];
};

export type UpdateApplicationInput = {
  goal?: InputMaybe<ApplicationGoal>;
  logoUrl?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  redirectUris?: InputMaybe<Array<Scalars['String']>>;
};

/** Payload d'édition d'un récépissé courtier */
export type UpdateBrokerReceiptInput = {
  /** Département ayant enregistré la déclaration */
  department?: InputMaybe<Scalars['String']>;
  /** The id of the broker receipt to modify */
  id: Scalars['ID'];
  /** Numéro de récépissé courtier */
  receiptNumber?: InputMaybe<Scalars['String']>;
  /** Limite de validité du récépissé */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

export type UpdateBsffPackagingInput = {
  /** Informations sur l'acceptation du contenant sur l'installation de destination */
  acceptation?: InputMaybe<BsffPackagingAcceptationInput>;
  /** Permet au destintaire du contenant de rectifier le numéro du contenant en cas d'erreur de saisie */
  numero?: InputMaybe<Scalars['String']>;
  /** Informations sur le traitement effectué par contenant */
  operation?: InputMaybe<BsffPackagingOperationInput>;
};

/** Payload de mise à jour d'un bordereau */
export type UpdateFormInput = {
  /**
   * Annexe 2 - Deprecated : utiliser grouping
   * @deprecated Utiliser `grouping`
   */
  appendix2Forms?: InputMaybe<Array<AppendixFormInput>>;
  /** Courtier */
  broker?: InputMaybe<BrokerInput>;
  /**
   * Identifiant personnalisé permettant de faire le lien avec un
   * objet un système d'information tierce
   */
  customId?: InputMaybe<Scalars['String']>;
  ecoOrganisme?: InputMaybe<EcoOrganismeInput>;
  /**
   * Établissement émetteur/producteur du déchet (case 1)
   *
   * NB: le siret émetteur n'est pas modifiable si le bsd comporte des bsds groupés (Annexe 2)
   */
  emitter?: InputMaybe<EmitterInput>;
  /** Bordereaux que celui-ci regroupe (Annexe 2) - Permet une utilisation partielle du bordereau initial */
  grouping?: InputMaybe<Array<InitialFormFractionInput>>;
  /** Identifiant opaque */
  id: Scalars['ID'];
  /**
   * Liste d'entreprises intermédiaires. Un intermédiaire est une entreprise qui prend part à la gestion du déchet,
   * mais pas à la responsabilité de la traçabilité (entreprise de travaux, bureau d'étude, maitre d'oeuvre,
   * collectivité, etc.) Il pourra lire ce bordereau, sans étape de signature.
   *
   * Le nombre maximal d'intermédiaires sur un bordereau est de 3.
   */
  intermediaries?: InputMaybe<Array<CompanyInput>>;
  /**
   * Installation de destination ou d’entreposage ou de reconditionnement prévue (case 2)
   * L'établissement renseigné doit être inscrit sur Trackdéchets en tant qu'installation
   * de traitement ou de tri, transit, regroupement.
   */
  recipient?: InputMaybe<RecipientInput>;
  temporaryStorageDetail?: InputMaybe<TemporaryStorageDetailInput>;
  /** Négociant (case 7) */
  trader?: InputMaybe<TraderInput>;
  /** Premier transporteur du déchet (case 8) */
  transporter?: InputMaybe<TransporterInput>;
  /**
   * Liste des différents transporteurs, dans l'ordre de prise en charge du déchet.
   * Contient un seul identifiant en cas d'acheminement direct. Peut contenir au maximum
   * 5 identifiants en cas de transport multi-modal. Les transporteurs peuvent être crées, modifiés,
   * supprimés à l'aide des mutations createFormTransporter, updateFormTransporter, deleteFormTransporter.
   */
  transporters?: InputMaybe<Array<Scalars['ID']>>;
  /** Détails du déchet (case 3 à 6) */
  wasteDetails?: InputMaybe<WasteDetailsInput>;
};

/** Payload d'édition d'un récépissé négociant */
export type UpdateTraderReceiptInput = {
  /** Département ayant enregistré la déclaration */
  department?: InputMaybe<Scalars['String']>;
  /** The id of the trader receipt to modify */
  id: Scalars['ID'];
  /** Numéro de récépissé négociant */
  receiptNumber?: InputMaybe<Scalars['String']>;
  /** Limite de validité du récépissé */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Payload d'édition d'un récépissé transporteur */
export type UpdateTransporterReceiptInput = {
  /** Département ayant enregistré la déclaration */
  department?: InputMaybe<Scalars['String']>;
  /** The id of the transporter receipt to modify */
  id: Scalars['ID'];
  /** Numéro de récépissé transporteur */
  receiptNumber?: InputMaybe<Scalars['String']>;
  /** Limite de validité du récépissé */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Payload d'édition d'un agrément VHU */
export type UpdateVhuAgrementInput = {
  /** Numéro d'agrément VHU */
  agrementNumber?: InputMaybe<Scalars['String']>;
  /** Département ayant enregistré la déclaration */
  department?: InputMaybe<Scalars['String']>;
  /** ID de l'agrément VHU à modifier */
  id: Scalars['ID'];
};

export type UpdateWorkerCertificationInput = {
  /** Numéro de certification (sous-section 3 uniquement) */
  certificationNumber?: InputMaybe<Scalars['String']>;
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 4 */
  hasSubSectionFour?: InputMaybe<Scalars['Boolean']>;
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 3 */
  hasSubSectionThree?: InputMaybe<Scalars['Boolean']>;
  /** The id of the worker certification to update */
  id: Scalars['ID'];
  /**
   * Organisation qui a décerné la certification (sous-section 3 uniquement)
   * Peut prendre uniquement les valeurs suivantes: AFNOR Certification, GLOBAL CERTIFICATION, QUALIBAT
   */
  organisation?: InputMaybe<Scalars['String']>;
  /** Limite de validité de la certification (sous-section 3 uniquement) */
  validityLimit?: InputMaybe<Scalars['DateTime']>;
};

/** Représente un utilisateur sur la plateforme Trackdéchets */
export type User = {
  __typename?: 'User';
  /**
   * DEPRECATED - Liste des établissements dont l'utilisateur est membre.
   * @deprecated Utiliser la query avec pagination `myCompanies`
   */
  companies: Array<CompanyPrivate>;
  /** Email de l'utiliateur */
  email: Scalars['String'];
  /** Liste des fonctionnalités optionelles activées */
  featureFlags: Array<Scalars['String']>;
  /** Identifiant opaque */
  id: Scalars['ID'];
  /** Qualité d'administrateur. Rôle reservé aux agents de l'administration */
  isAdmin?: Maybe<Scalars['Boolean']>;
  /** Nom de l'utilisateur */
  name?: Maybe<Scalars['String']>;
  /** Numéro de téléphone de l'utilisateur */
  phone?: Maybe<Scalars['String']>;
};

export enum UserPermission {
  /** Créer un BSD. */
  BsdCanCreate = 'BSD_CAN_CREATE',
  /** Supprimer un BSD. */
  BsdCanDelete = 'BSD_CAN_DELETE',
  /** Lister les BSDs. */
  BsdCanList = 'BSD_CAN_LIST',
  /** Lire un BSD. */
  BsdCanRead = 'BSD_CAN_READ',
  /** Demander une demande révision. Accepter / refuser une demande de révision. */
  BsdCanRevise = 'BSD_CAN_REVISE',
  /** Signer la réception et l'acceptation d'un BSD. */
  BsdCanSignAcceptation = 'BSD_CAN_SIGN_ACCEPTATION',
  /** Signer l'émission d'un BSD. */
  BsdCanSignEmission = 'BSD_CAN_SIGN_EMISSION',
  /** Signer l'opération d'un BSD. */
  BsdCanSignOperation = 'BSD_CAN_SIGN_OPERATION',
  /** Signer l'enlèvement d'un BSD. */
  BsdCanSignTransport = 'BSD_CAN_SIGN_TRANSPORT',
  /** Signer l'étape de travaux d'un BSDA. */
  BsdCanSignWork = 'BSD_CAN_SIGN_WORK',
  /** Modifier un BSD. */
  BsdCanUpdate = 'BSD_CAN_UPDATE',
  /** Gérer la liste des utilisateurs de l'établissement */
  CompanyCanManageMembers = 'COMPANY_CAN_MANAGE_MEMBERS',
  /** Gérer les signatures automatiques */
  CompanyCanManageSignatureAutomation = 'COMPANY_CAN_MANAGE_SIGNATURE_AUTOMATION',
  /** Lire les informations de l'établissement */
  CompanyCanRead = 'COMPANY_CAN_READ',
  /** Renouveler le code de signature */
  CompanyCanRenewSecurityCode = 'COMPANY_CAN_RENEW_SECURITY_CODE',
  /** Modifier les informations de l'établissement */
  CompanyCanUpdate = 'COMPANY_CAN_UPDATE',
  /** Vérifier l'établissement à partir du code envoyé par courrier */
  CompanyCanVerify = 'COMPANY_CAN_VERIFY',
  /** Exporter le registre */
  RegistryCanRead = 'REGISTRY_CAN_READ'
}

/**
 * Rôle d'un utilisateur au sein d'un établissement. Châque rôle est lié
 * à un ensemble de permissions (voir l'objet UserPermission).
 *
 * Liste des permissions lié au rôle `MEMBER` :
 * - Accéder à un BSD de l'établissement en lecture.
 * - Lister les BSD de l'établissement.
 * - Créer un BSD pour l'établissement.
 * - Modifier un BSD de l'établissement.
 * - Supprimer un BSD de l'établissement.
 * - Signer un BSD pour le compte de l'établissement.
 * - Proposer une demande de révision pour l'établissement.
 * - Accepter / refuser les demandes de révision pour l'établissement.
 * - Exporter le registre de l'établissement.
 * - Accéder aux informations de l'établissements en lecture.
 *
 * Le rôle `ADMIN` a les mêmes permissions que le rôle `MEMBER` avec en plus :
 * - Modifier les informations de l'établissement.
 * - Gérer la liste des utilisateurs de l'établissement.
 * - Gérer les signatures automatiques.
 * - Renouveler le code de signature
 */
export enum UserRole {
  Admin = 'ADMIN',
  Member = 'MEMBER'
}

export type VerifyCompanyByAdminInput = {
  siret: Scalars['String'];
  verificationComment?: InputMaybe<Scalars['String']>;
};

export type VerifyCompanyInput = {
  /** Le code de vérification de l'établissement envoyé par courrier */
  code: Scalars['String'];
  /** Le SIRET de l'établissement à vérifier */
  siret: Scalars['String'];
};

/** Agrément VHU */
export type VhuAgrement = {
  __typename?: 'VhuAgrement';
  /** Numéro d'agrément VHU */
  agrementNumber: Scalars['String'];
  /** Département ayant enregistré la déclaration */
  department: Scalars['String'];
  id: Scalars['ID'];
};

/** Statut d'acceptation d'un déchet */
export enum WasteAcceptationStatus {
  /** Accepté en totalité */
  Accepted = 'ACCEPTED',
  /** Refus partiel */
  PartiallyRefused = 'PARTIALLY_REFUSED',
  /** Refusé */
  Refused = 'REFUSED'
}

export type WasteAcceptationStatusFilter = {
  _eq?: InputMaybe<WasteAcceptationStatus>;
  _in?: InputMaybe<Array<WasteAcceptationStatus>>;
};

/** Détails du déchet (case 3, 4, 5, 6) */
export type WasteDetails = {
  __typename?: 'WasteDetails';
  /** Numéros de référence(s) d'analyse(s) */
  analysisReferences?: Maybe<Array<Scalars['String']>>;
  /** Rubrique déchet au format |_|_| |_|_| |_|_| (*) */
  code?: Maybe<Scalars['String']>;
  /** Consistance */
  consistence?: Maybe<Consistence>;
  /** Caractère dangereux du déchet au sens de l’article R541-8 du code de l’environnement */
  isDangerous?: Maybe<Scalars['Boolean']>;
  /** Identifiant(s) du ou des terrains lorsque les terres ont été extraites d'un terrain placé en secteur d'information sur les sols au titre de l'article L. 125-6 */
  landIdentifiers?: Maybe<Array<Scalars['String']>>;
  /** Dénomination usuelle */
  name?: Maybe<Scalars['String']>;
  /**
   * Nombre de colis
   * @deprecated Utiliser `packagingInfos`
   */
  numberOfPackages?: Maybe<Scalars['Int']>;
  /** Code ONU */
  onuCode?: Maybe<Scalars['String']>;
  /**
   * Autre packaging (préciser)
   * @deprecated Utiliser `packagingInfos`
   */
  otherPackaging?: Maybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos?: Maybe<Array<PackagingInfo>>;
  /**
   * Conditionnement
   * @deprecated Utiliser `packagingInfos`
   */
  packagings?: Maybe<Array<Packagings>>;
  /**
   * Identifiants des parcelles cadastrales concernées, ou,
   * en cas de domaine non cadastré, l'identification précise des lieux géographiques de production
   */
  parcelNumbers?: Maybe<Array<ParcelNumber>>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: Maybe<Scalars['Boolean']>;
  /** Quantité en tonnes */
  quantity?: Maybe<Scalars['Float']>;
  /** Réelle ou estimée */
  quantityType?: Maybe<QuantityType>;
  /** Numéro d'échantillon pour les huiles noires. Ne concerne que les bordereaux parmi les codes suivants: 13 02 04*, 13 02 05*, 13 02 06*, 13 02 07*, 13 02 08* */
  sampleNumber?: Maybe<Scalars['String']>;
};

/** Payload lié au détails du déchet (case 3 à 6) */
export type WasteDetailsInput = {
  /** Numéros de référence(s) d'analyse(s) */
  analysisReferences?: InputMaybe<Array<Scalars['String']>>;
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
  code?: InputMaybe<Scalars['String']>;
  /** Consistance */
  consistence?: InputMaybe<Consistence>;
  /**
   * https://www.ecologie.gouv.fr/dechets-dangereux
   * Permet de préciser le caractère dangereux (au sens de l’article R541-8 du code de l’environnement)
   * d'un déchet dont le code ne contient pas d'astérisque. Par défaut si cette valeur est omise,
   * on considère dangereux un déchet dont le code comporte un astérique et non dangereux un déchet
   * dont le code ne comporte pas d'astérisque.
   */
  isDangerous?: InputMaybe<Scalars['Boolean']>;
  /** Identifiant(s) du ou des terrains lorsque les terres ont été extraites d'un terrain placé en secteur d'information sur les sols au titre de l'article L. 125-6 */
  landIdentifiers?: InputMaybe<Array<Scalars['String']>>;
  /** Dénomination usuelle. Obligatoire */
  name?: InputMaybe<Scalars['String']>;
  /** DEPRECATED - Nombre de colis */
  numberOfPackages?: InputMaybe<Scalars['Int']>;
  /** Code ONU. Obligatoire pour les déchets dangereux. Merci d'indiquer 'non soumis' si nécessaire. */
  onuCode?: InputMaybe<Scalars['String']>;
  /** DEPRECATED - Autre packaging (préciser) */
  otherPackaging?: InputMaybe<Scalars['String']>;
  /** Liste de conditionnements. Les conditionnements CITERNE et BENNE ne peuvent pas être associés à un autre conditionnement */
  packagingInfos?: InputMaybe<Array<PackagingInfoInput>>;
  /** DEPRECATED - Conditionnement */
  packagings?: InputMaybe<Array<InputMaybe<Packagings>>>;
  /**
   * Utilisé en cas de bordereau de terre excavée ou sédiment.
   * La ou les parcelles cadastrales du lieu de production des terres excavées et sédiments avec leurs identifications,
   * ou, en cas de domaine non cadastré, l'identification précise du lieu géographique de production
   */
  parcelNumbers?: InputMaybe<Array<ParcelNumberInput>>;
  /** Contient des Polluants Organiques Persistants (POP) oui / non */
  pop?: InputMaybe<Scalars['Boolean']>;
  /**
   * Poids en tonnes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantity?: InputMaybe<Scalars['Float']>;
  /** Réelle ou estimée */
  quantityType?: InputMaybe<QuantityType>;
  /** Numéro d'échantillon pour les huiles noires. Ne concerne que les bordereaux parmi les codes suivants: 13 02 04*, 13 02 05*, 13 02 06*, 13 02 07*, 13 02 08* */
  sampleNumber?: InputMaybe<Scalars['String']>;
};

/** Payload lié au reconditionnement (case 15 à 17) */
export type WasteDetailsRepackagingInput = {
  /** Code ONU */
  onuCode?: InputMaybe<Scalars['String']>;
  /** Conditionnements */
  packagingInfos?: InputMaybe<Array<PackagingInfoInput>>;
  /**
   * Poids en tonnes
   *
   * Doit être inférieur à 40T en cas de transport routier et inférieur à 50 000 T tout type de transport confondu.
   */
  quantity?: InputMaybe<Scalars['Float']>;
  /** Réelle ou estimée */
  quantityType?: InputMaybe<QuantityType>;
};

/** Type de registre */
export enum WasteRegistryType {
  /**
   * Registre exhaustif (non règlementaire), trié par date d'expédition du déchet.
   * Permet d'exporter l'ensemble des données de bordereaux liées à un ou plusieurs
   * établissements
   */
  All = 'ALL',
  /**
   * Registre de déchets entrants, trié par date de réception
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884574
   */
  Incoming = 'INCOMING',
  /**
   * Registre de déchets gérés, trié par date d'acquisition ou de début de gestion du déchet
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884599
   */
  Managed = 'MANAGED',
  /**
   * Registre de déchets sortants, trié par date d'expédition du déchet
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884583
   */
  Outgoing = 'OUTGOING',
  /**
   * Registre de déchets collectés, trié par date de prise en charge du déchet
   * https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000043884592
   */
  Transported = 'TRANSPORTED'
}

export type WasteRegistryWhere = {
  /** Filtre sur le type de bordereaux */
  bsdType?: InputMaybe<BsdTypeFilter>;
  /** Filtre sur la date de création du bordereau associé */
  createdAt?: InputMaybe<DateFilter>;
  /** Filtre sur le n° SIRET de l'installation de destination */
  destinationCompanySiret?: InputMaybe<StringFilter>;
  /** Filtre sur le code de l'opération de traitement */
  destinationOperationCode?: InputMaybe<StringFilter>;
  /** Filtre sur la date de l'opération de traitement */
  destinationOperationDate?: InputMaybe<DateFilter>;
  /** Filtre sur la date de réception sur l'installation de destination */
  destinationReceptionDate?: InputMaybe<DateFilter>;
  /** Filtre sur la quantité reçue (en kg) */
  destinationReceptionWeight?: InputMaybe<NumericFilter>;
  /** Filtre sur le n° SIRET de l'émetteur */
  emitterCompanySiret?: InputMaybe<StringFilter>;
  /** Filtre sur l'identifiant du bordereau */
  id?: InputMaybe<IdFilter>;
  /** Filtre sur le n° SIRET du transporteur */
  transporterCompanySiret?: InputMaybe<StringFilter>;
  /** Filtre sur la date de prise en charge du déchet par le transporteur */
  transporterTakenOverAt?: InputMaybe<DateFilter>;
  /** Filtre sur le code déchet */
  wasteCode?: InputMaybe<StringFilter>;
};

/** Type de déchets autorisé pour une rubrique */
export enum WasteType {
  /** Déchet dangereux */
  Dangerous = 'DANGEROUS',
  /** Déchet inerte */
  Inerte = 'INERTE',
  /** Déchet non dangereux */
  NotDangerous = 'NOT_DANGEROUS'
}

/** Configuration wehook */
export type WebhookSetting = {
  __typename?: 'WebhookSetting';
  activated: Scalars['Boolean'];
  createdAt: Scalars['DateTime'];
  endpointUri: Scalars['String'];
  id: Scalars['ID'];
  orgId: Scalars['String'];
};

export type WebhookSettingConnection = {
  __typename?: 'WebhookSettingConnection';
  edges: Array<WebhookSettingEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type WebhookSettingCreateInput = {
  /** Le webhook est-il activé ? */
  activated: Scalars['Boolean'];
  /** Id de l'établissement, non modifiable */
  companyId: Scalars['String'];
  /** Url de notification, https obligatoire */
  endpointUri: Scalars['String'];
  /** Minimum 20 caractères, modifiable mais non lisible */
  token: Scalars['String'];
};

export type WebhookSettingEdge = {
  __typename?: 'WebhookSettingEdge';
  cursor: Scalars['String'];
  node: WebhookSetting;
};

export type WebhookSettingUpdateInput = {
  /** Le webhook est-il activé ? */
  activated?: InputMaybe<Scalars['Boolean']>;
  /** Url de notification, https obligatoire */
  endpointUri?: InputMaybe<Scalars['String']>;
  /** Minimum 20 caractères, modifiable mais non lisible */
  token?: InputMaybe<Scalars['String']>;
};

/** Informations sur une adresse chantier */
export type WorkSite = {
  __typename?: 'WorkSite';
  address?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  infos?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  postalCode?: Maybe<Scalars['String']>;
};

/** Payload d'une adresse chantier */
export type WorkSiteInput = {
  address?: InputMaybe<Scalars['String']>;
  city?: InputMaybe<Scalars['String']>;
  infos?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  postalCode?: InputMaybe<Scalars['String']>;
};

/** Certifications pour les entreprise de travaux */
export type WorkerCertification = {
  __typename?: 'WorkerCertification';
  /** Numéro de certification (sous-section 3 uniquement) */
  certificationNumber?: Maybe<Scalars['String']>;
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 4 */
  hasSubSectionFour: Scalars['Boolean'];
  /** Indique si l'entreprise réalise des travaux relevant de la sous-section 3 */
  hasSubSectionThree: Scalars['Boolean'];
  id: Scalars['ID'];
  /** Organisation qui a décerné la certification (sous-section 3 uniquement) */
  organisation?: Maybe<Scalars['String']>;
  /** Limite de validité de la certification (sous-section 3 uniquement) */
  validityLimit?: Maybe<Scalars['DateTime']>;
};

export enum DestinationOperationCodeTypes {
  D9 = 'D9',
  D10 = 'D10',
  D12 = 'D12',
  R1 = 'R1',
  R12 = 'R12'
}

/** Informations du cycle de vie des bordereaux */
export type FormsLifeCycleData = {
  __typename?: 'formsLifeCycleData';
  /** Nombre de changements de statuts renvoyés */
  count?: Maybe<Scalars['Int']>;
  /** Dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle */
  endCursor?: Maybe<Scalars['ID']>;
  /** pagination, indique si d'autres pages existent après */
  hasNextPage?: Maybe<Scalars['Boolean']>;
  /** pagination, indique si d'autres pages existent avant */
  hasPreviousPage?: Maybe<Scalars['Boolean']>;
  /** Premier id de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle */
  startCursor?: Maybe<Scalars['ID']>;
  /** Liste des changements de statuts */
  statusLogs: Array<StatusLog>;
};

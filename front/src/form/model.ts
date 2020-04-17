export type Form = {
  id: string;
  customId: string;
  readableId: string;
  status: string;
  stateSummary: {
    quantity: number;
    transporter: FormCompany;
    recipient: FormCompany;
    emitter: FormCompany;
    lastActionOn: string;
  };
  ecoOrganisme: {
    id: string;
  };
  emitter: {
    company: FormCompany;
    workSite: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      infos: string;
    };
    type: string;
  };
  recipient: {
    company: FormCompany;
    processingOperation: String;
    isTempStorage: boolean;
  };
  trader: {
    company: FormCompany;
  };
  transporter: Transporter;
  wasteDetails: WasteDetails;

  receivedAt: string;
  quantityReceived: number;
  processingOperationDone: string;
  temporaryStorageDetail: {
    temporaryStorer: {
      quantityType: string;
      quantityReceived: number;
      wasteAcceptationStatus: string;
      wasteRefusalReason: string;

      receivedAt: string;
      signedAt: string;
    };
    destination: {
      company: FormCompany;
      processingOperation: string;
    };
    transporter: Transporter;
    wasteDetails: WasteDetails;
  };
};

type Transporter = {
  company: FormCompany;
  isExemptedOfReceipt: boolean;
  numberPlate: string;
  customInfo: string;
};

type WasteDetails = {
  quantity: number;
  code: string;
  name: string;
  packagings: string[];
  onuCode: string;
};

type FormCompany = {
  siret: string;
  address: string;
  name: string;
};

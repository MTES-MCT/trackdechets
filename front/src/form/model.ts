export type Form = {
  id: string;
  customId: string;
  readableId: string;
  status: string;
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
  };
  trader: {
    company: FormCompany;
  };
  transporter: {
    company: FormCompany;
    numberPlate: string;
    customInfo: string;
  };
  wasteDetails: {
    quantity: number;
    code: string;
    name: string;
    packagings: string[];
    onuCode: string;
  };

  receivedAt: string;
  quantityReceived: number;
  processingOperationDone: string;
};

type FormCompany = {
  siret: string;
  address: string;
  name: string;
};

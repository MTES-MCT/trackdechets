export type Form = {
  id: string;
  readableId: string;
  status: string;
  emitter: {
    company: FormCompany;
    pickupSite: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      infos: string;
    };
  };
  recipient: {
    company: FormCompany;
    processingOperation: String;
  };
  transporter: {
    company: FormCompany;
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

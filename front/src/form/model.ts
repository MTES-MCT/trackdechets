export type Form = {
  id: string;
  readableId: string;
  status: string;
  emitter: {
    company: FormCompany;
  };
  recipient: {
    company: FormCompany;
    processingOperation: String;
  };
  wasteDetails: {
    quantity: number;
    code: string;
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

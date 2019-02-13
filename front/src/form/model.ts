export type Form = {
  id: string
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
  }
};

type FormCompany = {
  siret: string;
  address: string;
  name: string;
};

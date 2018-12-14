export type Form = {
  id: string
  status: string;
  emitter: {
    company: FormCompany;
  };
  recipient: {
    company: FormCompany;
  };
};

type FormCompany = {
  siret: string;
  address: string;
  name: string;
};

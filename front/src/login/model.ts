export type Me = {
  id: string;
  email: string;
  name: string;
  phone: string;
  companies: Company[];
};

export type Company = {
  id: string;
  siret: string;
  companyTypes: string[];
  name: string;
  address: string;
  securityCode: string;
  admins: { id: string; name: string }[];
};

export type Me = {
  id: string;
  email: string;
  name: string;
  phone: string;
  companies: Company[];
  userType: string[];
};

type Company = {
  siret: string;
  name: string;
  address: string;
  securityCode: string;
  admins: { id: string; name: string }[];
};

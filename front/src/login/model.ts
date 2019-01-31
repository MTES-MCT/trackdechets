export type Me = {
  id: string;
  email: string;
  name: string;
  phone: string;
  company: Company;
};

type Company = { siret: string; name: string; address: string };

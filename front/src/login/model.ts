export type Me = {
  id: string;
  email: string;
  name: string;
  company: Company;
};

type Company = { siret: string };

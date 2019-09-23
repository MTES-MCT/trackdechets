export type Rubrique = {
  rubrique: string;
  alinea: string;
  category: string;
  activite: string;
  volume: string;
  unite: string;
};

export type Installation = {
  codeS3ic: string;
  urlFiche: string;
  rubriques: [Rubrique];
  declarations: [Declaration];
};

export type Company = {
  siret: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  naf: string;
  libelleNaf: string;
  isRegistered: boolean;
  installation: Installation;
};

export type Declaration = {
  codeDechet: string;
  libDechet: string;
  gerepType: string;
};

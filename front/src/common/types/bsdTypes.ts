export enum BsdTypename {
  Bsdd = "Form",
  Bsda = "Bsda",
  Bsdasri = "Bsdasri",
  Bsvhu = "Bsvhu",
  Bsff = "Bsff",
}

export interface BsdDisplay {
  id: string;
  status: string;
  wasteDetails: {
    code?: any;
    name?: any;
    weight?: any;
  };
}

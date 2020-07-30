import {
  Form,
  TemporaryStorageDetail,
  EcoOrganisme
} from "../../generated/prisma-client";

export type FormExpanded = Partial<Form> & {
  temporaryStorageDetail?: Partial<TemporaryStorageDetail>;
  ecoOrganisme?: Partial<EcoOrganisme>;
};

export type FormFlattened = Partial<Form> & {
  temporaryStorageDestinationCompanySiret?: string;
  temporaryStorageDestinationCompanyName?: string;
  temporaryStorageDetailCompanyAddress?: string;
  temporaryStorageDetailCompanyMail?: string;
  ecoOrganismeName: string;
};

export type Column = {
  field: string;
  label: string;
  format: (v: any) => any;
};

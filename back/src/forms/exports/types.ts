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
  temporaryStorageCompanySiret?: string;
  temporaryStorageCompanyName?: string;
  temporaryStorageCompanyContact?: string;
  temporaryStorageCompanyPhone?: string;
  temporaryStorageCompanyAddress?: string;
  temporaryStorageCompanyMail?: string;
  temporaryStorageTransporterCompanySiret?: string;
  temporaryStorageTransporterCompanyName?: string;
  temporaryStorageTransporterCompanyAddress?: string;
  temporaryStorageTransporterIsExemptedOfReceipt?: boolean;
  temporaryStorageTransporterReceipt?: string;
  temporaryStorageTransporterValidityLimit?: string;
  temporaryStorageTransporterNumberPlate?: string;
  ecoOrganismeName: string;
};

export type Column = {
  field: keyof FormFlattened;
  label: string;
  format: (v: any) => any;
};

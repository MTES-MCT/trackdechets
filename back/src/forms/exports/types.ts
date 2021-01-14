import { Form, TemporaryStorageDetail } from "@prisma/client";

export type FormExpanded = Partial<Form> & {
  temporaryStorageDetail?: Partial<TemporaryStorageDetail>;
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
  temporaryStorageTransporterValidityLimit?: Date;
  temporaryStorageTransporterNumberPlate?: string;
  ecoOrganismeName?: string;
};

export type Column = {
  field: keyof FormFlattened;
  label: string;
  format: (v: any) => any;
};

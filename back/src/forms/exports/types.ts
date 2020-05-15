import { Form, TemporaryStorageDetail } from "../../generated/prisma-client";

export type FormWithTempStorage = Partial<Form> & {
  temporaryStorageDetail?: TemporaryStorageDetail;
};

export type FormWithTempStorageFlattened = Partial<Form> & {
  temporaryStorageDestinationCompanySiret?: string;
  temporaryStorageDestinationCompanyName?: string;
  temporaryStorageDetailCompanyAddress?: string;
  temporaryStorageDetailCompanyMail?: string;
};

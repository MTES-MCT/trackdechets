import prisma from "../../prisma";
import { buildFormRepository, FormActions } from "./form";
import {
  buildFormRevisionRequestRepository,
  FormRevisionRequestActions
} from "./revisionRequest";

export type LogMetadata = Record<string, unknown>;
export type FormRepository = FormActions & FormRevisionRequestActions;

export function getFormRepository(user: Express.User): FormRepository {
  return {
    ...buildFormRepository(prisma, user),
    ...buildFormRevisionRequestRepository(prisma, user)
  };
}

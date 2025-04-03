import {
  ImportType,
  RegistryChanges,
  UNAUTHORIZED_ERROR,
  getSumOfChanges,
  importOptions,
  incrementLocalChangesForCompany,
  isAuthorized,
  saveCompaniesChanges
} from "@td/registry";
import type { ZodIssue } from "zod";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Permission, checkUserPermissions } from "../../../permissions";
import { getDelegatorsByDelegateForEachCompanies } from "../../../registryDelegation/database";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { AddRegistryLinesResponse } from "@td/codegen-back";

const LINES_LIMIT = 1_000;

type UnparsedLine = {
  reason?: "MODIFIER" | "ANNULER" | "IGNORER" | "EDIT" | "CANCEL" | null;
  publicId: string;
  reportForCompanySiret: string;
  reportAsCompanySiret?: string | null;
};

export async function genericAddToRegistry<T extends UnparsedLine>(
  importType: ImportType,
  lines: T[],
  context: GraphQLContext
): Promise<AddRegistryLinesResponse> {
  const options = importOptions[importType];

  const user = checkIsAuthenticated(context);
  const userCompanies = await getUserCompanies(user.id);
  await checkUserPermissions(
    user,
    userCompanies.map(company => company.orgId),
    Permission.RegistryCanImport,
    `Vous n'êtes pas autorisé à modifier des données du registre`
  );

  if (lines.length > LINES_LIMIT) {
    throw new UserInputError(
      `Vous ne pouvez pas importer plus de ${LINES_LIMIT} lignes par appel`
    );
  }

  const userSirets = userCompanies.map(company => company.orgId);
  const userCompanyIds = userCompanies.map(company => company.id);

  const delegatorSiretsByDelegateSirets =
    await getDelegatorsByDelegateForEachCompanies(userCompanyIds);

  const { safeParseAsync, saveLine } = options;
  const errors = new Map<string, ZodIssue[]>();

  // Payload permettant de renvoyer les identifiants des enregistrements
  // par statut (insertion, modification, annulation, etc)
  const identifiers: Pick<
    AddRegistryLinesResponse,
    "inserted" | "cancelled" | "edited" | "skipped"
  > = { inserted: [], cancelled: [], edited: [], skipped: [] };
  const changesByCompany = new Map<
    string,
    { [reportAsSiret: string]: RegistryChanges }
  >();

  for (const line of lines) {
    const result = await safeParseAsync(line);

    if (result.success) {
      const { reportAsCompanySiret, reportForCompanySiret } = result.data;

      if (
        !isAuthorized({
          reportAsCompanySiret,
          delegatorSiretsByDelegateSirets,
          reportForCompanySiret,
          allowedSirets: userSirets
        })
      ) {
        errors.set(line.publicId, [
          { path: [], code: "unauthorized", message: UNAUTHORIZED_ERROR } as any
        ]);
        continue;
      }

      incrementLocalChangesForCompany(changesByCompany, {
        reason: result.data.reason,
        reportForCompanySiret: result.data.reportForCompanySiret,
        reportAsCompanySiret:
          result.data.reportAsCompanySiret ?? result.data.reportForCompanySiret
      });

      await saveLine({
        line: { ...result.data, createdById: user.id },
        importId: null
      });

      switch (result.data.reason) {
        case "MODIFIER":
          identifiers.edited.push({ publicId: result.data.publicId });
          break;
        case "ANNULER":
          identifiers.cancelled.push({ publicId: result.data.publicId });
          break;
        case "IGNORER":
          identifiers.skipped.push({ publicId: result.data.publicId });
          break;
        default:
          identifiers.inserted.push({ publicId: result.data.publicId });
          break;
      }
    } else {
      errors.set(line.publicId, result.error.issues);
    }
  }

  await saveCompaniesChanges(changesByCompany, {
    type: importType,
    source: "API",
    createdById: user.id
  });

  const stats = getSumOfChanges(changesByCompany, errors.size);

  return {
    stats,
    errors: Array.from(errors.entries()).map(([publicId, issues]) => ({
      message: issues
        .map(issue =>
          [issue.path.join("."), issue.message].filter(Boolean).join(": ")
        )
        .join("\n"),
      publicId,
      issues: issues.map(({ path, message, code }) => ({
        path: path.join("."),
        message,
        code
      }))
    })),
    ...identifiers
  };
}

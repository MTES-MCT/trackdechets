import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationCreateAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { UserRole } from "@prisma/client";
import { parseCreateAdminRequestInput } from "../../validation";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { getAdminRequestRepository } from "../../repository";
import { fixTyping } from "../typing";

const createAdminRequest = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationCreateAdminRequestArgs,
  context: GraphQLContext
): Promise<AdminRequest> => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const adminRequestInput = parseCreateAdminRequestInput(input);

  const company = await prisma.company.findFirst({
    where: { orgId: adminRequestInput.companyOrgId }
  });

  if (!company) {
    throw new UserInputError(
      "L'entreprise ciblée n'existe pas dans Trackdéchets."
    );
  }

  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      companyId: company.id,
      userId: user.id
    }
  });

  if (companyAssociation?.role === UserRole.ADMIN) {
    throw new UserInputError(
      "Vous êtes déjà administrateur de cette entreprise."
    );
  }

  let collaborator;
  if (adminRequestInput.collaboratorEmail) {
    collaborator = await prisma.user.findFirst({
      where: { email: adminRequestInput.collaboratorEmail }
    });

    if (!collaborator) {
      throw new UserInputError("Le collaborateur ciblé n'existe pas.");
    }

    const collaboratorCompanyAssociation =
      await prisma.companyAssociation.findFirst({
        where: {
          userId: collaborator.id,
          companyId: company.id
        }
      });

    if (!collaboratorCompanyAssociation) {
      throw new UserInputError(
        "Le collaborateur ne fait pas partie de l'entreprise ciblée."
      );
    }
  }

  const { create, findFirst } = getAdminRequestRepository(user);

  // Make sure there isn't already a PENDING request
  const existingRequest = await findFirst({
    userId: user.id,
    companyId: company.id,
    status: "PENDING"
  });

  if (existingRequest) {
    throw new UserInputError(
      "Une demande est déjà en attente pour cette entreprise."
    );
  }

  // Create admin request
  const adminRequest = await create(
    {
      userId: user.id,
      company: { connect: { id: company.id } },
      collaboratorId: collaborator?.id,
      validationMethod: adminRequestInput.validationMethod
    },
    { include: { company: true } }
  );

  return fixTyping(adminRequest);
};

export default createAdminRequest;

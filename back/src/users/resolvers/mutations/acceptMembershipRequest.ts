import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  associateUserToCompany,
  getMembershipRequestOrNotFoundError
} from "../../database";
import {
  MembershipRequestAlreadyAccepted,
  MembershipRequestAlreadyRefused
} from "../../errors";
import { membershipRequestAccepted, renderMail } from "@td/mail";
import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../../companies/converters";

const acceptMembershipRequestResolver: MutationResolvers["acceptMembershipRequest"] =
  async (_, { id, role }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);

    const user = checkIsAuthenticated(context);

    // throw error if membership request does not exist
    const membershipRequest = await getMembershipRequestOrNotFoundError({ id });

    const company = await prisma.membershipRequest
      .findUnique({ where: { id: membershipRequest.id } })
      .company();

    if (!company) {
      throw new Error(
        `Cannot find company for membershipRequest ${membershipRequest.id}`
      );
    }

    // check authenticated user is admin of the company
    await checkUserPermissions(
      user,
      company.orgId,
      Permission.CompanyCanManageMembers,
      NotCompanyAdminErrorMsg(company.orgId)
    );

    // throw error if membership request was already accepted
    if (membershipRequest.status === "ACCEPTED") {
      throw new MembershipRequestAlreadyAccepted();
    }

    // throw error if membership request was already refused
    if (membershipRequest.status === "REFUSED") {
      throw new MembershipRequestAlreadyRefused();
    }

    const requester = await prisma.membershipRequest
      .findUnique({ where: { id: membershipRequest.id } })
      .user();

    if (!requester) {
      throw new Error(
        `Cannot find requester for membershipRequest ${membershipRequest.id}`
      );
    }

    // associate membership requester to company with the role decided by the admin
    await associateUserToCompany(requester.id, company.orgId, role);

    await prisma.membershipRequest.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        statusUpdatedBy: user.email
      }
    });

    // notify requester of acceptance
    const mail = renderMail(membershipRequestAccepted, {
      variables: { companyName: company.name, companySiret: company.siret },
      to: [{ name: requester.name, email: requester.email }]
    });
    await sendMail(mail);

    const dbCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    return toGqlCompanyPrivate(dbCompany!);
  };

export default acceptMembershipRequestResolver;

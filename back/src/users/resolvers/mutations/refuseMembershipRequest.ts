import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import { getMembershipRequestOrNotFoundError } from "../../database";
import {
  MembershipRequestAlreadyAccepted,
  MembershipRequestAlreadyRefused
} from "../../errors";
import { renderMail, membershipRequestRefused } from "@td/mail";
import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../../companies/converters";

const refuseMembershipRequestResolver: MutationResolvers["refuseMembershipRequest"] =
  async (parent, { id }, context) => {
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

    await prisma.membershipRequest.update({
      where: { id },
      data: {
        status: "REFUSED",
        statusUpdatedBy: user.email
      }
    });

    // notify requester of refusal
    const requester = await prisma.membershipRequest
      .findUnique({ where: { id } })
      .user();
    if (!requester) {
      throw new Error(`Cannot find requester for membershipRequest ${id}`);
    }
    const mail = renderMail(membershipRequestRefused, {
      to: [{ email: requester.email, name: requester.name }],
      variables: { companyName: company.name, companySiret: company.siret }
    });
    await sendMail(mail);

    const dbCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    return toGqlCompanyPrivate(dbCompany!);
  };

export default refuseMembershipRequestResolver;

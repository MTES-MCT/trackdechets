import { applyAuthStrategies, AuthType } from "../../../auth";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { getMembershipRequestOrNotFoundError } from "../../database";
import {
  MembershipRequestAlreadyAccepted,
  MembershipRequestAlreadyRefused
} from "../../errors";
import { userMails } from "../../mails";
import { checkIsCompanyAdmin } from "../../permissions";

const refuseMembershipRequestResolver: MutationResolvers["refuseMembershipRequest"] = async (
  parent,
  { id },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  // throw error if membership request does not exist
  const membershipRequest = await getMembershipRequestOrNotFoundError({ id });

  const company = await prisma
    .membershipRequest({ id: membershipRequest.id })
    .company();

  // check authenticated user is admin of the company
  await checkIsCompanyAdmin(user, company);

  // throw error if membership request was already accepted
  if (membershipRequest.status === "ACCEPTED") {
    throw new MembershipRequestAlreadyAccepted();
  }

  // throw error if membership request was already refused
  if (membershipRequest.status === "REFUSED") {
    throw new MembershipRequestAlreadyRefused();
  }

  await prisma.updateMembershipRequest({
    where: { id },
    data: {
      status: "REFUSED",
      statusUpdatedBy: user.email
    }
  });

  // notify requester of refusal
  const requester = await prisma.membershipRequest({ id }).user();
  await sendMail(userMails.membershipRequestRefused(requester, company));

  return prisma.company({ id: company.id });
};

export default refuseMembershipRequestResolver;

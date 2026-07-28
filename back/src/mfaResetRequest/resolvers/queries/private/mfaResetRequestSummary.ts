import { applyAuthStrategies, AuthType } from "../../../../auth/auth";
import { checkIsAdmin } from "../../../../common/permissions";
import { GraphQLContext } from "../../../../types";
import { prisma, MfaResetRequestStatus } from "@td/prisma";
import { sanitizeEmail } from "../../../../utils";
import { countNotifiableAdmins } from "../../mutations/utils/mfaResetRequest.utils";

const mfaResetRequestSummary = async (
  _: unknown,
  { email }: { email: string },
  context: GraphQLContext
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  const user = await prisma.user.findUnique({
    where: { email: sanitizeEmail(email) }
  });

  if (!user) {
    return {
      user: null,
      hasMfa: false,
      hasPendingRequest: false,
      companiesCount: 0,
      adminNotifiedCount: 0,
      noAdminWarning: true
    };
  }

  const hasMfa = !!(user.totpSeed && user.totpActivatedAt);

  const [hasPendingRequest, companiesCount, adminNotifiedCount] =
    await Promise.all([
      prisma.mfaResetRequest
        .findFirst({
          where: { userId: user.id, status: MfaResetRequestStatus.PENDING }
        })
        .then(r => !!r),
      prisma.companyAssociation.count({ where: { userId: user.id } }),
      countNotifiableAdmins(user.id)
    ]);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    hasMfa,
    hasPendingRequest,
    companiesCount,
    adminNotifiedCount,
    noAdminWarning: adminNotifiedCount === 0
  };
};

export default mfaResetRequestSummary;

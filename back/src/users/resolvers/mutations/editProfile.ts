import { prisma } from "@td/prisma";
import type {
  MutationEditProfileArgs,
  MutationResolvers
} from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import * as yup from "yup";
import { addDays } from "date-fns";
import { isDefined } from "../../../common/helpers";
const TRACKING_CONSENT_PERIOD = 6 * 30; // 6 months
/**
 * Edit user profile
 * Each field can be edited separately so we need to handle
 * undefined values
 * @param userId
 * @param payload
 */
export async function editProfileFn(
  userId: string,
  payload: MutationEditProfileArgs
) {
  const editProfileSchema = yup.object({
    name: yup
      .string()
      .test("empty", "The name cannot be an empty string", name =>
        isDefined(name) ? !!name && name.trim().length > 0 : true
      )
      .isSafeSSTI(),
    phone: yup.string(),
    trackingConsent: yup.boolean()
  });

  editProfileSchema.validateSync(payload);

  const { name, phone, trackingConsent } = payload;

  const data: { name?: string; phone?: string | null } = {
    ...(name != null ? { name } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(trackingConsent !== undefined
      ? {
          trackingConsent,
          trackingConsentUntil: addDays(new Date(), TRACKING_CONSENT_PERIOD)
        }
      : {})
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data
  });

  return {
    ...updatedUser,
    // companies are resolved through a separate resolver (User.companies)
    companies: [],
    featureFlags: []
  };
}

const editProfileResolver: MutationResolvers["editProfile"] = (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  return editProfileFn(user.id, args);
};

export default editProfileResolver;

import prisma from "../prisma";
import { getUIBaseURL } from "../utils";

/**
 *
 * GET handler for user activations. Used to cause some problems with email clients eagerly fetching email links.
 * Replaced with a redirect to a confirm form poiting to `userActivationHandler`
 */
export const legacyUserActivationHandler = async (req, res) => {
  const { hash } = req.query;
  if (hash == null) {
    res.status(500).send("Hash manquant.");
    return;
  }
  const UI_BASE_URL = getUIBaseURL();
  return res.redirect(`${UI_BASE_URL}/user-activation?hash=${hash}`);
};

/**
 *
 * Activate a recently signed-up user
 *
 * - User receives an emailed link upon signup
 * - A click on the aforementionned link open a frontend confirm form pointing to this POST handler
 * - The handler checks userActivation exists, then activates matching user and deletes hash
 * - redirects to /login?signup=complete if successful
 *
 * In case of error, redirects to user activation frontend page with error code in querystring
 */
export const userActivationHandler = async (req, res) => {
  const UI_BASE_URL = getUIBaseURL();
  const errorRedirect = `${UI_BASE_URL}/user-activation?errorCode=INVALID_OR_MISSING_HASH`;
  const { hash } = req.body;
  if (hash == null) {
    return res.redirect(errorRedirect);
  }

  const user = await prisma.userActivationHash
    .findUnique({ where: { hash } })
    .user();
  if (user == null) {
    return res.redirect(errorRedirect);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true, activatedAt: new Date() }
  });

  await prisma.userActivationHash.delete({ where: { hash } });

  return res.redirect(`${UI_BASE_URL}/login?signup=complete`);
};

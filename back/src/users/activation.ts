import prisma from "../prisma";
import { getUIBaseURL } from "../utils";

export const userActivationHandler = async (req, res) => {
  const UI_BASE_URL = getUIBaseURL();
  const { hash } = req.query;
  if (hash == null) {
    return res.redirect(`${UI_BASE_URL}/login?signup=error`);
  }

  const user = await prisma.userActivationHash
    .findUnique({ where: { hash } })
    .user();
  if (user == null) {
    return res.redirect(`${UI_BASE_URL}/login?signup=error`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true, activatedAt: new Date() }
  });

  await prisma.userActivationHash.delete({ where: { hash } });

  return res.redirect(`${UI_BASE_URL}/login?signup=complete`);
};

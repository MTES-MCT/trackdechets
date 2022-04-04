import prisma from "../prisma";
import { getUIBaseURL } from "../utils";

export const userActivationHandler = async (req, res) => {
  const { hash } = req.query;
  if (hash == null) {
    res.status(500).send("Hash manquant.");
    return;
  }

  const user = await prisma.userActivationHash
    .findUnique({ where: { hash } })
    .user();
  if (user == null) {
    res.status(500).send("Hash invalide.");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true, activatedAt: new Date() }
  });

  const UI_BASE_URL = getUIBaseURL();
  return res.redirect(UI_BASE_URL);
};

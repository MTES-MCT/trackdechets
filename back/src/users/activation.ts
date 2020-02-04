import { prisma } from "../generated/prisma-client";
import { getUIBaseURL } from "../utils";

export const userActivationHandler = async (req, res) => {
  const { hash } = req.query;
  if (hash == null) {
    res.status(500).send("Hash manquant.");
    return;
  }

  const user = await prisma.userActivationHash({ hash }).user();
  if (user == null) {
    res.status(500).send("Hash invalide.");
    return;
  }

  await prisma.updateUser({
    where: { id: user.id },
    data: { isActive: true }
  });

  const UI_BASE_URL = getUIBaseURL()
  return res.redirect(UI_BASE_URL);
};

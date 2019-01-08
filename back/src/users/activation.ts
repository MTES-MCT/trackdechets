import { prisma } from "../generated/prisma-client";

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

  return res
    .set("Content-Type", "text/html")
    .send(
      `Compte activé. <a href="https://trackdechets.beta.gouv.fr/">Cliquez ici pour revenir sur le site</a>`
    );
};

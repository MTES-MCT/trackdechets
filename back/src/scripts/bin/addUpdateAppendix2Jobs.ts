import { prisma } from "@td/prisma";
import { AuthType } from "../../auth";
import { enqueueUpdateAppendix2Job } from "../../queue/producers/updateAppendix2";

/**
 * Script permettant de re-calculer le statuts possiblement erronés des annexes 2.
 * Il faut passer l'email de l'utilisateur qui run le script et
 * qui doit correspondre à un vrai compte utilisateur sur l'environnement courant.
 * Cela permet de logguer dans les events la personnne à l'origine des modifications.
 *
 * npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/addUpdateAppendix2Jobs.ts john.snow@trackdechets.fr
 */
(async () => {
  const [userEmail] = process.argv.slice(2);

  if (!userEmail) {
    console.log(
      "Vous devez renseigner votre email utilisateur en paramètre de la fonction"
    );
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userEmail }
  });

  console.log(
    "Récuparation de tous les bordereaux avec le statut AWAITING_GROUP ou GROUPED..."
  );

  // ~ 700 000 BSDDS
  const forms = await prisma.form.findMany({
    where: { status: { in: ["AWAITING_GROUP", "GROUPED"] } },
    select: { id: true }
  });

  console.log(`Début de la mise à jour de ${forms.length} BSDDs`);

  for (const form of forms) {
    await enqueueUpdateAppendix2Job({
      formId: form.id,
      userId: user.id,
      auth: "script" as AuthType
    });
  }
})().then(() => process.exit());

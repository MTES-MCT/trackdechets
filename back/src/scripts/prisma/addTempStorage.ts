import { Prisma } from "@prisma/client";
import prisma from "../../prisma";

async function addTempStorage() {
  const ids = ["BSD-20221011-Y8VHKAXWX", "BSD-20221007-KM53Z03WQ"];
  for (const id of ids) {
    const bsdd = await prisma.form.findUnique({ where: { readableId: id } });
    if (bsdd.recipientIsTempStorage === true) {
      // Recipient is temp storage but no details provided
      // Create empty temporary storage details
      const formUpdateInput: Prisma.FormUpdateInput = {
        forwardedIn: {
          create: {
            owner: { connect: { id: bsdd.ownerId } },
            readableId: `${bsdd.readableId}-suite`
          }
        }
      };
      await prisma.form.update({
        where: { id: bsdd.id },
        data: formUpdateInput
      });
    }
  }
}

addTempStorage().then(() => process.exit());

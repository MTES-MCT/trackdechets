import { prisma } from "@td/prisma";
import { getUid } from "../../utils";
import { addMinutes } from "date-fns";
import {
  BsdType,
  Form,
  Bsdasri,
  User,
  Bsda,
  Bsff,
  Bsvhu
} from "@prisma/client";

export const pdfAccessTokenFactory = async ({
  bsd,
  bsdType,
  user
}: {
  bsd: Form | Bsdasri | Bsda | Bsff | Bsvhu;
  user: User;
  bsdType: BsdType;
}) => {
  return prisma.pdfAccessToken.create({
    data: {
      token: getUid(50),
      bsdType: bsdType,
      bsdId: bsd.id,
      userId: user.id,
      expiresAt: addMinutes(new Date(), 30)
    }
  });
};

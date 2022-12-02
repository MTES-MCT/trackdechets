import { hashPassword, passwordVersion } from "../src/users/utils";

import prisma from "../src/prisma";
import { siretify } from "../src/__tests__/factories";

export default async () => {
  await prisma.user.create({
    data: {
      email: "hello@producteur.fr",
      password: await hashPassword("password"),
      passwordVersion,
      isActive: true,
      name: "PRODUCTEUR",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: siretify(1),
              securityCode: 1234,
              verificationCode: "4321",
              name: "PRODUCTEUR",
              companyTypes: {
                set: ["PRODUCER"]
              }
            }
          }
        }
      }
    }
  });
  await prisma.user.create({
    data: {
      email: "hello@transporteur.fr",
      password: await hashPassword("password"),
      passwordVersion,
      isActive: true,
      name: "TRANSPORTEUR",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: siretify(2),
              securityCode: 1234,
              verificationCode: "4321",
              name: "TRANSPORTEUR",
              companyTypes: {
                set: ["TRANSPORTER"]
              },
              transporterReceipt: {
                create: {
                  department: "07",
                  receiptNumber: "0101010101",
                  validityLimit: new Date("2024-01-01 00:00:00")
                }
              }
            }
          }
        }
      }
    }
  });
  await prisma.user.create({
    data: {
      email: "hello@collecteur.fr",
      password: await hashPassword("password"),
      passwordVersion,
      isActive: true,
      name: "COLLECTEUR",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: siretify(3),
              securityCode: 1234,
              verificationCode: "4321",
              name: "COLLECTEUR",
              companyTypes: {
                set: ["COLLECTOR"]
              }
            }
          }
        }
      }
    }
  });
  await prisma.user.create({
    data: {
      email: "hello@ecoorganisme.fr",
      password: await hashPassword("password"),
      passwordVersion,
      isActive: true,
      name: "ECOORGANISME",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: siretify(4),
              securityCode: 1234,
              verificationCode: "4321",
              name: "ECOORG",
              companyTypes: {
                set: ["ECO_ORGANISME"]
              }
            }
          }
        }
      }
    }
  });
  await prisma.ecoOrganisme.create({
    data: {
      address: "34 RUE DU DECHETS 13001 MARSEILLE",
      name: "ECOORG",
      siret: siretify(5)
    }
  });
};

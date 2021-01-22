import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/users/utils";

export default async () => {
  const prisma = new PrismaClient();
  await prisma.user.create({
    data: {
      email: "hello@producteur.fr",
      password: await hashPassword("password"),
      isActive: true,
      name: "PRODUCTEUR",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: "11111111111111",
              securityCode: 1234,
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
      isActive: true,
      name: "TRANSPORTEUR",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: "22222222222222",
              securityCode: 1234,
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
      isActive: true,
      name: "COLLECTEUR",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: "33333333333333",
              securityCode: 1234,
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
      isActive: true,
      name: "ECOORGANISME",
      phone: "06 06 06 06 06",
      companyAssociations: {
        create: {
          role: "ADMIN",
          company: {
            create: {
              siret: "44444444444444",
              securityCode: 1234,
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
      siret: "44444444444444"
    }
  });
};

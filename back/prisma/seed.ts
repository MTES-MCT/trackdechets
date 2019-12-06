import { prisma } from "../src/generated/prisma-client";
import { hash } from "bcrypt";

seed().catch(e => console.error(e));

async function seed() {
  // John, admin of 000000000000
  const p1 = await hash("john", 10);
  await prisma.createUser({
    email: "john@td.io",
    name: "John",
    password: p1,
    isActive: true,
    companyAssociations: {
      create: {
        company: { create: { siret: "00000000000000", securityCode: 1234 } },
        role: "ADMIN"
      }
    }
  });

  // Eric, member of 000000000000
  const p2 = await hash("eric", 10);
  await prisma.createUser({
    email: "eric@td.io",
    name: "Eric",
    password: p2,
    isActive: true,
    companyAssociations: {
      create: {
        company: { connect: { siret: "00000000000000" } },
        role: "MEMBER"
      }
    }
  });

  // Bob, admin of 11111111111111
  const p3 = await hash("bob", 10);
  await prisma.createUser({
    email: "bob@td.io",
    name: "Bob",
    password: p3,
    isActive: true,
    companyAssociations: {
      create: {
        company: { create: { siret: "11111111111111", securityCode: 1234 } },
        role: "ADMIN"
      }
    }
  });
}

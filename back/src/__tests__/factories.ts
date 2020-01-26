import {
  CompanyCreatecompanyTypesInput,
  CompanyType,
  prisma,
  UserRole
} from "../generated/prisma-client";
import { hash } from "bcrypt";

/**
 * Create a user with name and email
 * @param opt: extra parameters
 */
export const userFactory = async (opt = {}) => {
  const defaultPassword = await hash("pass", 10);
  const userIndex =
    (await prisma
      .usersConnection()
      .aggregate()
      .count()) + 1;
  const data = {
    name: `User_${userIndex}`,
    email: `user_${userIndex}@td.io`,
    password: defaultPassword,
    isActive: true,
    ...opt
  };

  return prisma.createUser(data);
};

/**
 * Create a company with name, siret, security code and PORDUCER by default
 * @param opt: extram parameters
 */
export const companyFactory = async (opt = {}) => {
  const companyIndex =
    (await prisma
      .companiesConnection()
      .aggregate()
      .count()) + 1;
  return prisma.createCompany({
    siret: `${companyIndex}`,
    companyTypes: {
      set: ["PRODUCER" as CompanyType]
    } as CompanyCreatecompanyTypesInput,
    name: `company_${companyIndex}`,
    securityCode: 1234,
    ...opt
  });
};

/**
 * Create a company and a member
 * @param role: user role in the company
 */
export const userWithCompanyFactory = async role => {
  const company = await companyFactory();

  const user = await userFactory({
    companyAssociations: {
      create: {
        company: { connect: { siret: company.siret } },
        role: role as UserRole
      }
    }
  });
  return { user, company };
};

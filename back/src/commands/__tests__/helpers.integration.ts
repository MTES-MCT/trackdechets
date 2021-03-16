import { resetDatabase } from "../../../integration-tests/helper";
import { CompanyType } from "@prisma/client";
import { userFactory, userWithCompanyFactory } from "../../__tests__/factories";
import prisma from "../../prisma";
import {
  getRecentlyAssociatedUsers,
  selectSecondOnboardingEmail
} from "../onboarding.helpers";

describe("Retrieve relevant users for onboarding emails", () => {
  afterEach(resetDatabase);
  it("should retrieve users associated yesterday", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const user = await userFactory({ firstAssociationDate: yesterday });
    await userFactory({ firstAssociationDate: new Date() }); // user associated just now
    await userFactory(); // user non associated
    const recipients = await getRecentlyAssociatedUsers({ daysAgo: 1 });
    expect(recipients.length).toEqual(1);
    expect(recipients[0].id).toEqual(user.id);
    expect(recipients[0].companyAssociations).toBeUndefined();
  });

  it("should retrieve users associated yesterday with related companies info", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await prisma.user.update({
      where: { id: user.id },
      data: { firstAssociationDate: yesterday }
    });
    await userFactory({ firstAssociationDate: new Date() }); // user associated just now
    await userFactory(); // user non associated
    const recipients = await getRecentlyAssociatedUsers({
      daysAgo: 1,
      retrieveCompanies: true
    });
    expect(recipients[0].id).toEqual(user.id);

    expect(recipients[0].companyAssociations[0].company.id).toEqual(company.id);
  });
});
// hardcoded values matching test .env config
const PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID = 11;
const PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID = 10;
describe("Select relevant email template function", () => {
  afterEach(resetDatabase);

  it("should select onboarding email for producers", async () => {
    await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["PRODUCER" as CompanyType]
      }
    }); // producer

    const recipients = await prisma.user.findMany({
      include: { companyAssociations: { include: { company: true } } }
    });

    const emailFn = selectSecondOnboardingEmail(recipients[0]);
    expect(emailFn("jim@example.test", "Jim").templateId).toEqual(
      PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID
    );
  });

  it.each([
    "COLLECTOR",
    "WASTEPROCESSOR",
    "TRANSPORTER",
    "WASTE_VEHICLES",
    "WASTE_CENTER",
    "TRADER",
    "ECO_ORGANISME"
  ])(
    "should select onboarding email for professionals (%p)",
    async companyType => {
      await userWithCompanyFactory("ADMIN", {
        companyTypes: {
          set: [companyType as CompanyType]
        }
      });

      const recipients = await prisma.user.findMany({
        include: { companyAssociations: { include: { company: true } } }
      });
      const emailFn = selectSecondOnboardingEmail(recipients[0]);
      expect(emailFn("jim@example.test", "Jim").templateId).toEqual(
        PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID
      );
    }
  );

  it.each([
    ["PRODUCER", "TRANSPORTER"],
    ["TRANSPORTER", "WASTEPROCESSOR"]
  ])(
    "should select onboarding email for professionals when company belongs to several categories",
    async (companyType1, companyType2) => {
      //when a company belongs to several category, the professional onboarding email is selected
      await userWithCompanyFactory("ADMIN", {
        companyTypes: {
          set: [companyType1 as CompanyType, companyType2 as CompanyType]
        }
      }); // prod
      const recipients = await prisma.user.findMany({
        include: { companyAssociations: { include: { company: true } } }
      });
      const emailFn = selectSecondOnboardingEmail(recipients[0]);
      expect(emailFn("jim@example.test", "Jim").templateId).toEqual(
        PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID
      );
    }
  );
});

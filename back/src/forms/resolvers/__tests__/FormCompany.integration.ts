import { CompanyType, Status, UserRole } from "@prisma/client";
import { Query } from "../../../generated/graphql/types";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";

const FORM = `
  query Form($id: ID!) {
    form(id: $id) {
      emitter {
        company {
          country
        }
      }
      recipient {
        company {
          country
        }
      }
      transporter {
        company {
          country
        }
      }
      nextDestination {
        company {
          country
        }
      }
    }
  }`;

describe("FormCompany resolver", () => {
  afterAll(resetDatabase);

  it("should return the right country for a Company", async () => {
    const { user: emitterUser, company: emitter } =
      await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.PRODUCER] }
      });

    const { user: destinationUser, company: destination } =
      await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      });

    const form = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        status: Status.SEALED,
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: destination.siret,
        transporters: {
          create: {
            transporterCompanyVatNumber: "BE0541696005"
          }
        },
        quantityReceived: 1,
        nextDestinationCompanyVatNumber: "BE0541696005"
      }
    });
    const { query } = makeClient(destinationUser);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: {
        id: form.id
      }
    });
    expect(data.form.emitter!.company!.country).toBe("FR");
    expect(data.form.recipient!.company!.country).toBe("FR");
    expect(data.form.transporter!.company!.country).toBe("BE");
    expect(data.form.nextDestination!.company!.country).toBe("BE");
  });
});

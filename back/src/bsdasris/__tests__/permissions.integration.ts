import { checkCanReadBsdasri } from "../permissions";
import { BsdasriType } from "@prisma/client";

import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import { bsdasriFactory, initialData } from "../__tests__/factories";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../__tests__/factories";

describe("Dasri permission helpers", () => {
  afterEach(resetDatabase);

  it("should deny dasri reading access to random user", async () => {
    const company = await companyFactory();
    const { user } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    try {
      await checkCanReadBsdasri(user, dasri);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it("should grant dasri reading access to user whose siret belongs to the form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const grant = await checkCanReadBsdasri(user, dasri);

    expect(grant).toBe(true);
  });
  it("should deny synthesis dasri reading access to user whose siret is not emitter on the associated form", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const mainCompany = await companyFactory();
    const initialCompany = await companyFactory();

    const initialBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(initialCompany)
      }
    });
    const synthesisBsdasri = await bsdasriFactory({
      opt: {
        type: BsdasriType.SYNTHESIS,
        ...initialData(mainCompany),
        synthesizing: { connect: [{ id: initialBsdasri.id }] }
      }
    });
    try {
      await checkCanReadBsdasri(user, synthesisBsdasri);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });
  it("should grant synthesis dasri reading access to user whose siret is emitter on the associated form", async () => {
    const { user, company: initialCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const mainCompany = await companyFactory();

    const initialBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(initialCompany)
      }
    });
    const synthesisBsdasri = await bsdasriFactory({
      opt: {
        type: BsdasriType.SYNTHESIS,
        ...initialData(mainCompany),
        synthesizing: { connect: [{ id: initialBsdasri.id }] }
      }
    });

    const grant = await checkCanReadBsdasri(user, synthesisBsdasri);

    expect(grant).toBe(true);
  });
});

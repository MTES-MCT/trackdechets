import { checkCanRead } from "../permissions";
import { BsdasriType } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
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

    await expect(checkCanRead(user, dasri)).rejects.toThrow(
      "Vous n'êtes pas autorisé à accéder à ce bordereau"
    );
  });

  it("should grant dasri reading access to user whose siret belongs to the form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const grant = await checkCanRead(user, dasri);

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

    await expect(checkCanRead(user, synthesisBsdasri)).rejects.toThrow(
      "Vous n'êtes pas autorisé à accéder à ce bordereau"
    );
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

    const grant = await checkCanRead(user, synthesisBsdasri);

    expect(grant).toBe(true);
  });

  it("should deny grouping dasri reading access to user whose siret is not emitter on the grouped form", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const initialCompany = await companyFactory();
    const mainCompany = await companyFactory();

    const initialBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(initialCompany)
      }
    });
    const groupingBsdasri = await bsdasriFactory({
      opt: {
        type: BsdasriType.GROUPING,
        ...initialData(mainCompany),
        grouping: { connect: [{ id: initialBsdasri.id }] }
      }
    });

    await expect(checkCanRead(user, groupingBsdasri)).rejects.toThrow(
      "Vous n'êtes pas autorisé à accéder à ce bordereau"
    );
  });

  it("should grant grouping dasri reading access to user whose siret is emitter on the grouped form", async () => {
    const { user, company: initialCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const mainCompany = await companyFactory();

    const initialBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(initialCompany)
      }
    });
    const groupingBsdasri = await bsdasriFactory({
      opt: {
        type: BsdasriType.GROUPING,
        ...initialData(mainCompany),
        grouping: { connect: [{ id: initialBsdasri.id }] }
      }
    });

    const grant = await checkCanRead(user, groupingBsdasri);

    expect(grant).toBe(true);
  });
});

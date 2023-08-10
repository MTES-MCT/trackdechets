import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";
import { BsdasriType } from "@prisma/client";

import gql from 'graphql-tag';

const BSDASRI_PDF = gql`
  query BsdasriPdf($id: ID!) {
    bsdasriPdf(id: $id) {
      token
    }
  }
`;

describe("Query.BsdasriPdf", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const { errors } = await query<Pick<Query, "bsdasriPdf">>(BSDASRI_PDF, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should forbid access to user not on the bsd (simple dasri)", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);
    const { errors } = await query<Pick<Query, "bsdasriPdf">>(BSDASRI_PDF, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should return a token for requested id (simple dasri)", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasriPdf">>(BSDASRI_PDF, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasriPdf.token).toBeTruthy();
  });
  it("should forbid access to user not on the bsd (synthesis dasri)", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const initialCompany = await companyFactory();
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
    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bsdasriPdf">>(BSDASRI_PDF, {
      variables: { id: synthesisBsdasri.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should return a token for requested id (synthesis dasri)", async () => {
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
    // user from inital company tries to access pdf
    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasriPdf">>(BSDASRI_PDF, {
      variables: { id: synthesisBsdasri.id }
    });

    expect(data.bsdasriPdf.token).toBeTruthy();
  });

  it("should forbid access to user not on the bsd (grouping dasri)", async () => {
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
    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bsdasriPdf">>(BSDASRI_PDF, {
      variables: { id: groupingBsdasri.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should return a token for requested id (grouping dasri)", async () => {
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
    // user from inital company tries to access pdf
    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasriPdf">>(BSDASRI_PDF, {
      variables: { id: groupingBsdasri.id }
    });

    expect(data.bsdasriPdf.token).toBeTruthy();
  });
});

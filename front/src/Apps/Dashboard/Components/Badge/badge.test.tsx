import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";
import { BsdStatusCode } from "Apps/Common/types/bsdTypes";
import { BsdType } from "generated/graphql/types";

describe("Bsd Badge status", () => {
  describe("case: DRAFT/INITITAL(draft=true)", () => {
    test("Bsdd with Draft status should return Brouillon", () => {
      render(<Badge status={BsdStatusCode.Draft} />);
      expect(screen.getByText(/Brouillon/i));
    });

    test("Bsd[x] with Initial status should return Initial", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft />);
      expect(screen.getByText(/Brouillon/i));
    });

    test("Bsdasri with Initial status should return Initial", () => {
      render(
        <Badge
          status={BsdStatusCode.Initial}
          isDraft
          bsdType={BsdType.Bsdasri}
        />
      );
      expect(screen.getByText(/Brouillon/i));
    });
  });

  describe("case: INITITAL(draft=false)", () => {
    test("Bsd[x] with Initial status should return 'en attente de signature par l'émetteur'", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft={false} />);
      expect(screen.getByText(/En attente de signature par l’émetteur/i));
    });

    test("Bsdasri with Initial status should return Initial", () => {
      render(
        <Badge
          status={BsdStatusCode.Initial}
          isDraft={false}
          bsdType={BsdType.Bsdasri}
        />
      );
      expect(screen.getByText(/Initial/i));
    });

    test("Bsvhu with Initial status should return Initial", () => {
      render(
        <Badge
          status={BsdStatusCode.Initial}
          isDraft={false}
          bsdType={BsdType.Bsvhu}
        />
      );
      expect(screen.getByText(/Initial/i));
    });

    test("Bsda with Initial status should return Initial", () => {
      render(
        <Badge
          status={BsdStatusCode.Initial}
          isDraft={false}
          bsdType={BsdType.Bsda}
        />
      );
      expect(screen.getByText(/Initial/i));
    });
  });

  test("SEALED", () => {
    render(<Badge status={BsdStatusCode.Sealed} />);
    expect(screen.getByText(/En attente de signature par l’émetteur/i));
  });

  test("SENT", () => {
    render(<Badge status={BsdStatusCode.Sent} />);
    expect(screen.getByText(/EN ATTENTE DE RÉCEPTION/i));
  });

  test("RECEIVED", () => {
    render(<Badge status={BsdStatusCode.Received} />);
    expect(screen.getByText(/reçu, en attente d’acceptation ou de refus/i));
  });
  test("ACCEPTED", () => {
    render(<Badge status={BsdStatusCode.Accepted} />);
    expect(screen.getByText(/ACCEPTÉ, EN ATTENTE DE TRAITEMENT/i));
  });
  test("PROCESSED", () => {
    render(<Badge status={BsdStatusCode.Processed} />);
    expect(screen.getByText(/Traité/i));
  });
  test("AWAITING_GROUP", () => {
    render(<Badge status={BsdStatusCode.AwaitingGroup} />);
    expect(screen.getByText(/EN ATTENTE DE REGROUPEMENT/i));
  });
  test("GROUPED", () => {
    render(<Badge status={BsdStatusCode.Grouped} />);
    expect(screen.getByText(/ANNEXÉ À UN BORDEREAU DE REGROUPEMENT/i));
  });
  test("NO_TRACEABILITY", () => {
    render(<Badge status={BsdStatusCode.NoTraceability} />);
    expect(
      screen.getByText(/regroupé, avec autorisation de RUPTURE DE TRAÇABILITÉ/i)
    );
  });
  test("REFUSED", () => {
    render(<Badge status={BsdStatusCode.Refused} />);
    expect(screen.getByText(/REFUSÉ/i));
  });
  test("TEMP_STORED", () => {
    render(<Badge status={BsdStatusCode.TempStored} />);
    expect(
      screen.getByText(
        /ARRIVÉ À L’ENTREPOSAGE PROVISOIRE, EN ATTENTE D’ACCEPTATION/i
      )
    );
  });
  test("TEMP_STORER_ACCEPTED", () => {
    render(<Badge status={BsdStatusCode.TempStorerAccepted} />);
    expect(
      screen.getByText(/entreposé temporairement ou en reconditionnement/i)
    );
  });
  test("RESEALED", () => {
    render(<Badge status={BsdStatusCode.Resealed} />);
    expect(
      screen.getByText(
        /en attente de signature par l’installation d’entreposage provisoire/i
      )
    );
  });
  test("RESENT", () => {
    render(<Badge status={BsdStatusCode.Resent} />);
    expect(screen.getByText(/EN ATTENTE DE RÉCEPTION pour traitement/i));
  });
  test("SIGNED_BY_PRODUCER", () => {
    render(<Badge status={BsdStatusCode.SignedByProducer} />);
    expect(screen.getByText(/signé par le producteur/i));
  });
  test("SIGNED_BY_EMITTER", () => {
    render(<Badge status={BsdStatusCode.SignedByEmitter} />);
    expect(screen.getByText(/signé par l’émetteur/i));
  });
  test("INTERMEDIATELY_PROCESSED", () => {
    render(<Badge status={BsdStatusCode.IntermediatelyProcessed} />);
    expect(screen.getByText(/ANNEXÉ À UN BORDEREAU DE REGROUPEMENT/i));
  });
  test("SIGNED_BY_TEMP_STORER", () => {
    render(<Badge status={BsdStatusCode.SignedByTempStorer} />);
    expect(
      screen.getByText(/Signé par l'installation d'entreposage provisoire/i)
    );
  });
  test("PARTIALLY_REFUSED", () => {
    render(<Badge status={BsdStatusCode.PartiallyRefused} />);
    expect(screen.getByText(/Partiellement refusé/i));
  });
  test("FOLLOWED_WITH_PNTTD", () => {
    render(<Badge status={BsdStatusCode.FollowedWithPnttd} />);
    expect(screen.getByText(/Suivi via PNTTD/i));
  });
  test("SIGNED_BY_WORKER", () => {
    render(<Badge status={BsdStatusCode.SignedByWorker} />);
    expect(screen.getByText(/Signé par l'entreprise de travaux/i));
  });
  test("AWAITING_CHILD", () => {
    render(<Badge status={BsdStatusCode.AwaitingChild} />);
    expect(screen.getByText(/En attente ou associé à un BSD suite/i));
  });
});

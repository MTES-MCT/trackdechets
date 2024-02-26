import React from "react";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";
import { BsdStatusCode } from "../../../common/types/bsdTypes";
import { BsdType } from "@td/codegen-ui";

describe("Bsd Badge status", () => {
  describe("case: DRAFT/INITITAL(draft=true)", () => {
    test("Bsdd with Draft status should return Brouillon", () => {
      render(<Badge status={BsdStatusCode.Draft} />);
      expect(screen.getByText(/Brouillon/i));
    });

    test("Bsd[x] with Initial status should return Brouillon", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft />);
      expect(screen.getByText(/Brouillon/i));
    });

    test("Bsdasri with Initial status should return Brouillon", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft />);
      expect(screen.getByText(/Brouillon/i));
    });
  });

  describe("case: INITITAL(draft=false)", () => {
    test("Bsd[x] with Initial status should return 'publié'", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft={false} />);
      expect(screen.getByText(/publié/i));
    });

    test("Bsdasri with Initial status should return publié", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft={false} />);
      expect(screen.getByText(/publié/i));
    });

    test("Bsvhu with Initial status should return publié", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft={false} />);
      expect(screen.getByText(/publié/i));
    });

    test("Bsda with Initial status should return publié", () => {
      render(<Badge status={BsdStatusCode.Initial} isDraft={false} />);
      expect(screen.getByText(/publié/i));
    });
  });

  test("SEALED", () => {
    render(<Badge status={BsdStatusCode.Sealed} />);
    expect(screen.getByText(/publié/i));
  });

  test("SENT", () => {
    render(<Badge status={BsdStatusCode.Sent} />);
    expect(screen.getByText(/Signé par le transporteur/i));
  });

  test("SENT multi-modal", () => {
    const transporter1 = { id: "t1", takenOverAt: new Date().toISOString() };
    const transporter2 = { id: "t2", takenOverAt: new Date().toISOString() };
    const transporter3 = { id: "t3", takenOverAt: null };

    render(
      <Badge
        status={BsdStatusCode.Sent}
        transporters={[transporter1, transporter2, transporter3]}
      />
    );
    expect(screen.getByText(/Signé par le transporteur n°2/i));
  });

  test("RECEIVED", () => {
    render(<Badge status={BsdStatusCode.Received} />);
    expect(screen.getByText(/Reçu, en attente d'acceptation/i));
  });
  test("RECEIVED bsdasri", () => {
    render(<Badge status={BsdStatusCode.Received} bsdType={BsdType.Bsdasri} />);
    expect(screen.getByText(/ACCEPTÉ, EN ATTENTE DE TRAITEMENT/i));
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
    expect(screen.getByText(/En attente d'un bordereau suite/i));
  });
  test("AWAITING_GROUP bsdasri", () => {
    render(
      <Badge status={BsdStatusCode.AwaitingGroup} bsdType={BsdType.Bsdasri} />
    );
    expect(screen.getByText(/Annexé à un bordereau suite/i));
  });
  test("AWAITING_GROUP bsff", () => {
    render(
      <Badge status={BsdStatusCode.AwaitingGroup} bsdType={BsdType.Bsff} />
    );
    expect(screen.getByText(/En attente d'un bordereau suite/i));
  });
  test("GROUPED", () => {
    render(<Badge status={BsdStatusCode.Grouped} />);
    expect(screen.getByText(/Annexé à un bordereau suite/i));
  });
  test("NO_TRACEABILITY", () => {
    render(<Badge status={BsdStatusCode.NoTraceability} />);
    expect(screen.getByText("Traité (avec rupture de traçabilité)"));
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
    expect(screen.getByText(/BSD suite préparé/i));
  });
  test("RESENT", () => {
    render(<Badge status={BsdStatusCode.Resent} />);
    expect(screen.getByText(/signé par le transporteur/i));
  });
  test("SIGNED_BY_PRODUCER", () => {
    render(<Badge status={BsdStatusCode.SignedByProducer} />);
    expect(screen.getByText(/signé par l’émetteur/i));
  });
  test("SIGNED_BY_EMITTER", () => {
    render(<Badge status={BsdStatusCode.SignedByEmitter} />);
    expect(screen.getByText(/signé par l’émetteur/i));
  });
  test("INTERMEDIATELY_PROCESSED", () => {
    render(<Badge status={BsdStatusCode.IntermediatelyProcessed} />);
    expect(screen.getByText(/En attente d'un bordereau suite/i));
  });
  test("INTERMEDIATELY_PROCESSED bsff", () => {
    render(
      <Badge
        status={BsdStatusCode.IntermediatelyProcessed}
        bsdType={BsdType.Bsff}
      />
    );
    expect(screen.getByText(/En attente de traitement/i));
  });
  test("INTERMEDIATELY_PROCESSED bsdasri", () => {
    render(
      <Badge
        status={BsdStatusCode.IntermediatelyProcessed}
        bsdType={BsdType.Bsdasri}
      />
    );
    expect(screen.getByText(/Annexé à un bordereau suite/i));
  });
  test("INTERMEDIATELY_PROCESSED", () => {
    render(<Badge status={BsdStatusCode.IntermediatelyProcessed} />);
    expect(screen.getByText(/En attente d'un bordereau suite/i));
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
    expect(screen.getByText(/Annexé à un bordereau suite/i));
  });
  test("AWAITING_CHILD bsda not groupedIn", () => {
    render(
      <Badge status={BsdStatusCode.AwaitingChild} bsdType={BsdType.Bsda} />
    );
    expect(screen.getByText(/En attente d'un bordereau suite/i));
  });
  test("AWAITING_CHILD bsda groupedIn", () => {
    render(
      <Badge
        status={BsdStatusCode.AwaitingChild}
        bsdType={BsdType.Bsda}
        bsdaAnnexed
      />
    );
    expect(screen.getByText(/Annexé à un bordereau suite/i));
  });
  test("AWAITING_CHILD bsff", () => {
    render(
      <Badge status={BsdStatusCode.AwaitingChild} bsdType={BsdType.Bsff} />
    );
    expect(screen.getByText(/En attente de traitement/i));
  });
});

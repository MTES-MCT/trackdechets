import * as React from "react";
import { MockedProvider } from "@apollo/client/testing";
import {
  render,
  screen,
  wait,
  waitForElement,
  fireEvent,
} from "@testing-library/react";
import { generatePath, MemoryRouter, Route } from "react-router-dom";
import {
  Form,
  FormRole,
  FormStatus,
  createFormCompanyMock,
  createEmitterMock,
  createFormMock,
  createTransporterMock,
  createStateSummaryMock,
  createTemporaryStorageDetailMock,
  createRecipientMock,
  createDestinationMock,
} from "generated/graphql/types";
import { TransportContent } from "dashboard/transport/Transport";
import { GET_TRANSPORT_SLIPS } from "dashboard/transport/queries";
import { mockMatchMediaWidth } from "common/__mocks__/matchmedia.mock";
import routes from "common/routes";

const PRODUCER = createEmitterMock({
  company: createFormCompanyMock({
    siret: "producer-1",
    name: "PRODUCER 1",
  }),
});

const TRANSPORTER = createTransporterMock({
  company: createFormCompanyMock({
    siret: "transporter-1",
    name: "TRANSPORTER 1",
  }),
});

const COLLECTOR = createRecipientMock({
  company: createFormCompanyMock({
    siret: "collector-1",
    name: "COLLECTOR 1",
  }),
});

async function renderWith({ forms }: { forms: Form[] }) {
  render(
    <MockedProvider
      mocks={[
        {
          request: {
            query: GET_TRANSPORT_SLIPS,
            variables: {
              siret: TRANSPORTER.company!.siret,
              status: [
                FormStatus.Sealed,
                FormStatus.Sent,
                FormStatus.Resealed,
                FormStatus.Resent,
              ],
              roles: [FormRole.Transporter],
            },
          },
          result: {
            data: {
              forms,
            },
          },
        },
      ]}
    >
      <MemoryRouter
        initialEntries={[
          generatePath(routes.dashboard.transport.toCollect, {
            siret: TRANSPORTER.company!.siret!,
          }),
        ]}
      >
        <Route path={routes.dashboard.transport.toCollect}>
          <TransportContent formType="TO_TAKE_OVER" />
        </Route>
      </MemoryRouter>
    </MockedProvider>
  );

  await wait();
}

describe("<Transport />", () => {
  describe("when leaving the producer for the final collector", () => {
    beforeEach(async () => {
      mockMatchMediaWidth(1000);
      await renderWith({
        forms: [
          createFormMock({
            status: FormStatus.Sealed,
            emitter: createEmitterMock({
              company: PRODUCER.company,
            }),
            transporter: createTransporterMock({
              company: TRANSPORTER.company,
            }),
            recipient: createRecipientMock({
              company: COLLECTOR.company,
            }),
            stateSummary: createStateSummaryMock({
              emitter: PRODUCER.company,
              transporter: TRANSPORTER.company,
              recipient: COLLECTOR.company,
            }),
          }),
        ],
      });
    });

    it("should list 1 form", () => {
      expect(screen.getAllByText(PRODUCER.company!.name!).length).toBe(1);
    });

    describe("when the transporter signs", () => {
      beforeEach(() => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));
      });

      it("should display the producer as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          PRODUCER.company!.name!
        );
      });

      it("should display the final collector as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(COLLECTOR.company!.name!);
      });
    });

    describe("when the producer signs", () => {
      beforeEach(async () => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));

        fireEvent.click(
          screen.getByLabelText(
            "J'ai vérifié que les déchets à transporter correspondent aux informations ci avant."
          )
        );
        fireEvent.click(
          screen.getByText("Signer par le transporteur").closest("button")!
        );

        await waitForElement(() =>
          screen.getByText((text, el) => /Signer par le producteur/i.test(text))
        );
      });

      it("should display the producer as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          PRODUCER.company!.name!
        );
      });

      it("should display the transporter", () => {
        expect(screen.getByLabelText("Transporteur")).toHaveTextContent(
          TRANSPORTER.company!.name!
        );
      });

      it("should display the final collector as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(COLLECTOR.company!.name!);
      });
    });
  });

  describe("when leaving the producer for a temporary storage", () => {
    const TEMPORARY_STORAGE_RECIPIENT = createRecipientMock({
      company: TRANSPORTER.company,
    });

    beforeEach(async () => {
      mockMatchMediaWidth(1000);
      await renderWith({
        forms: [
          createFormMock({
            status: FormStatus.Sealed,
            emitter: createEmitterMock({
              company: PRODUCER.company,
            }),
            transporter: createTransporterMock({
              company: TRANSPORTER.company,
            }),
            recipient: TEMPORARY_STORAGE_RECIPIENT,
            temporaryStorageDetail: createTemporaryStorageDetailMock({
              destination: createDestinationMock({
                company: COLLECTOR.company,
              }),
              transporter: null,
            }),
            stateSummary: createStateSummaryMock({
              emitter: PRODUCER.company,
              transporter: TRANSPORTER.company,
              recipient: TEMPORARY_STORAGE_RECIPIENT.company,
            }),
          }),
        ],
      });
    });

    describe("when the transporter signs", () => {
      beforeEach(() => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));
      });

      it("should display the producer as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          PRODUCER.company!.name!
        );
      });

      it("should display the temporary storage as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(TEMPORARY_STORAGE_RECIPIENT.company!.name!);
      });
    });

    describe("when the producer signs", () => {
      beforeEach(async () => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));
        fireEvent.click(
          screen.getByLabelText(
            "J'ai vérifié que les déchets à transporter correspondent aux informations ci avant."
          )
        );
        fireEvent.click(
          screen.getByText("Signer par le transporteur").closest("button")!
        );

        await waitForElement(() =>
          screen.getByText((text, el) => /Signer par le producteur/i.test(text))
        );
      });

      it("should display the producer as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          PRODUCER.company!.name!
        );
      });

      it("should display the transporter", () => {
        expect(screen.getByLabelText("Transporteur")).toHaveTextContent(
          TRANSPORTER.company!.name!
        );
      });

      it("should display the temporary storage as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(TEMPORARY_STORAGE_RECIPIENT.company!.name!);
      });
    });
  });

  describe("when leaving the temporary storage for the final collector", () => {
    const TEMPORARY_STORAGE_RECIPIENT = createRecipientMock({
      company: TRANSPORTER.company,
    });

    beforeEach(async () => {
      mockMatchMediaWidth(1000);
      await renderWith({
        forms: [
          createFormMock({
            status: FormStatus.Resealed,
            emitter: createEmitterMock({
              company: PRODUCER.company,
            }),
            transporter: createTransporterMock({
              company: TRANSPORTER.company,
            }),
            recipient: TEMPORARY_STORAGE_RECIPIENT,
            temporaryStorageDetail: createTemporaryStorageDetailMock({
              destination: createDestinationMock({
                company: COLLECTOR.company,
              }),
              transporter: TRANSPORTER,
            }),
            stateSummary: createStateSummaryMock({
              emitter: TEMPORARY_STORAGE_RECIPIENT.company,
              transporter: TRANSPORTER.company,
              recipient: COLLECTOR.company,
            }),
          }),
        ],
      });

      fireEvent.click(screen.getByTitle("Signer ce bordereau"));
    });

    describe("when the transporter signs", () => {
      beforeEach(() => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));
      });

      it("should display the temporary storage as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          TEMPORARY_STORAGE_RECIPIENT.company!.name!
        );
      });

      it("should display the final collector as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(COLLECTOR.company!.name!);
      });
    });

    describe("when the temporary storage signs", () => {
      beforeEach(async () => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));

        fireEvent.click(
          screen.getByLabelText(
            "J'ai vérifié que les déchets à transporter correspondent aux informations ci avant."
          )
        );

        fireEvent.click(
          screen.getByText("Signer par le transporteur").closest("button")!
        );

        await waitForElement(() =>
          screen.getByText((text, el) => /Signer par le détenteur/i.test(text))
        );
      });

      it("should display the temporary storage as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          TEMPORARY_STORAGE_RECIPIENT.company!.name!
        );
      });

      it("should display the transporter", () => {
        expect(screen.getByLabelText("Transporteur")).toHaveTextContent(
          TRANSPORTER.company!.name!
        );
      });

      it("should display final collector as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(COLLECTOR.company!.name!);
      });
    });
  });
});

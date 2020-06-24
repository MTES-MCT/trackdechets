import * as React from "react";
import { MockedProvider } from "@apollo/react-testing";
import {
  render,
  screen,
  wait,
  waitForElement,
  fireEvent,
} from "@testing-library/react";
import {
  AppMocks,
  createCompany,
  createEmitter,
  createForm,
  createTransporter,
  createStateSummary,
  createTemporaryStorageDetail,
  createRecipient,
  createDestination,
} from "../../../__mocks__";
import { Form, FormRole, FormStatus } from "../../../generated/graphql/types";
import Transport, { GET_TRANSPORT_SLIPS } from "../Transport";

const PRODUCER = createEmitter({
  company: createCompany({
    siret: "producer-1",
    name: "PRODUCER 1",
  }),
});

const TRANSPORTER = createTransporter({
  company: createCompany({
    siret: "transporter-1",
    name: "TRANSPORTER 1",
  }),
});

const COLLECTOR = createRecipient({
  company: createCompany({
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
      <AppMocks siret={TRANSPORTER.company!.siret!}>
        <Transport />
      </AppMocks>
    </MockedProvider>
  );

  await wait();
}

describe("<Transport />", () => {
  describe("when leaving the producer for the final collector", () => {
    beforeEach(async () => {
      await renderWith({
        forms: [
          createForm({
            status: FormStatus.Sealed,
            emitter: createEmitter({
              company: PRODUCER.company,
            }),
            transporter: createTransporter({
              company: TRANSPORTER.company,
            }),
            recipient: createRecipient({
              company: COLLECTOR.company,
            }),
            stateSummary: createStateSummary({
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
        fireEvent.click(screen.getByText("Suivant"));

        await waitForElement(() => screen.getByText("Valider"));
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
    const TEMPORARY_STORAGE_RECIPIENT = createRecipient({
      company: TRANSPORTER.company,
    });

    beforeEach(async () => {
      await renderWith({
        forms: [
          createForm({
            status: FormStatus.Sealed,
            emitter: createEmitter({
              company: PRODUCER.company,
            }),
            transporter: createTransporter({
              company: TRANSPORTER.company,
            }),
            recipient: TEMPORARY_STORAGE_RECIPIENT,
            temporaryStorageDetail: createTemporaryStorageDetail({
              destination: createDestination({
                company: COLLECTOR.company,
              }),
              transporter: null,
            }),
            stateSummary: createStateSummary({
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
        fireEvent.click(screen.getByText("Suivant"));

        await waitForElement(() => screen.getByText("Valider"));
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
    const TEMPORARY_STORAGE_RECIPIENT = createRecipient({
      company: TRANSPORTER.company,
    });

    beforeEach(async () => {
      await renderWith({
        forms: [
          createForm({
            status: FormStatus.Resealed,
            emitter: createEmitter({
              company: PRODUCER.company,
            }),
            transporter: createTransporter({
              company: TRANSPORTER.company,
            }),
            recipient: TEMPORARY_STORAGE_RECIPIENT,
            temporaryStorageDetail: createTemporaryStorageDetail({
              destination: createDestination({
                company: COLLECTOR.company,
              }),
              transporter: TRANSPORTER,
            }),
            stateSummary: createStateSummary({
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
        fireEvent.click(screen.getByText("Suivant"));

        await waitForElement(() => screen.getByText("Valider"));
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

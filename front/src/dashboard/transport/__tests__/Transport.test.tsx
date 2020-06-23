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

const EMITTER = createEmitter({
  company: createCompany({
    siret: "emitter-1",
    name: "EMITTER 1",
  }),
});

const TRANSPORTER = createTransporter({
  company: createCompany({
    siret: "transporter-1",
    name: "TRANSPORTER 1",
  }),
});

const RECIPIENT = createRecipient({
  company: createCompany({
    siret: "recipient-1",
    name: "RECIPIENT 1",
  }),
});

async function renderWith({ form = {} }: { form?: Partial<Form> }) {
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
              forms: [
                createForm({
                  status: FormStatus.Sealed,
                  emitter: createEmitter({
                    company: EMITTER.company,
                  }),
                  transporter: createTransporter({
                    company: TRANSPORTER.company,
                  }),
                  recipient: createRecipient({
                    company: RECIPIENT.company,
                  }),
                  stateSummary: createStateSummary({
                    emitter: EMITTER.company,
                    transporter: TRANSPORTER.company,
                    recipient: RECIPIENT.company,
                  }),
                  ...form,
                }),
              ],
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
  describe("with a single transport", () => {
    beforeEach(async () => {
      await renderWith({});
    });

    it("should list 1 form", () => {
      expect(screen.getAllByText(EMITTER.company!.name!).length).toBe(1);
    });

    describe("when the transporter signs", () => {
      beforeEach(() => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));
      });

      it("should open the signature modal", () => {
        expect(
          screen.getByText(
            (content, element) =>
              element.textContent ===
              "Cet écran est à lire et signer par le transporteur"
          )
        ).toBeInTheDocument();
      });

      it("should display the emitter as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          EMITTER.company!.name!
        );
      });

      it("should display the final destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(RECIPIENT.company!.name!);
      });
    });

    describe("when the emitter signs", () => {
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

      it("should display the emitter as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          EMITTER.company!.name!
        );
      });

      it("should display the transporter", () => {
        expect(screen.getByLabelText("Transporteur")).toHaveTextContent(
          TRANSPORTER.company!.name!
        );
      });

      it("should display the final destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(RECIPIENT.company!.name!);
      });
    });
  });

  describe("with a temporary storage", () => {
    // When there is a temporary storage area, the recipient is that temporary storage area
    // until it is processed further.
    // The final recipient can be found in TemporaryStorageDetail.destination.
    const TEMPORARY_RECIPIENT = createRecipient({
      company: TRANSPORTER.company,
    });

    beforeEach(async () => {
      await renderWith({
        form: {
          recipient: TEMPORARY_RECIPIENT,
          temporaryStorageDetail: createTemporaryStorageDetail({
            destination: createDestination({
              company: RECIPIENT.company,
            }),
            transporter: TRANSPORTER,
          }),
        },
      });
    });

    describe("when the transporter signs", () => {
      beforeEach(() => {
        fireEvent.click(screen.getByTitle("Signer ce bordereau"));
      });

      it("should display the emitter as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          EMITTER.company!.name!
        );
      });

      it("should display the temporary storage as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(TEMPORARY_RECIPIENT.company!.name!);
      });
    });

    describe("when the emitter signs", () => {
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

      it("should display the emitter as the collect address", () => {
        expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
          EMITTER.company!.name!
        );
      });

      it("should display the transporter", () => {
        expect(screen.getByLabelText("Transporteur")).toHaveTextContent(
          TRANSPORTER.company!.name!
        );
      });

      // FIXME: the destination should be the temporary storage or the final recipient for this screen?
      it.skip("should display the temporary storage as the destination", () => {
        expect(
          screen.getByLabelText("Destination du déchet")
        ).toHaveTextContent(TEMPORARY_RECIPIENT.company!.name!);
      });
    });
  });
});

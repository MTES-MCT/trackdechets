import * as React from "react";
import { MockedProvider } from "@apollo/react-testing";
import { render, screen, wait, fireEvent } from "@testing-library/react";
import {
  AppMocks,
  createCompany,
  createEmitter,
  createForm,
  createTransporter,
  createStateSummary,
  createTemporaryStorageDetail,
  createRecipient,
} from "../../../__mocks__";
import { Form, FormRole, FormStatus } from "../../../generated/graphql/types";
import Transport, { GET_TRANSPORT_SLIPS } from "../Transport";

const EMITTER_COMPANY = createCompany({
  siret: "emitter-1",
  name: "EMITTER 1",
});

const TRANSPORTER_COMPANY = createCompany({
  siret: "transporter-1",
  name: "TRANSPORTER 1",
});

const RECIPIENT_COMPANY = createCompany({
  siret: "recipient-1",
  name: "RECIPIENT 1",
});

async function renderWith({ form = {} }: { form?: Partial<Form> }) {
  render(
    <MockedProvider
      mocks={[
        {
          request: {
            query: GET_TRANSPORT_SLIPS,
            variables: {
              siret: TRANSPORTER_COMPANY.siret,
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
                    company: EMITTER_COMPANY,
                  }),
                  transporter: createTransporter({
                    company: TRANSPORTER_COMPANY,
                  }),
                  recipient: createRecipient({
                    company: RECIPIENT_COMPANY,
                  }),
                  stateSummary: createStateSummary({
                    emitter: EMITTER_COMPANY,
                    transporter: TRANSPORTER_COMPANY,
                  }),
                  ...form,
                }),
              ],
            },
          },
        },
      ]}
    >
      <AppMocks siret={TRANSPORTER_COMPANY.siret!}>
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
      expect(screen.getAllByText(EMITTER_COMPANY.name!).length).toBe(1);
    });

    it("should open the signature modal", () => {
      fireEvent.click(screen.getByTitle("Signer ce bordereau"));

      expect(
        screen.getByText(
          (content, element) =>
            element.textContent ===
            "Cet écran est à lire et signer par le transporteur"
        )
      ).toBeInTheDocument();
    });

    it("should display the emitter as the collect address", () => {
      fireEvent.click(screen.getByTitle("Signer ce bordereau"));

      expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
        EMITTER_COMPANY.name!
      );
    });
  });

  describe("with a temporary storage", () => {
    beforeEach(async () => {
      await renderWith({
        form: {
          temporaryStorageDetail: createTemporaryStorageDetail({}),
        },
      });
    });

    it("should display the emitter as the collect address", () => {
      fireEvent.click(screen.getByTitle("Signer ce bordereau"));

      expect(screen.getByLabelText("Lieu de collecte")).toHaveTextContent(
        EMITTER_COMPANY.name!
      );
    });
  });
});

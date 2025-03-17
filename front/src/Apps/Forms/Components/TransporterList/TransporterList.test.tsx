import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransporterList } from "./TransporterList";
import { Formik } from "formik";
import { MockedProvider } from "@apollo/client/testing";
import {
  CreateOrUpdateTransporterInput,
  initialFormTransporter
} from "../../../../form/bsdd/utils/initial-state";
import {
  BsdType,
  BsdaTransporter,
  TransportMode,
  Transporter
} from "@td/codegen-ui";
import { CreateOrUpdateBsdaTransporterInput } from "../../../../form/bsda/stepper/initial-state";
import { initialTransporter } from "../../../common/data/initialState";

function getBsddTransporter(
  data?: Partial<CreateOrUpdateTransporterInput>
): CreateOrUpdateTransporterInput {
  return {
    id: "id",
    mode: TransportMode.Road,
    isExemptedOfReceipt: false,
    company: {
      siret: "11111111111111",
      name: "Transport qui roule",
      contact: "Mr T",
      phone: "01 01 01 01 01",
      mail: "contact@transportquiroule.fr",
      address: "Somewhere"
    },
    receipt: "Rec",
    department: "07",
    validityLimit: new Date().toISOString(),
    numberPlate: "FOO",
    ...data
  };
}

function getBsdaTransporter(
  data?: Partial<CreateOrUpdateBsdaTransporterInput>
): CreateOrUpdateBsdaTransporterInput {
  return {
    id: "id",
    company: {
      siret: "11111111111111",
      name: "Transport qui roule",
      contact: "Mr T",
      phone: "01 01 01 01 01",
      mail: "contact@transportquiroule.fr",
      address: "Somewhere"
    },
    transport: {
      plates: ["FOO"],
      mode: TransportMode.Road
    },
    recepisse: {
      number: "Rec",
      department: "07",
      validityLimit: new Date().toISOString()
    },
    ...data
  };
}

function getInitialTransporter(bsdType: BsdType) {
  return bsdType === BsdType.Bsdd ? initialFormTransporter : initialTransporter;
}

describe("<TransporterList />", () => {
  const mocks = [];

  const component = (
    transporters: CreateOrUpdateTransporterInput[],
    bsdType: BsdType
  ) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      <Formik initialValues={{ transporters }} onSubmit={jest.fn()}>
        <TransporterList fieldName="transporters" bsdType={bsdType} />
      </Formik>
    </MockedProvider>
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "component renders without errors when bsdType is %p",
    bsdType => {
      const { container } = render(
        component([getInitialTransporter(bsdType)], bsdType)
      );
      expect(container).toBeTruthy();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "delete button is disabled when there is only one transporter and bsdType is %p",
    bsdType => {
      render(component([getInitialTransporter(bsdType)], bsdType));
      const addButton = screen.getByTestId("transporter__1__form");
      expect(addButton).toBeDisabled();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "up button is disabled when there is only one transporter and bsdType is %p",
    bsdType => {
      render(component([getInitialTransporter(bsdType)], bsdType));
      const upButton = screen.getByTitle("Remonter");
      expect(upButton).toBeDisabled();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda])(
    "down button is disabled when there is only one transporter and bsdType is %p",
    bsdType => {
      render(component([getInitialTransporter(bsdType)], bsdType));
      const downButton = screen.getByTitle("Descendre");
      expect(downButton).toBeDisabled();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "new transporters can be added until 5 when bsdType is %p",
    async bsdType => {
      render(component([getInitialTransporter(bsdType)], bsdType));
      const addButton = screen.getByTitle("Ajouter");
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      const transporter1 = await screen.findByText("1 - Transporteur");
      const transporter2 = await screen.findByText("2 - Transporteur");
      const transporter3 = await screen.findByText("3 - Transporteur");
      const transporter4 = await screen.findByText("4 - Transporteur");
      const transporter5 = await screen.findByText("5 - Transporteur");
      expect(transporter1).toBeInTheDocument();
      expect(transporter2).toBeInTheDocument();
      expect(transporter3).toBeInTheDocument();
      expect(transporter4).toBeInTheDocument();
      expect(transporter5).toBeInTheDocument();
      fireEvent.click(addButton);
      await expect(() =>
        screen.findByText("6 - Transporteur")
      ).rejects.toThrow();
      const addButtons = screen.getAllByTitle("Ajouter");
      addButtons.forEach(b => expect(b).toBeDisabled());
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "transporters can be deleted with the delete button when bsdType is %p",
    async bsdType => {
      render(
        component(
          [getInitialTransporter(bsdType), getInitialTransporter(bsdType)],
          bsdType
        )
      );
      expect(await screen.findByText("1 - Transporteur")).toBeInTheDocument();
      expect(await screen.findByText("2 - Transporteur")).toBeInTheDocument();
      const deleteButtonTransporteur2 =
        screen.getByTestId(`transporter__2__form`);
      fireEvent.click(deleteButtonTransporteur2);
      expect(await screen.findByText("1 - Transporteur")).toBeInTheDocument();
      await expect(() =>
        screen.findByText("2 - Transporteur")
      ).rejects.toThrow();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "up button is disabled for the first transporter when bsdType is %p",
    async bsdType => {
      render(
        component(
          [getInitialTransporter(bsdType), getInitialTransporter(bsdType)],
          bsdType
        )
      );
      const upButtons = screen.getAllByTitle("Remonter");
      expect(upButtons[0]).toBeDisabled();
      expect(upButtons[1]).not.toBeDisabled();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "down button is disabled for the last transporter when bsdType is %p",
    async bsdType => {
      render(
        component(
          [getInitialTransporter(bsdType), getInitialTransporter(bsdType)],
          bsdType
        )
      );
      const upButtons = screen.getAllByTitle("Descendre");
      expect(upButtons[0]).not.toBeDisabled();
      expect(upButtons[1]).toBeDisabled();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "accordions are folded by default when there is several transporters and bsdType is %p",
    bsdType => {
      render(
        component(
          [getInitialTransporter(bsdType), getInitialTransporter(bsdType)],
          bsdType
        )
      );
      const unfoldButtons = screen.getAllByTitle("Déplier");
      expect(unfoldButtons).toHaveLength(2);
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda])(
    "accordion is expanded by default when there is only one transporter and bsdType is %p",
    bsdType => {
      render(component([getInitialTransporter(bsdType)], bsdType));
      const foldButton = screen.getByTitle("Replier");
      expect(foldButton).toBeInTheDocument();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "only one accordion can be expanded at once when bsdType is %p",
    async bsdType => {
      render(
        component(
          [getInitialTransporter(bsdType), getInitialTransporter(bsdType)],
          bsdType
        )
      );
      const expandButtons = screen.getAllByTitle("Déplier");
      expect(expandButtons).toHaveLength(2);
      fireEvent.click(expandButtons[0]);
      fireEvent.click(expandButtons[1]);
      const foldButtons = screen.getAllByTitle("Replier");
      expect(foldButtons).toHaveLength(1);
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "transporter detail is displayed when the transporter has already signed and bsdType is %p",
    bsdType => {
      const transporter1 =
        bsdType === BsdType.Bsdd
          ? getBsddTransporter({ takenOverAt: new Date().toISOString() })
          : getBsdaTransporter({ takenOverAt: new Date().toISOString() });

      render(
        component(
          [
            transporter1,
            getInitialTransporter(bsdType),
            getInitialTransporter(bsdType)
          ],
          bsdType
        )
      );

      expect(screen.getByText("Raison sociale")).toBeInTheDocument();
      expect(screen.getByText(transporter1.company!.name!)).toBeInTheDocument();

      expect(screen.getByText("SIRET")).toBeInTheDocument();
      expect(
        screen.getByText(transporter1.company!.siret!)
      ).toBeInTheDocument();

      expect(screen.getByText("Adresse")).toBeInTheDocument();
      expect(
        screen.getByText(transporter1.company!.address!)
      ).toBeInTheDocument();

      expect(screen.getByText("Contact")).toBeInTheDocument();
      expect(
        screen.getByText(transporter1.company!.contact!)
      ).toBeInTheDocument();

      expect(screen.getAllByText("Téléphone")).toHaveLength(3);
      expect(
        screen.getByText(transporter1.company!.phone!)
      ).toBeInTheDocument();

      expect(screen.getByText("E-mail")).toBeInTheDocument();
      expect(screen.getByText(transporter1.company!.mail!)).toBeInTheDocument();

      expect(screen.getByText("Récépissé n°")).toBeInTheDocument();
      expect(
        screen.getByText(
          bsdType === BsdType.Bsdd
            ? (transporter1 as Transporter).receipt!
            : (transporter1 as BsdaTransporter).recepisse!.number!
        )
      ).toBeInTheDocument();

      expect(screen.getByText("Récépissé département")).toBeInTheDocument();
      expect(
        screen.getByText(
          bsdType === BsdType.Bsdd
            ? (transporter1 as Transporter).department!
            : (transporter1 as BsdaTransporter).recepisse!.department!
        )
      ).toBeInTheDocument();

      expect(screen.getByText("Récépissé valide jusqu'au")).toBeInTheDocument();
      expect(screen.getAllByText("Mode de transport")).toHaveLength(3);
      expect(
        screen.getAllByText("Immatriculation", { exact: false })
      ).toHaveLength(3);
      expect(
        screen.getByText(
          bsdType === BsdType.Bsdd
            ? (transporter1 as Transporter).numberPlate!
            : (transporter1 as BsdaTransporter).transport!.plates![0]
        )
      ).toBeInTheDocument();

      expect(screen.getByText("Date de prise en charge")).toBeInTheDocument();
      const deleteButton1 = screen.getByTestId("transporter__1__form");

      expect(deleteButton1).toBeDisabled();
      const upButtons = screen.getAllByTitle("Remonter");
      expect(upButtons[0]).toBeDisabled();
      // on ne peut pas permuter un transporteur qui a déjà signé
      expect(upButtons[1]).toBeDisabled();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "Add button is disabled when next transporter has already signed and bsdType is %p",
    async bsdType => {
      const transporter1 =
        bsdType === BsdType.Bsdd
          ? getBsddTransporter({ takenOverAt: new Date().toISOString() })
          : getBsdaTransporter({ takenOverAt: new Date().toISOString() });

      const transporter2 =
        bsdType === BsdType.Bsdd
          ? getBsddTransporter({ takenOverAt: new Date().toISOString() })
          : getBsdaTransporter({ takenOverAt: new Date().toISOString() });

      render(component([transporter1, transporter2], bsdType));
      const addButtons = screen.getAllByTitle("Ajouter");
      expect(addButtons[0]).toBeDisabled();
      expect(addButtons[1]).not.toBeDisabled();
    }
  );

  test.each([BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff])(
    "Add button is available when transporters list is empty and bsdType is %p",
    async bsdType => {
      render(component([], bsdType));
      const addButton = screen.getByTitle("Ajouter");
      expect(addButton).toBeInTheDocument();
      fireEvent.click(addButton);
      const transporter1 = await screen.findByText("1 - Transporteur");
      expect(transporter1).toBeInTheDocument();
    }
  );
});

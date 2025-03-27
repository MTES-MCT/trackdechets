import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransporterForm } from "./TransporterForm";
import { Formik } from "formik";
import { MockedProvider } from "@apollo/client/testing";
import {
  BsdType,
  BsdaTransporter,
  BsffTransporter,
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  TransportMode,
  Transporter
} from "@td/codegen-ui";
import { formatDate } from "../../../../common/datetime";
import {
  FAVORITES,
  SEARCH_COMPANIES
} from "../../../common/queries/company/query";

const defaultBsddTransporter: Transporter = {
  id: "clpju9r3c000dljj5gcpkvlgu",
  isExemptedOfReceipt: false,
  company: {
    siret: "38128881000033",
    orgId: "38128881000033",
    vatNumber: null,
    name: "TRANS EXPRESS",
    address: "QUELQUE PART",
    contact: "BG",
    country: "FR",
    mail: "hello+transporteur@trackdechets.fr",
    phone: "00 00 00 00 00"
  },
  receipt: "0101010101",
  department: "13",
  validityLimit: "2023-12-31T23:00:00.000Z",
  mode: TransportMode.Road
};

const defaultTransporter: BsdaTransporter = {
  id: "clpju9r3c000dljj5gcpkvlgu",
  company: {
    siret: "38128881000033",
    orgId: "38128881000033",
    vatNumber: null,
    name: "TRANS EXPRESS",
    address: "QUELQUE PART",
    contact: "BG",
    country: "FR",
    mail: "hello+transporteur@trackdechets.fr",
    phone: "00 00 00 00 00"
  },
  recepisse: {
    number: "0101010101",
    department: "13",
    validityLimit: "2023-12-31T23:00:00.000Z"
  },
  transport: {
    mode: TransportMode.Road,
    plates: []
  }
};

function getDefaultTransporter(bsdType: BsdType) {
  if (bsdType === BsdType.Bsdd) {
    return defaultBsddTransporter;
  }
  return defaultTransporter;
}

const searchCompaniesMock = (
  transporter: Transporter | BsdaTransporter,
  bsdType: BsdType,
  opts: Partial<CompanySearchResult> = {}
) => ({
  request: {
    query: SEARCH_COMPANIES,
    variables: {
      clue: transporter.company?.orgId
    }
  },
  result: () => {
    return {
      data: {
        searchCompanies: [
          {
            __typename: "CompanySearchResult",
            orgId: transporter?.company?.orgId,
            siret: transporter?.company?.siret,
            vatNumber: transporter?.company?.vatNumber,
            name: transporter?.company?.name,
            address: transporter?.company?.address,
            etatAdministratif: "A",
            codePaysEtrangerEtablissement: null,
            isRegistered: true,
            trackdechetsId: "cloo373tc000gljph1c11vtan",
            contact: transporter?.company?.contact,
            contactPhone: transporter?.company?.phone,
            contactEmail: transporter?.company?.mail,
            companyTypes: ["TRANSPORTER"],
            traderReceipt: null,
            brokerReceipt: null,
            transporterReceipt: {
              receiptNumber:
                bsdType === BsdType.Bsdd
                  ? (transporter as Transporter)?.receipt
                  : (transporter as BsdaTransporter | BsffTransporter)
                      ?.recepisse?.number,
              validityLimit:
                bsdType === BsdType.Bsdd
                  ? (transporter as Transporter)?.validityLimit
                  : (transporter as BsdaTransporter | BsffTransporter)
                      ?.recepisse?.validityLimit,
              department:
                bsdType === BsdType.Bsdd
                  ? (transporter as Transporter)?.department
                  : (transporter as BsdaTransporter | BsffTransporter)
                      ?.recepisse?.department
            },
            vhuAgrementDemolisseur: null,
            vhuAgrementBroyeur: null,
            workerCertification: null,
            ...opts
          }
        ]
      }
    };
  }
});

describe("TransporterForm", () => {
  afterEach(jest.resetAllMocks);

  type ComponentProps<T extends Transporter | BsdaTransporter> = {
    bsdType: BsdType;
    data: T;
    mocks?: any;
  };

  const Component = ({ data, mocks, bsdType }: ComponentProps<typeof data>) => (
    <MockedProvider
      mocks={mocks ?? [searchCompaniesMock(data, bsdType)]}
      addTypename={false}
    >
      <Formik initialValues={{ transporter: data }} onSubmit={jest.fn()}>
        <TransporterForm
          fieldName="transporter"
          orgId="88792840600024"
          bsdType={bsdType}
        />
      </Formik>
    </MockedProvider>
  );

  const bsdTypes = [BsdType.Bsdd, BsdType.Bsda, BsdType.Bsff];

  test.each(bsdTypes)("it renders correctly when bsdType is %p", bsdType => {
    const { container } = render(
      Component({ data: getDefaultTransporter(bsdType), bsdType })
    );
    expect(container).toBeTruthy();
    const isExemptedOfReceiptInput = screen.getByText(
      "Le transporteur déclare être exempté de récépissé conformément aux dispositions de l'"
    );
    expect(isExemptedOfReceiptInput).toBeInTheDocument();
    const transportModeInput = screen.getByLabelText("Mode de transport");
    expect(transportModeInput).toBeInTheDocument();
    const plateInput = screen.getByLabelText("Immatriculation", {
      exact: false
    });
    expect(plateInput).toBeInTheDocument();
  });

  test.each(bsdTypes)(
    "transporter recepisse info is displayed when bsdType is %p",
    bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);
      render(Component({ data: defaultTransporter, bsdType }));

      const expectedRecepisseNumber =
        bsdType === BsdType.Bsdd
          ? (defaultTransporter as Transporter).receipt
          : (defaultTransporter as BsdaTransporter).recepisse?.number;

      const expectedRecepisseDepartement =
        bsdType === BsdType.Bsdd
          ? (defaultTransporter as Transporter).department
          : (defaultTransporter as BsdaTransporter).recepisse?.department;

      const expectedRecepisseValidityLimit =
        bsdType === BsdType.Bsdd
          ? (defaultTransporter as Transporter).validityLimit
          : (defaultTransporter as BsdaTransporter).recepisse?.validityLimit;

      expect(
        screen.getByText("Récépissé de déclaration de transport de déchets")
      ).toBeInTheDocument();
      const expected = `Numéro : ${expectedRecepisseNumber}, département : ${expectedRecepisseDepartement}, date limite de validité : ${formatDate(
        expectedRecepisseValidityLimit!
      )}`;
      expect(screen.getByText(expected, { exact: false })).toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "transporter recepisse error is displayed if recepisse is not present and bsdType is %p",
    bsdType => {
      const data =
        bsdType === BsdType.Bsdd
          ? { receipt: null, department: null, validityLimit: null }
          : {
              recepisse: { number: null, department: null, validityLimit: null }
            };

      render(
        Component({
          data: {
            ...getDefaultTransporter(bsdType),
            ...data
          },
          bsdType
        })
      );
      expect(
        screen.getByText("Récépissé de déclaration de transport de déchets")
      ).toBeInTheDocument();
      const expected =
        "L'entreprise de transport n'a pas complété ces informations dans" +
        " son profil Trackdéchets. Nous ne pouvons pas les afficher. Il lui" +
        " appartient de les compléter.";
      expect(screen.getByText(expected, { exact: false })).toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "transporter recepisse error is not displayed if exemption is true and bsdType is %p",
    bsdType => {
      const data =
        bsdType === BsdType.Bsdd
          ? {
              isExemptedOfReceipt: true,
              receipt: null,
              department: null,
              validityLimit: null
            }
          : {
              recepisse: {
                isExempted: true,
                number: null,
                department: null,
                validityLimit: null
              }
            };

      render(
        Component({
          data: {
            ...getDefaultTransporter(bsdType),
            ...data
          },
          bsdType
        })
      );

      expect(
        screen.queryByText("Récépissé de déclaration de transport de déchets")
      ).not.toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "transporter recepisse is not displayed if company is foreign and bsdType is %p",
    bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);
      render(
        Component({
          data: {
            ...defaultTransporter,
            company: {
              ...defaultTransporter.company,
              siret: null,
              orgId: "IT13029381004",
              vatNumber: "IT13029381004"
            }
          },
          bsdType
        })
      );
      expect(
        screen.queryByText("Récépissé de déclaration de transport de déchets")
      ).not.toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "transporter recepisse error is not displayed if transport mode is not road and bsdType is %p",
    bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);

      const data =
        bsdType === BsdType.Bsdd
          ? { mode: TransportMode.Rail }
          : {
              transport: {
                ...(defaultTransporter as BsdaTransporter).transport,
                mode: TransportMode.Rail
              }
            };

      render(
        Component({
          data: {
            ...defaultTransporter,
            ...data
          },
          bsdType
        })
      );

      expect(
        screen.queryByText("Récépissé de déclaration de transport de déchets")
      ).not.toBeInTheDocument();
    }
  );

  test.each([BsdType.Bsda, BsdType.Bsff])(
    "transporter recepisse is updated based on searchCompanies result when bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);
      const data =
        bsdType === BsdType.Bsdd
          ? {
              receipt: "NOUVEAU-RECEPISSE",
              department: "NOUVEAU-DEPARTEMENT",
              validityLimit: "2024-10-11"
            }
          : {
              recepisse: {
                number: "NOUVEAU-RECEPISSE",
                department: "NOUVEAU-DEPARTEMENT",
                validityLimit: "2024-10-11"
              }
            };
      render(
        Component({
          data: defaultTransporter,
          mocks: [
            searchCompaniesMock(
              {
                ...defaultTransporter,
                ...data
              },
              bsdType
            )
          ],
          bsdType
        })
      );
      const expected = `Numéro : NOUVEAU-RECEPISSE, département : NOUVEAU-DEPARTEMENT, date limite de validité : ${formatDate(
        "2024-10-11"
      )}`;

      expect(
        await screen.findByText(expected, { exact: false })
      ).toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "transporter contact info is NOT updated based on searchCompanies result when bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);
      render(
        Component({
          data: defaultTransporter,
          mocks: [
            searchCompaniesMock(
              {
                ...defaultTransporter,
                company: {
                  ...defaultTransporter.company,
                  contact: "NOUVEAU-CONTACT",
                  phone: "NOUVEAU-TELEPHONE",
                  mail: "NOUVEL-EMAIL"
                }
              },
              bsdType
            )
          ],
          bsdType
        })
      );

      await expect(() =>
        screen.findByDisplayValue("NOUVEAU-CONTACT", { exact: false })
      ).rejects.toThrow();
      await expect(() =>
        screen.findByDisplayValue("NOUVEAU-TELEPHONE", { exact: false })
      ).rejects.toThrow();
      await expect(() =>
        screen.findByDisplayValue("NOUVEL-EMAIL", { exact: false })
      ).rejects.toThrow();
    }
  );

  test.each(bsdTypes)(
    "contact info and transporter receipt should be auto-completed when another company is selected and bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);
      const mocks = [
        searchCompaniesMock(defaultTransporter, bsdType),
        {
          request: {
            query: SEARCH_COMPANIES,
            variables: {
              clue: "CODE EN STOCK"
            }
          },
          result: () => {
            return {
              data: {
                searchCompanies: [
                  {
                    __typename: "CompanySearchResult",
                    orgId: "85001946400021",
                    siret: "85001946400021",
                    vatNumber: null,
                    name: "CODE EN STOCK",
                    address: "quelque part",
                    etatAdministratif: "A",
                    codePaysEtrangerEtablissement: null,
                    isRegistered: true,
                    trackdechetsId: "clpibhy5y0002lj9ar30nilpl",
                    contact: "NOUVEAU-CONTACT",
                    contactPhone: "NOUVEAU-TELEPHONE",
                    contactEmail: "NOUVEAU-EMAIL",
                    companyTypes: ["PRODUCER"],
                    traderReceipt: null,
                    brokerReceipt: null,
                    transporterReceipt: {
                      receiptNumber: "NOUVEAU-RECEPISSE",
                      validityLimit: "2024-10-11",
                      department: "NOUVEAU-DEPARTEMENT"
                    },
                    vhuAgrementDemolisseur: null,
                    vhuAgrementBroyeur: null,
                    workerCertification: null
                  }
                ]
              }
            };
          }
        },
        {
          request: {
            query: FAVORITES(FavoriteType.Transporter),
            variables: {
              orgId: "88792840600024",
              type: "TRANSPORTER",
              allowForeignCompanies: true
            }
          },
          result: () => ({
            data: { favorites: [] }
          })
        }
      ];
      render(
        Component({
          data: defaultTransporter,
          mocks,
          bsdType
        })
      );
      const searchInput = screen.getByLabelText("N°SIRET ou raison sociale", {
        exact: false
      });

      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: "CODE EN STOCK" } });

      const searchResult = await screen.findByText("85001946400021", {});
      expect(searchResult).toBeInTheDocument();

      fireEvent.click(searchResult);

      const newRecepisse = await screen.findByText(
        `Numéro : NOUVEAU-RECEPISSE, département : NOUVEAU-DEPARTEMENT, date limite de validité : ${formatDate(
          "2024-10-11"
        )}`,
        { exact: false }
      );

      expect(newRecepisse).toBeInTheDocument();

      expect(
        await screen.findByDisplayValue("NOUVEAU-CONTACT", { exact: false })
      ).toBeInTheDocument();
      expect(
        await screen.findByDisplayValue("NOUVEAU-TELEPHONE", { exact: false })
      ).toBeInTheDocument();
      expect(
        await screen.findByDisplayValue("NOUVEAU-EMAIL", { exact: false })
      ).toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "exemption of recepisse should be disabled when transporter is foreign and bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);

      const foreignTransporter = {
        ...defaultTransporter,
        company: {
          ...defaultTransporter.company,
          orgId: "IT13029381004",
          siret: null,
          vatNumber: "IT13029381004"
        }
      };
      render(
        Component({
          data: foreignTransporter,
          mocks: [searchCompaniesMock(foreignTransporter, bsdType)],
          bsdType
        })
      );
      const exemptionInput = screen.getByLabelText(
        "Le transporteur déclare être exempté de récépissé conformément aux dispositions de l'",
        { exact: false }
      );
      expect(exemptionInput).toBeDisabled();
    }
  );

  test.each(bsdTypes)(
    "an error message should be displayed if company is not registered in Trackdéchets and bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);

      render(
        Component({
          data: defaultTransporter,
          mocks: [
            searchCompaniesMock(defaultTransporter, bsdType, {
              isRegistered: false
            })
          ],
          bsdType
        })
      );

      const notRegisteredError = await screen.findByText(
        "Cet établissement n'est pas inscrit sur Trackdéchets."
      );

      expect(notRegisteredError).toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "an error message should be displayed if company has not the TRANSPORTER profile and bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);

      render(
        Component({
          data: defaultTransporter,
          mocks: [
            searchCompaniesMock(defaultTransporter, bsdType, {
              companyTypes: [CompanyType.Producer]
            })
          ],
          bsdType
        })
      );

      const notRegisteredWithTransporterProfile = await screen.findByText(
        "Cet établissement n'a pas le profil Transporteur. Si vous transportez vos propres déchets, veuillez cocher la case d'exemption."
      );

      expect(notRegisteredWithTransporterProfile).toBeInTheDocument();
    }
  );

  test.each(bsdTypes)(
    "no error message should be displayed if company has not the TRANSPORTER profile but exemption is active and bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);

      const data = {
        ...defaultTransporter,
        ...(bsdType === BsdType.Bsdd
          ? { isExemptedOfReceipt: true }
          : {
              recepisse: {
                ...(defaultTransporter as BsdaTransporter).recepisse,
                isExempted: true
              }
            })
      };

      render(
        Component({
          data,
          mocks: [
            searchCompaniesMock(defaultTransporter, bsdType, {
              companyTypes: [CompanyType.Producer]
            })
          ],
          bsdType
        })
      );

      await expect(() =>
        screen.findByText(
          "Cet établissement n'a pas le profil Transporteur. Si vous transportez vos propres déchets, veuillez cocher la case d'exemption."
        )
      ).rejects.toThrow();
    }
  );

  test.each(bsdTypes)(
    "favorites should be displayed when we focus the search bar and bsdType is %p",
    async bsdType => {
      const defaultTransporter = getDefaultTransporter(bsdType);

      const mocks = [
        searchCompaniesMock(defaultTransporter, bsdType),
        {
          request: {
            query: FAVORITES(FavoriteType.Transporter),
            variables: {
              orgId: "88792840600024",
              type: "TRANSPORTER",
              allowForeignCompanies: true
            }
          },
          result: () => ({
            data: {
              favorites: [
                {
                  __typename: "CompanySearchResult",
                  orgId: "85001946400021",
                  siret: "85001946400021",
                  vatNumber: null,
                  name: "CODE EN STOCK",
                  address: "adresse",
                  etatAdministratif: "A",
                  codePaysEtrangerEtablissement: null,
                  isRegistered: true,
                  trackdechetsId: "clpibhy5y0002lj9ar30nilpl",
                  contact: "BG",
                  contactPhone: "00 00 00 00 00",
                  contactEmail: "hello+detenteur@benoitguigal.fr",
                  companyTypes: ["TRANSPORTER"],
                  transporterReceipt: null,
                  traderReceipt: null,
                  brokerReceipt: null,
                  vhuAgrementDemolisseur: null,
                  vhuAgrementBroyeur: null,
                  workerCertification: null
                }
              ]
            }
          })
        }
      ];
      render(
        Component({
          data: defaultTransporter,
          mocks,
          bsdType
        })
      );
      const searchInput = screen.getByLabelText("N°SIRET ou raison sociale", {
        exact: false
      });

      fireEvent.focus(searchInput);
      const favorite = await screen.findByText("CODE EN STOCK", {
        exact: false
      });
      expect(favorite).toBeInTheDocument();
    }
  );
});

import React, { ReactNode } from "react";
import { CompanyType, FavoriteType, TraderInput } from "@td/codegen-ui";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { getInitialCompany } from "../../../common/data/initialState";
import CompanySelectorWrapper, {
  selectedCompanyError
} from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import Recepisse from "../../../Dashboard/Components/Recepisse/Recepisse";

type FormikTraderProps = {
  // N°SIRET de l'établissement courant
  siret?: string;
  disabled?: boolean;
  // Set les données vers le store Formik ou Rhf en fonctionde l'implémentation
  setTrader: (trader: TraderInput | null) => void;
  // Valeur en lecture de l'état du formulaire (obtenue via Formik ou Rhf)
  trader: TraderInput | null;
  // Portion de formulaire permettant de renseigner les infos de contact
  // de l'établissement. À adapter en fonction de l'implémentation (Formik ou Rhf)
  companyContactInfo: ReactNode;
  // Permet d'afficher ou non le switch "Présence d'un négociant"
  // Utile sur les révisions où il n'est pas possible de supprimer
  // un négociant existant.
  showSwitch?: boolean;
};

const Trader = ({
  siret,
  disabled = false,
  trader,
  setTrader,
  companyContactInfo,
  showSwitch = true
}: FormikTraderProps) => {
  const hasTrader = !!trader;

  return (
    <>
      {showSwitch && (
        <ToggleSwitch
          label="Présence d'un négociant"
          checked={hasTrader}
          showCheckedHint={false}
          onChange={hasTrader => {
            if (!hasTrader) {
              setTrader(null);
            } else {
              setTrader({
                receipt: null,
                department: null,
                validityLimit: null,
                company: getInitialCompany()
              });
            }
          }}
          disabled={disabled}
        />
      )}
      {hasTrader && (
        <div className="fr-mt-2w">
          <CompanySelectorWrapper
            orgId={siret}
            selectedCompanyOrgId={trader?.company?.siret ?? null}
            favoriteType={FavoriteType.Trader}
            selectedCompanyError={company => {
              if (company) {
                return selectedCompanyError(company, CompanyType.Trader);
              }
              return null;
            }}
            disabled={disabled}
            onCompanySelected={company => {
              if (company) {
                setTrader({
                  ...trader,
                  company: {
                    ...trader?.company,
                    siret: company?.siret,
                    address: company.address,
                    name: company.name,
                    ...(trader?.company?.siret !== company.siret
                      ? {
                          // auto-completion des infos de contact uniquement
                          // s'il y a un changement d'établissement pour
                          // éviter d'écraser les infos de contact spécifiées par l'utilisateur
                          // lors d'une modification de bordereau
                          contact: company.contact ?? "",
                          phone: company.contactPhone ?? "",
                          mail: company.contactEmail ?? ""
                        }
                      : {})
                  },
                  receipt: company.traderReceipt?.receiptNumber,
                  department: company.traderReceipt?.department,
                  validityLimit: company.traderReceipt?.validityLimit ?? null
                });
              }
            }}
          />
          {companyContactInfo}
          {trader?.receipt && (
            <Recepisse
              title="Récépissé de négoce"
              numero={trader?.receipt}
              departement={trader?.department}
              validityLimit={trader?.validityLimit}
            />
          )}
        </div>
      )}
    </>
  );
};

export default Trader;

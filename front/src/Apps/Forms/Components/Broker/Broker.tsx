import React, { ReactNode } from "react";
import { CompanyType, FavoriteType } from "@td/codegen-ui";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { getInitialCompany } from "../../../common/data/initialState";
import CompanySelectorWrapper, {
  selectedCompanyError
} from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import Recepisse from "../../../Dashboard/Components/Recepisse/Recepisse";
import { CommonBrokerInput } from "./types";

type FormikBrokerProps = {
  // N°SIRET de l'établissement courant
  siret?: string;
  disabled?: boolean;
  // Set les données vers le store Formik ou Rhf en fonctionde l'implémentation
  setBroker: (broker: CommonBrokerInput | null) => void;
  // Valeur en lecture de l'état du formulaire (obtenue via Formik ou Rhf)
  broker: CommonBrokerInput | null;
  // Portion de formulaire permettant de renseigner les infos de contact
  // de l'établissement. À adapter en fonction de l'implémentation (Formik ou Rhf)
  companyContactInfo: ReactNode;
  // Permet d'afficher ou non le switch "Présence d'un courtier"
  // Utile sur les révisions où il n'est pas possible de supprimer
  // un courtier existant.
  showSwitch?: boolean;
};

const Broker = ({
  siret,
  disabled = false,
  broker,
  setBroker,
  companyContactInfo,
  showSwitch = true
}: FormikBrokerProps) => {
  const hasBroker = !!broker;

  return (
    <>
      {showSwitch && (
        <ToggleSwitch
          label="Présence d'un courtier"
          checked={hasBroker}
          showCheckedHint={false}
          onChange={hasBroker => {
            if (!hasBroker) {
              setBroker(null);
            } else {
              setBroker({
                recepisse: null,
                company: getInitialCompany()
              });
            }
          }}
          disabled={disabled}
        />
      )}
      {hasBroker && (
        <div className="fr-mt-2w">
          <CompanySelectorWrapper
            orgId={siret}
            selectedCompanyOrgId={broker?.company?.siret ?? null}
            favoriteType={FavoriteType.Broker}
            selectedCompanyError={company => {
              if (company) {
                return selectedCompanyError(company, CompanyType.Broker);
              }
              return null;
            }}
            disabled={disabled}
            onCompanySelected={company => {
              if (company) {
                setBroker({
                  ...broker,
                  company: {
                    ...broker?.company,
                    siret: company?.siret,
                    address: company.address,
                    name: company.name,
                    ...(broker?.company?.siret !== company.siret
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
                  recepisse: {
                    number: company.brokerReceipt?.receiptNumber,
                    department: company.brokerReceipt?.department,
                    validityLimit: company.brokerReceipt?.validityLimit ?? null
                  }
                });
              }
            }}
          />
          {companyContactInfo}
          {broker?.recepisse?.number && (
            <Recepisse
              title="Récépissé de courtage"
              numero={broker?.recepisse?.number}
              departement={broker?.recepisse?.department}
              validityLimit={broker?.recepisse?.validityLimit}
            />
          )}
        </div>
      )}
    </>
  );
};

export default Broker;

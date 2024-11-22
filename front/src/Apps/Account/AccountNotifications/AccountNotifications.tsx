import React from "react";
import { Table } from "@codegouvfr/react-dsfr/Table";
import CompanyDisplay from "./CompanyDisplay";
import { NotificationsDisplay } from "./NotificationsDisplay";
import NotificationsUpdateButton from "./NotificationsUpdateButton";
import SearchableCompaniesList from "../../Companies/CompaniesList/SearchableCompaniesList";
import styles from "./AccountNotifications.module.scss";
import NotificationsUpdateAllButton from "./NotificationsUpdateAllButton";
import gql from "graphql-tag";
import { User } from "@td/codegen-ui";

type AccountNotificationsProps = {
  me: Pick<User, "email">;
};

const fragment = gql`
  fragment CompanyPrivateFragment on CompanyPrivate {
    id
    name
    orgId
    userRole
    userNotifications {
      membershipRequest
      signatureCodeRenewal
      bsdRefusal
      bsdaFinalDestinationUpdate
      revisionRequest
      registryDelegation
    }
    users {
      id
      orgId
      email
      notifications {
        membershipRequest
        signatureCodeRenewal
        bsdRefusal
        bsdaFinalDestinationUpdate
        revisionRequest
        registryDelegation
      }
    }
  }
`;

/**
 * Ce composant permet l'affichage de la liste des établissements
 * de l'utilisateur et des notifications actives sur chaque établissement.
 * Pour chaque établissement un bouton permet d'ouvrir une modale afin de modifier
 * les préfèrences de notifications de l'utilisateur au sein de cet établissement.
 */
export default function AccountNotifications({
  me
}: AccountNotificationsProps) {
  return (
    // Liste paginée des établissements avec un bouton "Charger plus"
    // et une barre de recherche
    <SearchableCompaniesList
      fragment={fragment}
      renderCompanies={(companies, totalCount) => (
        <Table
          fixed
          data={companies.map(company => [
            <CompanyDisplay company={company} />,
            <NotificationsDisplay company={company} />,
            <div className={styles.alignRight}>
              <NotificationsUpdateButton company={company} me={me} />
            </div>
          ])}
          headers={[
            "Établissements",
            "Notifications actives",
            // affiche le bouton de gestion en masse à partir de 5 établissement
            totalCount >= 5 && (
              <div className={styles.alignRight}>
                <NotificationsUpdateAllButton totalCount={totalCount} />
              </div>
            )
          ]}
        />
      )}
    />
  );
}

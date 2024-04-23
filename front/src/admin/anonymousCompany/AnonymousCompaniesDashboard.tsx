import React from "react";
import styles from "./AnonymousCompany.module.scss";
import { CreateAnonymousCompanyForm } from "./CreateAnonymousCompanyForm";

export const AnonymousCompanyDashboard = () => {
  return (
    <div className={styles.h100}>
      <div className={`fr-container--fluid ${styles.h100}`}>
        <div className={`fr-grid-row fr-grid-row--gutters ${styles.h100}`}>
          <div className="fr-col-12 fr-col-lg-6">
            <CreateAnonymousCompanyForm />
          </div>
        </div>
      </div>
    </div>
  );
};

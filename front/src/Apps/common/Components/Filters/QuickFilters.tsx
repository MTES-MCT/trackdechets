import React from "react";
import QuickFilter from "./QuickFilter";

import "./quickFilters.scss";

const QuickFilters = () => {
  return (
    <div className={"fr-container-fluid fr-mb-2w quickFilters"}>
      <div className={"fr-grid-row  fr-grid-row--gutters"}>
        <div className={"fr-col-12 fr-col-sm-6 fr-col-md"}>
          <QuickFilter label="N° de BSD / contenant" />
        </div>
        <div className={"fr-col-12 fr-col-sm-6 fr-col-md"}>
          <QuickFilter label="N° de déchet / nom usuel" />
        </div>
        <div className={"fr-col-12 fr-col-sm-6 fr-col-md"}>
          <QuickFilter label="Raison sociale / SIRET" />
        </div>
        <div className={"fr-col-12 fr-col-sm-6 fr-col-md"}>
          <QuickFilter label="Numéro de CAP" />
        </div>
        <div className={"fr-col-12 fr-col-sm-6 fr-col-md"}>
          <QuickFilter label="Nom de chantier" />
        </div>
      </div>
    </div>
  );
};

export default QuickFilters;

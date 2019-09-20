import React from "react";

export default function CompanyDisclaimer() {
  return (
    <div className="columns">
      <div className="notification" style={{ width: "100%" }}>
        Une information vous semble erronée,{" "}
        <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
          faites nous le savoir
        </a>
      </div>
    </div>
  );
}

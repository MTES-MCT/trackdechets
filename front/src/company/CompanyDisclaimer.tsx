import React from "react";
import { CONTACT_EMAIL } from "common/config";
export default function CompanyDisclaimer() {
  return (
    <div className="columns">
      <div className="notification" style={{ width: "100%" }}>
        Une information vous semble erronée,{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="link">
          faites nous le savoir
        </a>
      </div>
    </div>
  );
}

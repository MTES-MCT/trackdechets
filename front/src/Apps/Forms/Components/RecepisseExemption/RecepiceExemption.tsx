import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import React from "react";

const RecepisseExemption = ({ disabled, checked, onChange }) => {
  return (
    <div className="fr-pt-2w fr-pb-2w">
      <h4 className="fr-h4">
        Exemption de récépissé de déclaration de transport de déchets
      </h4>
      <ToggleSwitch
        disabled={disabled}
        label={
          <div>
            Le transporteur déclare être exempté de récépissé conformément aux
            dispositions de l'
            <a
              className="fr-link"
              target="_blank"
              rel="noreferrer"
              href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046669839"
            >
              article R.541-50 du code de l'environnement
            </a>
          </div>
        }
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
};

export default RecepisseExemption;

import Input from "@codegouvfr/react-dsfr/Input";
import { BSDD_SAMPLE_NUMBER_WASTE_CODES } from "@td/constants";
import React from "react";
import { useFormContext } from "react-hook-form";
import { getPackagingInfosSummary } from "../../../../../common/utils/packagingsBsddSummary";
import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";
import NonScrollableInput from "../../../../../common/Components/NonScrollableInput/NonScrollableInput";
import RhfPackagingList from "../../../../../Forms/Components/PackagingList/RhfPackagingList";
import { bsddPackagingTypes } from "../../../../../Forms/Components/PackagingList/helpers";

const Appendix1ProducerRequestRevision = ({
  bsdd,
  areModificationsDisabled,
  initialBsddReview
}) => {
  const { register, getValues } = useFormContext();

  const wasteQuantityValue = getValues("wasteDetails.quantity");
  return (
    <div
      style={{
        display: areModificationsDisabled ? "none" : "inline"
      }}
    >
      <hr />

      <RhfReviewableField
        title="Conditionnement"
        path="wasteDetails.packagingInfos"
        value={
          bsdd.wasteDetails?.packagingInfos
            ? getPackagingInfosSummary(bsdd.wasteDetails.packagingInfos)
            : ""
        }
        defaultValue={initialBsddReview.wasteDetails.packagingInfos}
        initialValue={bsdd.wasteDetails?.packagingInfos}
      >
        <RhfPackagingList
          fieldName="wasteDetails.packagingInfos"
          packagingTypes={bsddPackagingTypes}
        />
      </RhfReviewableField>

      {bsdd.wasteDetails?.code &&
        BSDD_SAMPLE_NUMBER_WASTE_CODES.includes(bsdd.wasteDetails.code) && (
          <RhfReviewableField
            title="Numéro d'échantillon"
            path="wasteDetails.sampleNumber"
            value={bsdd.wasteDetails?.sampleNumber}
            defaultValue={initialBsddReview.wasteDetails.sampleNumber}
          >
            <Input
              label="Numéro d'échantillon"
              className="fr-col-3"
              nativeInputProps={{
                ...register("wasteDetails.sampleNumber")
              }}
            />
          </RhfReviewableField>
        )}

      <RhfReviewableField
        title="Poids estimé"
        path="wasteDetails.quantity"
        value={bsdd.wasteDetails?.quantity}
        defaultValue={initialBsddReview.wasteDetails.quantity}
      >
        <NonScrollableInput
          label="Poids en tonnes"
          className="fr-col-2"
          nativeInputProps={{
            ...register("wasteDetails.quantity", { valueAsNumber: true }),
            type: "number",
            inputMode: "decimal",
            step: "0.000001"
          }}
        />
        {Boolean(wasteQuantityValue) && (
          <p className="fr-info-text">{`Soit ${
            wasteQuantityValue * 1000
          } kg`}</p>
        )}
      </RhfReviewableField>
    </div>
  );
};

export default Appendix1ProducerRequestRevision;

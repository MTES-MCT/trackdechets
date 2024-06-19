import Input from "@codegouvfr/react-dsfr/Input";
import { BSDD_SAMPLE_NUMBER_WASTE_CODES } from "@td/constants";
import React from "react";
import { useFormContext } from "react-hook-form";
import { getPackagingInfosSummary } from "../../../../../common/utils/packagingsBsddSummary";
import { BsdTypename } from "../../../../../common/types/bsdTypes";
import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";
import { BsdPackagings } from "../../common/Components/Packagings/RhfPackagings";
import { disableAddPackagingCta } from "../../common/utils/rules";

const Appendix1ProducerRequestRevision = ({
  bsdd,
  areModificationsDisabled,
  initialBsddReview
}) => {
  const { register, getValues } = useFormContext();

  const packagingInfoValues = getValues("wasteDetails.packagingInfos");
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
        <BsdPackagings
          path="wasteDetails.packagingInfos"
          bsdType={BsdTypename.Bsdd}
          disabledAddCta={disableAddPackagingCta(packagingInfoValues)}
        />
      </RhfReviewableField>

      {bsdd.wasteDetails?.code &&
        BSDD_SAMPLE_NUMBER_WASTE_CODES.includes(bsdd.wasteDetails.code) && (
          <RhfReviewableField
            title="Numéro d'achantillon"
            path="wasteDetails.sampleNumber"
            value={bsdd.wasteDetails?.sampleNumber}
            defaultValue={initialBsddReview.wasteDetails.sampleNumber}
          >
            <Input
              label="Numéro d'achantillon"
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
        <Input
          label="Poids en tonnes"
          className="fr-col-2"
          nativeInputProps={{
            ...register("wasteDetails.quantity", { valueAsNumber: true }),
            type: "number"
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

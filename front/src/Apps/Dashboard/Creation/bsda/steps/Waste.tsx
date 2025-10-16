import React, { useContext } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";

const WasteBsda = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, setError, clearErrors } =
    useFormContext();

  const waste = watch("waste", {});
  const sealedFields = useContext(SealedFieldsContext);
  const bsdaType = watch("type");

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10">
        <WasteRadioGroup
          title="Déchet"
          disabled={sealedFields.includes("wasteCode")}
          options={[
            {
              label:
                "16 01 06 - véhicules hors d'usage ne contenant ni liquides ni autres composants dangereux",
              nativeInputProps: {
                ...register("wasteCode"),
                value: "16 01 06"
              }
            },
            {
              label:
                "16 01 04* - véhicules hors d'usage non dépollués par un centre agréé",
              nativeInputProps: {
                ...register("wasteCode"),
                value: "16 01 04*"
              }
            }
          ]}
        />
      </div>
    </>
  );
};

export default WasteBsda;

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import { BsdDisplay } from "../../../common/types/bsdTypes";
import TagsInput from "../../../Forms/Components/TagsInput/TagsInput";

import "./transporterInfoEditForm.scss";

interface TransporterInfoEditFormProps {
  bsd: BsdDisplay;
  onClose: () => void;
  onSubmitForm: (data) => Promise<void>;
}
type TransporterFormInputs = {
  customInfo: string;
  plates: string[];
};

const TransporterInfoEditForm = ({
  bsd,
  onClose,
  onSubmitForm
}: TransporterInfoEditFormProps) => {
  const formatInitialPlates = () => {
    const transporterNumberPlate = bsd?.transporterNumberPlate;

    if (typeof transporterNumberPlate === "string") {
      const regex = /,+|,\s+/;
      const containsComma = regex.test(transporterNumberPlate);
      if (containsComma) {
        return transporterNumberPlate?.split(regex);
      } else {
        if (transporterNumberPlate) {
          return [transporterNumberPlate];
        }
        return [];
      }
    }
    return transporterNumberPlate ? transporterNumberPlate : [];
  };
  const initialPlates = formatInitialPlates();
  const [platesTags, setPlatestags] = useState<string[]>(initialPlates);
  const defaultValues = {
    customInfo: bsd?.transporterCustomInfo as string,
    plates: initialPlates
  };
  const { register, handleSubmit, reset, formState, setValue } =
    useForm<TransporterFormInputs>({
      defaultValues
    });

  const handlePlatesDirtyState = plates => {
    const shouldDirty = initialPlates.toString() !== plates.toString();
    setValue("plates", plates, {
      shouldDirty
    });
  };

  const handleAddPlate = plateTagValue => {
    if (plateTagValue && !platesTags.includes(plateTagValue)) {
      setPlatestags([...platesTags, plateTagValue]);
    }

    const inputElemHidden = document.getElementById(
      "inputPlateHidden"
    ) as HTMLInputElement;
    if (inputElemHidden) {
      const valArray = [...platesTags, plateTagValue];
      inputElemHidden.value = valArray.join();
      inputElemHidden.focus(); // force focus to register value
      handlePlatesDirtyState(valArray);
    }
  };

  const resetAndClose = () => {
    setPlatestags(initialPlates);
    reset({ ...defaultValues });
    onClose();
  };

  const onSubmit: SubmitHandler<TransporterFormInputs> = async data => {
    await onSubmitForm(data);
    resetAndClose();
  };
  const dismissTag = plateTagIdx => {
    const newPlates = platesTags.filter(p => p !== platesTags[plateTagIdx]);
    setPlatestags(newPlates);
    const inputElemHidden = document.getElementById(
      "inputPlateHidden"
    ) as HTMLInputElement;
    inputElemHidden.value = newPlates.join();
    inputElemHidden.focus(); // force focus to register value
    handlePlatesDirtyState(newPlates);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="transporterInfoEditForm">
      <h2 className="transporterInfoEditForm__title">Modifier</h2>

      <Input
        label="Champ libre"
        nativeInputProps={{
          ...register("customInfo")
        }}
      />

      <div className="transporterInfoEditForm__plates">
        <TagsInput
          label="Immatriculations"
          onAddTag={handleAddPlate}
          onDeleteTag={dismissTag}
          tags={platesTags}
        />
        {/* hidden tag field registered */}
        <input
          id="inputPlateHidden"
          {...register("plates")}
          className="sr-only"
          aria-hidden
        />
      </div>

      <div className="transporterInfoEditForm__cta">
        <Button
          priority="secondary"
          nativeButtonProps={{ type: "button" }}
          onClick={resetAndClose}
        >
          Annuler
        </Button>
        <Button
          nativeButtonProps={{ type: "submit" }}
          disabled={!formState.isDirty}
        >
          Modifier
        </Button>
      </div>
    </form>
  );
};

export default React.memo(TransporterInfoEditForm);

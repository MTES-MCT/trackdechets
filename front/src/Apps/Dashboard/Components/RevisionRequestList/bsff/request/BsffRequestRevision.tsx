import { useMutation } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bsff,
  BsdType,
  Mutation,
  MutationCreateBsffRevisionRequestArgs
} from "@td/codegen-ui";
import React, { useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { removeEmptyKeys } from "../../../../../../common/helper";
import { Loader } from "../../../../../common/Components";
import { CREATE_BSFF_REVISION_REQUEST } from "../../../../../common/queries/reviews/BsffReviewQuery";
import { resetPackagingIfUnchanged } from "../../common/Components/Packagings/packagings";
import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";
import {
  initialBsffReview,
  validationBsffSchema
} from "../../common/utils/schema";
import styles from "./BsffRequestRevision.module.scss";
import { TITLE_REQUEST_LIST } from "../../../Revision/wordingsRevision";
import { BsffRequestRevisionCancelationInput } from "../BsdaRequestRevisionCancelationInput";
type Props = {
  bsff: Bsff;
};

export function BsffRequestRevision({ bsff }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();
  const [createBsffRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createBsffRevisionRequest">,
    MutationCreateBsffRevisionRequestArgs
  >(CREATE_BSFF_REVISION_REQUEST);
  const [sealNumbersTags, setSealNumbersTags] = useState<string[]>([]);

  type ValidationSchema = z.infer<typeof validationBsffSchema>;

  const methods = useForm<ValidationSchema>({
    mode: "onTouched",
    defaultValues: initialBsffReview,
    resolver: zodResolver(validationBsffSchema)
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = methods;

  const resetAndClose = () => {
    reset();
    navigate(-1);
  };

  // Hacky fonction implémentée en hotfix dans tra-15573
  // La bonne solution à mon sens (benoît) serait d'initialiser
  // le formulaire de révision avec les valeurs du BSFF
  // puis de n'envoyer que les champs "dirty" dans onSubmit
  const resetPopIfUnchanged = (data: Pick<ValidationSchema, "waste">) => {
    const pop = data?.waste?.pop;
    if (pop !== null && pop !== undefined && pop === bsff?.waste?.pop) {
      // aucun changement n'a eu lieu sur le champ pop
      // on le réinitialise à la valeur par défaut du formulaire
      data.waste.pop = null;
    }
    return data;
  };

  const checkIfInitialObjectValueChanged = data => {
    let newData = resetPopIfUnchanged(data);
    newData = resetPackagingIfUnchanged(
      data,
      bsff.packagings,
      data.packagings,
      () => delete data.packagings
    );
    return newData;
  };

  const onSubmitForm = async (data: ValidationSchema) => {
    const { comment, ...content } = data;
    const cleanedContent = removeEmptyKeys(
      checkIfInitialObjectValueChanged(content)
    );
    await createBsffRevisionRequest({
      variables: {
        input: {
          bsffId: bsff.id,
          content: cleanedContent ?? {},
          comment,
          authoringCompanySiret: siret!
        }
      }
    });
  };

  const onSubmit: SubmitHandler<ValidationSchema> = async data => {
    await onSubmitForm(data);
    resetAndClose();
  };

  // live form values
  const formValues = watch();

  const areModificationsDisabled = formValues.isCanceled;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {TITLE_REQUEST_LIST} {bsff.id}
      </h2>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.fields}>
            <BsffRequestRevisionCancelationInput
              bsff={bsff}
              onChange={value => setValue("isCanceled", value)}
            />

            <div
              style={{
                display: areModificationsDisabled ? "none" : "inline"
              }}
            >
              <RhfReviewableField
                title="CAP"
                value={bsff.destination?.cap}
                path="destination.cap"
                defaultValue={initialBsffReview.destination.cap}
              >
                <Input
                  label="Nouveau CAP (optionnel pour les déchets non dangereux)"
                  className="fr-col-8"
                  nativeInputProps={{
                    ...register("destination.cap")
                  }}
                />
              </RhfReviewableField>
            </div>

            {!areModificationsDisabled && <hr />}

            <Input
              textArea
              label="Commentaire à propos de la révision"
              state={errors?.comment && "error"}
              stateRelatedMessage={(errors?.comment?.message as string) ?? ""}
              nativeTextAreaProps={{
                ...register("comment")
              }}
            />

            {error && (
              <div className="notification notification--warning">
                {error.message}
              </div>
            )}

            <div className={styles.cta}>
              <Button
                priority="secondary"
                nativeButtonProps={{ type: "button" }}
                onClick={resetAndClose}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || loading || isSubmitting}
              >
                Demander
              </Button>
              {(loading || isSubmitting) && <Loader />}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

import React from "react";
import { CompanyPrivate } from "@td/codegen-ui";
import { FieldError, useForm } from "react-hook-form";
import { Modal } from "../../../common/components";
import CompanySelectorWrapper from "../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isSiret } from "@td/constants";
import { datetimeToYYYYMMDD } from "../../Dashboard/Validation/BSPaoh/paohUtils";
import { startOfDay } from "date-fns";

const displayError = (error: FieldError | undefined) => {
  return error ? <>{error.message}</> : null;
};

const getSchema = () =>
  z
    .object({
      delegateOrgId: z.string().refine(val => {
        const ok = isSiret(val);
        console.log("ok", ok);
        return ok;
      }),
      startDate: z.coerce
        .date({
          required_error: "La date de début est requise",
          invalid_type_error: "La date de début est invalide"
        })
        .min(startOfDay(new Date()), {
          message: "La date de début ne peut pas être dans le passé"
        })
        .transform(val => val.toISOString())
        .nullish(),
      endDate: z.coerce
        .date({
          invalid_type_error: "La date de fin est invalide"
        })
        .min(new Date(), {
          message: "La date de fin ne peut pas être dans le passé"
        })
        .transform(val => {
          if (val) return val.toISOString();
          return val;
        })
        .nullish()
        .optional(),
      comment: z.string().max(500).optional()
    })
    .refine(
      data => {
        const { startDate, endDate } = data;

        console.log(">> REFINE!!!");
        console.log("startDate", startDate);
        console.log("endDate", endDate);

        if (startDate && endDate) {
          return new Date(startDate) < new Date(endDate);
        }

        return true;
      },
      {
        path: ["startDate"],
        message: "La date de début doit être avant la date de fin."
      }
    );

interface Props {
  company: CompanyPrivate;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRndtsDeclarationDelegationModal = ({
  company,
  onClose,
  isOpen
}: Props) => {
  const onSubmit = async obj => {
    console.log("onSubmit!");
    console.log("obj", obj);
    // await signBspaoh({
    //   variables: {
    //     id: bspaoh.id,
    //     input: {
    //       ...sign,
    //       type: BspaohSignatureType.Emission
    //     }
    //   }
    // });
    onClose();
  };

  const validationSchema = getSchema();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    defaultValues: {
      startDate: datetimeToYYYYMMDD(new Date()),
      endDate: undefined,
      delegateOrgId: undefined,
      comment: undefined
    },
    resolver: zodResolver(validationSchema)
  });

  console.log("errors", errors);

  const delegateOrgId = watch("delegateOrgId") ?? {};
  console.log("delegateOrgId", delegateOrgId);

  return (
    <Modal
      onClose={onClose}
      ariaLabel="Créer une délégation"
      isOpen={isOpen}
      size="L"
    >
      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h4> Créer une délégation</h4>

          <CompanySelectorWrapper
            orgId={company.orgId}
            disabled={isSubmitting}
            selectedCompanyOrgId={delegateOrgId}
            selectedCompanyError={() => errors?.delegateOrgId?.message ?? null}
            onCompanySelected={company => {
              if (company) {
                setValue("delegateOrgId", company.orgId);
              }
            }}
          />

          <div className="fr-container--fluid fr-mb-8v">
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
              <div className="fr-col-6">
                <Input
                  label="Date de début"
                  state={errors?.startDate && "error"}
                  stateRelatedMessage={displayError(errors?.startDate)}
                  disabled={isSubmitting}
                  nativeInputProps={{
                    type: "date",
                    min: datetimeToYYYYMMDD(new Date()),
                    ...register("startDate")
                  }}
                />
              </div>
              <div className="fr-col-6">
                <Input
                  label="Date de fin (optionnelle)"
                  hintText="Illimité s'il n'y a pas de date renseignée"
                  state={errors?.endDate && "error"}
                  stateRelatedMessage={displayError(errors?.endDate)}
                  disabled={isSubmitting}
                  nativeInputProps={{
                    type: "date",
                    max: datetimeToYYYYMMDD(new Date("2050-12-31")),
                    ...register("endDate")
                  }}
                />
              </div>
            </div>
          </div>

          <Input
            label="Objet"
            state={errors?.comment && "error"}
            stateRelatedMessage={displayError(errors?.comment)}
            disabled={isSubmitting}
            nativeInputProps={{
              ...register("comment")
            }}
          />

          <div className="dsfr-modal-actions fr-mt-3w">
            <Button
              disabled={isSubmitting}
              priority="secondary"
              onClick={onClose}
              type="button"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Créer
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

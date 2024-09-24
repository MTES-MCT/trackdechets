import React from "react";
import {
  CompanyPrivate,
  Mutation,
  MutationCreateRndtsDeclarationDelegationArgs
} from "@td/codegen-ui";
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
import { useMutation } from "@apollo/client";
import {
  CREATE_RNDTS_DECLARATION_DELEGATION,
  RNDTS_DECLARATION_DELEGATIONS
} from "../../common/queries/rndtsDeclarationDelegation/queries";
import toast from "react-hot-toast";

const displayError = (error: FieldError | undefined) => {
  return error ? <>{error.message}</> : null;
};

const getSchema = () =>
  z
    .object({
      delegateOrgId: z
        .string({ required_error: "Ce champ est requis" })
        .refine(isSiret, "Siret non valide"),
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
      // Date & "" hack: https://github.com/colinhacks/zod/issues/1721
      endDate: z.preprocess(
        arg => (arg === "" ? null : arg),
        z.coerce
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
      ),
      comment: z.string().max(500).optional()
    })
    .refine(
      data => {
        const { startDate, endDate } = data;

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
  const [createRndtsDeclarationDelegation, { loading }] = useMutation<
    Pick<Mutation, "createRndtsDeclarationDelegation">,
    MutationCreateRndtsDeclarationDelegationArgs
  >(CREATE_RNDTS_DECLARATION_DELEGATION, {
    refetchQueries: [RNDTS_DECLARATION_DELEGATIONS]
  });

  const validationSchema = getSchema();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    defaultValues: {
      startDate: datetimeToYYYYMMDD(new Date())
    },
    resolver: zodResolver(validationSchema)
  });

  const onSubmit = async input => {
    await createRndtsDeclarationDelegation({
      variables: {
        input: {
          ...input,
          delegatorOrgId: company.orgId
        }
      },
      onCompleted: () => toast.success("Délégation créée!"),
      onError: err => toast.error(err.message)
    });

    // Reset the form
    reset();

    onClose();
  };

  const delegateOrgId = watch("delegateOrgId") ?? {};

  const isLoading = loading || isSubmitting;

  return (
    <Modal
      onClose={onClose}
      ariaLabel="Créer une délégation"
      isOpen={isOpen}
      size="L"
    >
      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h4>Créer une délégation</h4>

          <CompanySelectorWrapper
            orgId={company.orgId}
            disabled={isLoading}
            selectedCompanyOrgId={delegateOrgId}
            selectedCompanyError={selectedCompany => {
              if (selectedCompany?.orgId === company.orgId) {
                return "Le délégant et le délégataire doivent être différents";
              }
              if (!selectedCompany?.siret) {
                return "L'entreprise doit avoir un n° de SIRET";
              }
              return null;
            }}
            onCompanySelected={company => {
              if (company) {
                setValue("delegateOrgId", company.orgId);
              }
            }}
          />
          {errors.delegateOrgId && (
            <span className="fr-error-text">
              {errors.delegateOrgId.message}
            </span>
          )}

          <div className="fr-container--fluid fr-mb-8v">
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
              <div className="fr-col-6">
                <Input
                  label="Date de début"
                  state={errors?.startDate && "error"}
                  stateRelatedMessage={displayError(errors?.startDate)}
                  disabled={isLoading}
                  nativeInputProps={{
                    type: "date",
                    min: datetimeToYYYYMMDD(new Date()),
                    max: datetimeToYYYYMMDD(new Date("2050-12-31")),
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
                  disabled={isLoading}
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
            disabled={isLoading}
            nativeInputProps={{
              ...register("comment")
            }}
          />

          <div className="dsfr-modal-actions fr-mt-3w">
            <Button
              disabled={isLoading}
              priority="secondary"
              onClick={onClose}
              type="button"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              Créer
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

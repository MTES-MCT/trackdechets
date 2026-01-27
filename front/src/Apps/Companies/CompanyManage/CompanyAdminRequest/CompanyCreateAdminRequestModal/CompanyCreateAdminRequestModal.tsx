import React, { useState } from "react";
import TdModal from "../../../../common/Components/Modal/Modal";
import { CompanyCreateAdminRequestModalStep1 } from "./CompanyCreateAdminRequestModalStep1";
import { CompanyCreateAdminRequestModalStep2 } from "./CompanyCreateAdminRequestModalStep2";
import { CompanyCreateAdminRequestModalStep3 } from "./CompanyCreateAdminRequestModalStep3";
import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import {
  Mutation,
  MutationCreateAdminRequestArgs,
  AdminRequestValidationMethod
} from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import {
  ADMIN_REQUESTS,
  CREATE_ADMIN_REQUEST
} from "../../../../common/queries/adminRequest/adminRequest";
import toast from "react-hot-toast";

const steps = [
  {
    title: "Établissement concerné",
    component: CompanyCreateAdminRequestModalStep1
  },
  {
    title: "Validation au sein de l'établissement",
    component: CompanyCreateAdminRequestModalStep2
  },
  {
    title: "Confirmer la demande",
    component: CompanyCreateAdminRequestModalStep3
  }
];

interface CompanyCreateAdminRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateAdminRequestFormInputs {
  companyName: string | null;
  companyOrgId: string | null;
  validationMethod: AdminRequestValidationMethod | null;
  collaboratorEmail: string | null;
}

export const CompanyCreateAdminRequestModal = ({
  isOpen,
  onClose
}: CompanyCreateAdminRequestModalProps) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const methods = useForm<CreateAdminRequestFormInputs>({
    defaultValues: {
      companyName: null,
      companyOrgId: null,
      validationMethod: null
    }
  });

  const [createAdminRequest, { loading, error, reset }] = useMutation<
    Pick<Mutation, "createAdminRequest">,
    MutationCreateAdminRequestArgs
  >(CREATE_ADMIN_REQUEST, {
    refetchQueries: [ADMIN_REQUESTS]
  });

  const companyOrgId = methods.watch("companyOrgId");
  const validationMethod = methods.watch("validationMethod");
  const collaboratorEmail = methods.watch("collaboratorEmail");

  const onSubmit: SubmitHandler<CreateAdminRequestFormInputs> = async () => {
    await createAdminRequest({
      variables: {
        input: {
          companyOrgId,
          validationMethod,
          collaboratorEmail
        }
      },
      onCompleted: () => {
        toast.success("Demande envoyée!");
        closeAndReset();
      }
    });
  };

  const closeAndReset = () => {
    setCurrentStepIdx(0);
    methods.reset();
    onClose();
  };

  const StepComponent = steps[currentStepIdx].component;

  return (
    <TdModal
      onClose={closeAndReset}
      title="Demander les droits administrateur"
      ariaLabel="Demander les droits administrateur"
      isOpen={isOpen}
      size="L"
    >
      <div>
        <Stepper
          currentStep={currentStepIdx + 1}
          nextTitle={steps[currentStepIdx + 1]?.title}
          stepCount={steps.length}
          title={steps[currentStepIdx].title}
        />
      </div>

      <FormProvider {...methods}>
        <StepComponent
          onClickNext={() => setCurrentStepIdx(currentStepIdx + 1)}
          onClickPrevious={() => {
            setCurrentStepIdx(currentStepIdx - 1);
            reset();
          }}
          onSubmit={onSubmit}
          onCancel={closeAndReset}
          loading={loading}
          error={error?.message}
        />
      </FormProvider>
    </TdModal>
  );
};

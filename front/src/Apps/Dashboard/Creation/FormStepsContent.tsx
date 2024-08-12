import React, { useState } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toastApolloError } from "./toaster";

import { SealedFieldsContext } from "./context";
import FormStepsTabs from "../../Forms/Components/FormStepsTabs/FormStepsTabs";
import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import { TabsName, getNextTab, getPrevTab, tabs } from "./utils";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Loader } from "../../common/Components";
import { Waste } from "./steps/Waste";
import { Emitter } from "./steps/Emitter";
import { Transporter } from "./steps/Transporter";
import { Destination } from "./steps/Destination";

interface FormStepsContentProps {
  tabList?: {
    tabId: string;
    label: React.ReactNode;
    iconId: FrIconClassName | RiIconClassName;
  }[];
  sealedFields: string[];
  isLoading: boolean;
  useformMethods: UseFormReturn<any>;
  saveForm: Function;
  draftCtaLabel: string;
  mainCtaLabel: string;
}
const FormStepsContent = ({
  tabList = tabs,
  sealedFields,
  isLoading,
  useformMethods,
  draftCtaLabel,
  mainCtaLabel,
  saveForm
}: FormStepsContentProps) => {
  const [selectedTabId, setSelectedTabId] = useState<TabsName>("waste");
  const navigate = useNavigate();
  const tabIds = tabList.map(tab => tab.tabId);
  const lastTabId = tabIds[tabIds.length - 1];
  const firstTabId = tabIds[0];

  const onSubmit = (data, e) => {
    const draft = e.nativeEvent.submitter.id === "id_save_draft";
    const { id, ...input } = data;

    saveForm(input, draft)
      .then(_ => {
        navigate(-1);
      })
      .catch(err => toastApolloError(err));
  };

  const onTabChange = tabId => {
    setSelectedTabId(tabId);
  };

  const tabsContent = {
    waste: <Waste />,
    emitter: <Emitter />,
    transporter: <Transporter />,
    destination: <Destination />
  };

  const errors = useformMethods?.formState?.errors;
  const formHasErrors = Object.keys(errors)?.length > 0;

  return (
    <>
      <SealedFieldsContext.Provider value={sealedFields}>
        <FormProvider {...useformMethods}>
          {!isLoading && (
            <FormStepsTabs
              tabList={tabList}
              draftCtaLabel={draftCtaLabel}
              mainCtaLabel={mainCtaLabel}
              selectedTabId={selectedTabId}
              isPrevStepDisabled={selectedTabId === firstTabId}
              isNextStepDisabled={selectedTabId === lastTabId}
              isSaveDisabled={
                mainCtaLabel !== "Publier" && selectedTabId !== lastTabId
              }
              onSubmit={useformMethods.handleSubmit((data, e) =>
                onSubmit(data, e)
              )}
              onCancel={() => navigate(-1)}
              onPrevTab={() =>
                setSelectedTabId(getPrevTab(tabIds, selectedTabId))
              }
              onNextTab={() =>
                setSelectedTabId(getNextTab(tabIds, selectedTabId))
              }
              onTabChange={onTabChange}
            >
              {tabsContent[selectedTabId] ?? <p></p>}
              {formHasErrors && (
                <Alert
                  severity="error"
                  title="Erreur"
                  className="fr-mt-5v"
                  description="Le formulaire comporte des erreurs"
                />
              )}
            </FormStepsTabs>
          )}
        </FormProvider>
      </SealedFieldsContext.Provider>
      {isLoading && <Loader />}
    </>
  );
};

export default FormStepsContent;

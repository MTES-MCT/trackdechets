import React, { useState } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FormStepsTabs from "../../Forms/Components/FormStepsTabs/FormStepsTabs";
import { Loader } from "../../common/Components";
import { SealedFieldsContext } from "./context";
import {
  NormalizedError,
  SupportedBsdTypes,
  TabError,
  TabId,
  getNextTab,
  getPrevTab,
  getTabs,
  handleGraphQlError
} from "./utils";

interface FormStepsContentProps {
  bsdType: SupportedBsdTypes;
  sealedFields?: string[];
  isLoading: boolean;
  useformMethods: UseFormReturn<any>;
  saveForm: Function;
  draftCtaLabel: string;
  mainCtaLabel: string;
  tabsContent: {
    waste: React.JSX.Element;
    emitter: React.JSX.Element;
    transporter: React.JSX.Element;
    destination: React.JSX.Element;
  };
  setPublishErrors: (normalizedErrors: NormalizedError[]) => void;
  errorTabIds?: TabId[];
  genericErrorMessage?: TabError[];
}
const FormStepsContent = ({
  bsdType,
  tabsContent,
  sealedFields = [],
  isLoading,
  useformMethods,
  draftCtaLabel,
  mainCtaLabel,
  saveForm,
  setPublishErrors,
  errorTabIds,
  genericErrorMessage
}: FormStepsContentProps) => {
  const [selectedTabId, setSelectedTabId] = useState<TabId>(TabId.waste);
  const navigate = useNavigate();
  const tabList = getTabs(bsdType, errorTabIds).filter(
    tab => tabsContent[tab.tabId]
  );
  const tabIds = tabList.map(tab => tab.tabId);
  const lastTabId = tabIds[tabIds.length - 1];
  const firstTabId = tabIds[0];

  const scrollToTop = () => {
    const element = document.getElementsByClassName("fr-modal__body")[0];
    if (element) {
      element.scroll({ top: 0 });
    }
  };

  const onSubmit = (data, e) => {
    const draft = e.nativeEvent.submitter.id === "id_save_draft";
    const { id, ...input } = data;
    saveForm(input, draft)
      .then(_ => {
        navigate(-1);
      })
      .catch(err => {
        handleGraphQlError(err, setPublishErrors);
        scrollToTop();
      });
  };

  const onErrors = error => {
    console.log(error);
    scrollToTop();
  };

  const onTabChange = tabId => {
    setSelectedTabId(tabId);
    scrollToTop();
  };

  return (
    <>
      <SealedFieldsContext.Provider value={sealedFields}>
        <FormProvider {...useformMethods}>
          {!isLoading && (
            <FormStepsTabs
              //@ts-ignore
              tabList={tabList}
              draftCtaLabel={draftCtaLabel}
              mainCtaLabel={mainCtaLabel}
              selectedTabId={selectedTabId}
              isPrevStepDisabled={selectedTabId === firstTabId}
              isNextStepDisabled={selectedTabId === lastTabId}
              onSubmit={useformMethods.handleSubmit(
                (data, e) => onSubmit(data, e),
                error => onErrors(error)
              )}
              onCancel={() => navigate(-1)}
              onPrevTab={() => {
                setSelectedTabId(getPrevTab(tabIds, selectedTabId));
                scrollToTop();
              }}
              onNextTab={() => {
                setSelectedTabId(getNextTab(tabIds, selectedTabId));
                scrollToTop();
              }}
              onTabChange={onTabChange}
              genericErrorMessage={genericErrorMessage}
            >
              {tabsContent[selectedTabId] ?? <p></p>}
            </FormStepsTabs>
          )}
        </FormProvider>
      </SealedFieldsContext.Provider>
      {isLoading && <Loader />}
    </>
  );
};

export default FormStepsContent;

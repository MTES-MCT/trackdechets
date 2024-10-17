import React, { useState } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FormStepsTabs from "../../Forms/Components/FormStepsTabs/FormStepsTabs";
import { Loader } from "../../common/Components";
import { SealedFieldsContext } from "./context";
import {
  TabsName,
  getNextTab,
  getPrevTab,
  getTabs,
  handleGraphQlError
} from "./utils";

interface FormStepsContentProps {
  isCrematorium?: boolean;
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
  setPublishErrors: Function;
  errorTabIds?: string[] | (TabsName | undefined)[];
}
const FormStepsContent = ({
  isCrematorium = false,
  tabsContent,
  sealedFields = [],
  isLoading,
  useformMethods,
  draftCtaLabel,
  mainCtaLabel,
  saveForm,
  setPublishErrors,
  errorTabIds
}: FormStepsContentProps) => {
  const [selectedTabId, setSelectedTabId] = useState<TabsName>("waste");
  const navigate = useNavigate();
  const tabList = getTabs(isCrematorium, errorTabIds);
  const tabIds = tabList.map(tab => tab.tabId);
  const lastTabId = tabIds[tabIds.length - 1];
  const firstTabId = tabIds[0];

  const scrollToTop = () => {
    const element = document.getElementById("formStepsTabsContent");
    if (element) {
      element.scroll({ top: 0, behavior: "smooth" });
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
  const onErrors = () => {
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
                () => onErrors()
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

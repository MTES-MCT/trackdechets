import React, { useRef, useState } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import FormStepsTabs from "../../Forms/Components/FormStepsTabs/FormStepsTabs";
import { Loader } from "../../common/Components";
import { SealedFieldsContext } from "./context";
import {
  NormalizedError,
  SupportedBsdTypes,
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
  errorTabIds
}: FormStepsContentProps) => {
  const [selectedTabId, setSelectedTabId] = useState<TabId>(TabId.Waste);
  const navigate = useNavigate();
  const tabList = getTabs(bsdType, errorTabIds);
  const tabIds = tabList.map(tab => tab.tabId);
  const lastTabId = tabIds[tabIds.length - 1];
  const firstTabId = tabIds[0];
  const ref = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    const element = ref.current;
    if (element) {
      const scrollPos = element.scrollHeight - window.innerHeight;
      if (scrollPos > 0) {
        ref.current?.scrollIntoView({ behavior: "instant", block: "start" });
      }
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
  };

  return (
    <>
      <SealedFieldsContext.Provider value={sealedFields}>
        <FormProvider {...useformMethods}>
          {!isLoading && (
            <div ref={ref}>
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
                onPrevTab={() =>
                  setSelectedTabId(getPrevTab(tabIds, selectedTabId))
                }
                onNextTab={() =>
                  setSelectedTabId(getNextTab(tabIds, selectedTabId))
                }
                onTabChange={onTabChange}
              >
                {tabsContent[selectedTabId] ?? <p></p>}
              </FormStepsTabs>
            </div>
          )}
        </FormProvider>
      </SealedFieldsContext.Provider>
      {isLoading && <Loader />}
    </>
  );
};

export default FormStepsContent;

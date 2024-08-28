import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React, { useEffect } from "react";
import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import "./formStepsTabs.scss";

interface Props {
  selectedTabId: string;
  tabList: {
    tabId: string;
    label: React.ReactNode;
    iconId: FrIconClassName | RiIconClassName;
  }[];
  onTabChange: (tabId) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  isPrevStepDisabled: boolean;
  isNextStepDisabled: boolean;
  isSaveDisabled: boolean;
  draftCtaLabel: string;
  mainCtaLabel: string;
  children: React.ReactNode;
}
const FormStepsTabs = ({
  selectedTabId,
  tabList,
  isPrevStepDisabled,
  isNextStepDisabled,
  isSaveDisabled,
  onTabChange,
  onSubmit,
  onNextTab,
  onPrevTab,
  onCancel,
  draftCtaLabel,
  mainCtaLabel,
  children
}: Readonly<Props>) => {
  useEffect(() => {
    // dsfr Tabs hack to add a type button on tabs to avoid submitting a form on tab change
    const tabsButtonElems = document
      .getElementById("formStepsTabs")
      ?.querySelectorAll("[class^='fr-tabs__tab']");

    tabsButtonElems?.forEach(button => {
      button.setAttribute("type", "button");
    });
  }, []);

  return (
    <form id="formStepsTabs" className="formSteps" onSubmit={onSubmit}>
      <Tabs
        selectedTabId={selectedTabId}
        tabs={tabList}
        onTabChange={onTabChange}
      >
        <div className="formSteps__tabs">{children} </div>
      </Tabs>
      <div className="formSteps__actions">
        <div className="formSteps__actions__cta-group">
          <Button
            onClick={onPrevTab}
            priority="tertiary"
            disabled={isPrevStepDisabled}
            type="button"
          >
            Précédent
          </Button>

          <Button
            onClick={onNextTab}
            priority="tertiary"
            disabled={isNextStepDisabled}
            type="button"
          >
            Suivant
          </Button>
        </div>

        <div className="formSteps__actions__cta-group">
          <Button priority="secondary" type="button" onClick={onCancel}>
            Annuler
          </Button>

          {draftCtaLabel && (
            <Button
              priority="secondary"
              id="id_save_draft"
              nativeButtonProps={{ "data-testid": "draftBtn" }}
            >
              {draftCtaLabel}
            </Button>
          )}

          <Button id="id_save" priority="primary" disabled={isSaveDisabled}>
            {mainCtaLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default React.memo(FormStepsTabs);

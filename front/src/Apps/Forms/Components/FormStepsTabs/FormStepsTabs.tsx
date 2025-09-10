import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React, { useEffect, useRef } from "react";
import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import "./formStepsTabs.scss";
import { TabError } from "../../../Dashboard/Creation/utils";
import Alert from "@codegouvfr/react-dsfr/Alert";

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
  draftCtaLabel: string;
  mainCtaLabel: string;
  children: React.ReactNode;
  genericErrorMessage?: TabError[];
}
const FormStepsTabs = ({
  selectedTabId,
  tabList,
  isPrevStepDisabled,
  isNextStepDisabled,
  onTabChange,
  onSubmit,
  onNextTab,
  onPrevTab,
  onCancel,
  draftCtaLabel,
  mainCtaLabel,
  children,
  genericErrorMessage
}: Readonly<Props>) => {
  const ref = useRef<HTMLDivElement | undefined>();
  useEffect(() => {
    // dsfr Tabs hack to add a type button on tabs to avoid submitting a form on tab change
    const tabsButtonElems = document
      .getElementById("formStepsTabs")
      ?.querySelectorAll("[class^='fr-tabs__tab']");

    tabsButtonElems?.forEach(button => {
      button.setAttribute("type", "button");
    });
  }, []);

  useEffect(() => {
    if (ref.current && genericErrorMessage?.[0]?.message) {
      ref.current.focus();
    }
  }, [genericErrorMessage?.[0]?.message]);

  return (
    <form id="formStepsTabs" className="formSteps" onSubmit={onSubmit}>
      <Tabs
        selectedTabId={selectedTabId}
        tabs={tabList}
        onTabChange={onTabChange}
      >
        <div
          className={
            !!genericErrorMessage?.[0]?.message
              ? "formSteps__tabs formSteps__tabs--height"
              : "formSteps__tabs"
          }
        >
          {children}
        </div>
      </Tabs>
      <br />

      {!!genericErrorMessage?.[0]?.message && (
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          tabIndex={-1}
          className="formSteps__error"
        >
          <Alert
            description={genericErrorMessage?.[0]?.message}
            severity="error"
            title=""
          />
        </div>
      )}

      <div className="formSteps__footer">
        <div>
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

        <div>
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

          <Button id="id_save" priority="primary">
            {mainCtaLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default React.memo(FormStepsTabs);

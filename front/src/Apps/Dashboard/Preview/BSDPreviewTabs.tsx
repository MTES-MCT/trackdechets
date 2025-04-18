import React, { useState } from "react";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import { useNavigate } from "react-router-dom";

const getNextTab = (tabIds: string[], currentTabId: string) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === tabIds.length) {
    return currentTabId;
  }
  return tabIds[idx + 1];
};

const getPrevTab = (tabIds: string[], currentTabId: string) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === 0) {
    return currentTabId;
  }
  return tabIds[idx - 1];
};

interface Props {
  tabsList: {
    tabId: string;
    label: React.ReactNode;
    iconId: FrIconClassName | RiIconClassName;
  }[];
  tabsContent: object;
  onDownloadPdf: () => void;
}
const BSDPreviewTabs = ({
  tabsList,
  tabsContent,
  onDownloadPdf
}: Readonly<Props>) => {
  const navigate = useNavigate();

  const tabIds = tabsList.map(tab => tab.tabId);
  const lastTabId = tabIds[tabIds.length - 1];
  const firstTabId = tabIds[0];

  const [selectedTabId, setSelectedTabId] = useState(firstTabId);

  const isPrevStepDisabled = selectedTabId === firstTabId;
  const isNextStepDisabled = selectedTabId === lastTabId;

  const scrollToTop = () => {
    const element = document.getElementsByClassName("fr-modal__body")[0];
    if (element) {
      element.scroll({ top: 0 });
    }
  };

  const onTabChange = tabId => {
    setSelectedTabId(tabId);
    scrollToTop();
  };

  return (
    <>
      <Tabs
        selectedTabId={selectedTabId}
        tabs={tabsList}
        onTabChange={onTabChange}
      >
        {tabsContent[selectedTabId] ?? <p></p>}
      </Tabs>

      <div
        className="fr-modal__footer"
        style={{
          padding: "2rem 0",
          marginTop: "0"
        }}
      >
        <div className="fr-btns-group fr-btns-group--inline">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap"
            }}
          >
            <div>
              <Button
                onClick={() => {
                  setSelectedTabId(getPrevTab(tabIds, selectedTabId));
                  scrollToTop();
                }}
                priority="tertiary"
                disabled={isPrevStepDisabled}
                type="button"
              >
                Précédent
              </Button>

              <Button
                onClick={() => {
                  setSelectedTabId(getNextTab(tabIds, selectedTabId));
                  scrollToTop();
                }}
                priority="tertiary"
                disabled={isNextStepDisabled}
                type="button"
              >
                Suivant
              </Button>
            </div>

            <div>
              <Button
                priority="secondary"
                type="button"
                onClick={() => onDownloadPdf()}
              >
                PDF
              </Button>

              <Button
                id="id_close"
                priority="primary"
                onClick={() => navigate(-1)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(BSDPreviewTabs);

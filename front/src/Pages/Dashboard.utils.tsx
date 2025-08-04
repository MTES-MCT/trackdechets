import React from "react";
import { IconDuplicateFile } from "../Apps/common/Components/Icons/Icons";
import {
  blankstate_action_desc,
  blankstate_action_title,
  blankstate_default_desc,
  blankstate_default_title,
  blankstate_draft_desc,
  blankstate_draft_title,
  blankstate_follow_desc,
  blankstate_follow_title,
  blankstate_history_desc,
  blankstate_history_title,
  blankstate_return_desc,
  blankstate_return_title,
  blankstate_reviews_desc,
  blankstate_reviews_title
} from "../Apps/common/wordings/dashboard/wordingsDashboard";
import { BsdWhere, OrderType, QueryBsdsArgs } from "@td/codegen-ui";
import { filterList, filterPredicates } from "../Apps/Dashboard/dashboardUtils";
import { BsdCurrentTab } from "../Apps/common/types/commonTypes";

export const getRoutePredicate = (
  bsdCurrentTab: BsdCurrentTab,
  siret: string
) => {
  const isActTab = bsdCurrentTab === "actTab";
  const isDraftTab = bsdCurrentTab === "draftTab";
  const isFollowTab = bsdCurrentTab === "followTab";
  const isArchivesTab = bsdCurrentTab === "archivesTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";
  const isCollectedTab = bsdCurrentTab === "collectedTab";
  const isAllBsdsTab = bsdCurrentTab === "allBsdsTab";
  const isPendingRevisionForTab = bsdCurrentTab === "pendingRevisionForTab";
  const isEmittedRevisionForTab = bsdCurrentTab === "emittedRevisionForTab";
  const isReceivedRevisionForTab = bsdCurrentTab === "receivedRevisionForTab";
  const isReviewedRevisionForTab = bsdCurrentTab === "reviewedRevisionForTab";
  const isReturnTab = bsdCurrentTab === "returnTab";

  if (isActTab) {
    return {
      isForActionFor: [siret]
    };
  }
  if (isDraftTab) {
    return {
      isDraftFor: [siret]
    };
  }
  if (isFollowTab) {
    return {
      isFollowFor: [siret]
    };
  }
  if (isArchivesTab) {
    return {
      isArchivedFor: [siret]
    };
  }
  if (isToCollectTab) {
    return {
      isToCollectFor: [siret]
    };
  }
  if (isCollectedTab) {
    return {
      isCollectedFor: [siret]
    };
  }
  if (isAllBsdsTab) {
    return {
      isDraftFor: [siret],
      isForActionFor: [siret],
      isFollowFor: [siret],
      isArchivedFor: [siret]
    };
  }
  if (isPendingRevisionForTab) {
    return {
      isPendingRevisionFor: [siret]
    };
  }
  if (isEmittedRevisionForTab) {
    return {
      isEmittedRevisionFor: [siret]
    };
  }
  if (isReceivedRevisionForTab) {
    return {
      isReceivedRevisionFor: [siret]
    };
  }
  if (isReviewedRevisionForTab) {
    return {
      isReviewedRevisionFor: [siret]
    };
  }
  if (isReturnTab) {
    return {
      isReturnFor: [siret]
    };
  }
};

export const getBlankslateTitle = (
  bsdCurrentTab: BsdCurrentTab
): string | undefined => {
  const isActTab = bsdCurrentTab === "actTab";
  const isDraftTab = bsdCurrentTab === "draftTab";
  const isFollowTab = bsdCurrentTab === "followTab";
  const isArchivesTab = bsdCurrentTab === "archivesTab";
  const isPendingRevisionForTab = bsdCurrentTab === "pendingRevisionForTab";
  const isEmittedRevisionForTab = bsdCurrentTab === "emittedRevisionForTab";
  const isReceivedRevisionForTab = bsdCurrentTab === "receivedRevisionForTab";
  const isReviewedRevisionForTab = bsdCurrentTab === "reviewedRevisionForTab";
  const isReturnTab = bsdCurrentTab === "returnTab";

  if (isActTab) {
    return blankstate_action_title;
  }
  if (isDraftTab) {
    return blankstate_draft_title;
  }
  if (isFollowTab) {
    return blankstate_follow_title;
  }
  if (isArchivesTab) {
    return blankstate_history_title;
  }
  if (
    isPendingRevisionForTab ||
    isEmittedRevisionForTab ||
    isReceivedRevisionForTab ||
    isReviewedRevisionForTab
  ) {
    return blankstate_reviews_title;
  }
  if (isReturnTab) {
    return blankstate_return_title;
  }
  return blankstate_default_title;
};

export const getBlankslateDescription = (bsdCurrentTab: BsdCurrentTab) => {
  const isActTab = bsdCurrentTab === "actTab";
  const isDraftTab = bsdCurrentTab === "draftTab";
  const isFollowTab = bsdCurrentTab === "followTab";
  const isArchivesTab = bsdCurrentTab === "archivesTab";
  const isPendingRevisionForTab = bsdCurrentTab === "pendingRevisionForTab";
  const isEmittedRevisionForTab = bsdCurrentTab === "emittedRevisionForTab";
  const isReceivedRevisionForTab = bsdCurrentTab === "receivedRevisionForTab";
  const isReviewedRevisionForTab = bsdCurrentTab === "reviewedRevisionForTab";
  const isReturnTab = bsdCurrentTab === "returnTab";

  if (isActTab) {
    return blankstate_action_desc;
  }
  if (isDraftTab) {
    return (
      <>
        <span>{blankstate_draft_desc}</span>{" "}
        <span className="tw-inline-flex tw-ml-1">
          <IconDuplicateFile color="blueLight" />
        </span>
      </>
    );
  }
  if (isFollowTab) {
    return blankstate_follow_desc;
  }
  if (isArchivesTab) {
    return blankstate_history_desc;
  }
  if (
    isPendingRevisionForTab ||
    isEmittedRevisionForTab ||
    isReceivedRevisionForTab ||
    isReviewedRevisionForTab
  ) {
    return blankstate_reviews_desc;
  }
  if (isReturnTab) {
    return blankstate_return_desc;
  }
  return blankstate_default_desc;
};

export const filtersToQueryBsdsArgs = (filterValues, previousBsdsArgs) => {
  const variables: QueryBsdsArgs = {
    ...previousBsdsArgs,
    where: {} as BsdWhere,
    orderBy: {}
  };

  const filterKeys = Object.keys(filterValues);
  const filters = filterList.filter(filter => filterKeys.includes(filter.name));

  // Group all filters in a '_and'
  const _ands: BsdWhere[] = [];
  filters.forEach(f => {
    const predicate = filterPredicates.find(
      filterPredicate => filterPredicate.filterName === f.name
    );
    if (predicate) {
      const filterValue = filterValues[f.name];
      const where = predicate.where(filterValue);

      _ands.push(where);

      if (predicate.orderBy) {
        variables.orderBy![predicate.orderBy] = OrderType.Asc;
      }
    }
  });

  // Add the filters
  if (_ands.length) variables.where!._and = [..._ands];

  return variables;
};

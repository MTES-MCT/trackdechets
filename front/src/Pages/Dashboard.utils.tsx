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
  blankstate_reviews_desc,
  blankstate_reviews_title
} from "../Apps/common/wordings/dashboard/wordingsDashboard";
import { BsdWhere, OrderType, QueryBsdsArgs } from "../generated/graphql/types";
import { filterList, filterPredicates } from "../Apps/Dashboard/dashboardUtils";

export type Tabs = {
  isActTab;
  isDraftTab;
  isFollowTab;
  isArchivesTab;
  isToCollectTab;
  isCollectedTab;
  isAllBsdsTab;
  isReviewsTab;
};

export const getRoutePredicate = (props: Tabs & { siret }) => {
  const {
    siret,
    isActTab,
    isDraftTab,
    isFollowTab,
    isArchivesTab,
    isToCollectTab,
    isCollectedTab,
    isAllBsdsTab
  } = props;

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
  // if (isReviewsTab) {
  //   return {
  //     isRevisedFor: [siret],
  //     isInRevisionFor: [siret],
  //   };
  // }
  // if (isToReviewedTab) {
  //   return {
  //     isInRevisionFor: [siret],
  //   };
  // }
  // if (isReviewedTab) {
  //   return {
  //     isRevisedFor: [siret],
  //   };
  // }
};

export const getBlankstateTitle = (tabs: Tabs): string | undefined => {
  const { isActTab, isDraftTab, isFollowTab, isArchivesTab, isReviewsTab } =
    tabs;

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
  if (isReviewsTab) {
    return blankstate_reviews_title;
  }
  return blankstate_default_title;
};

export const getBlankstateDescription = ({
  isActTab,
  isDraftTab,
  isFollowTab,
  isArchivesTab,
  isReviewsTab
}) => {
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
  if (isReviewsTab) {
    return blankstate_reviews_desc;
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

  // Careful. Multiple filters might use '_and', let's not override
  // it each iteration because of key uniqueness
  let _ands: BsdWhere[] = [];

  filters.forEach(f => {
    const predicate = filterPredicates.find(
      filterPredicate => filterPredicate.filterName === f.name
    );
    if (predicate) {
      const filterValue = filterValues[f.name];
      const { _and, ...wheres } = predicate.where(filterValue);

      // Store the '_and' filters separately
      if (_and) _ands = [..._ands, ..._and];

      variables.where = {
        ...variables.where,
        ...wheres
      };

      if (predicate.orderBy) {
        variables.orderBy![predicate.orderBy] = OrderType.Asc;
      }
    }
  });

  // Add all the compiled '_and', if any
  if (_ands.length) variables.where!._and = _ands;

  return variables;
};

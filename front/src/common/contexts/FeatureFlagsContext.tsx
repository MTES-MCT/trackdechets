import React, { useContext, useState } from "react";

interface InterfaceFlags {
  dashboardV2?: boolean;
}

interface InterfaceFeatureFlags {
  children: React.ReactNode;
  defaultFeatureFlags: InterfaceFlags;
}

type FeatureFlagsContextType = {
  featureFlags: InterfaceFlags;
  updateFeatureFlags: (newFeatureFlags: InterfaceFlags) => void;
};

const FeatureFlagsContext = React.createContext<FeatureFlagsContextType | null>(
  null
);

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext) as FeatureFlagsContextType;
}

export function FeatureFlagsProvider({
  children,
  defaultFeatureFlags,
}: InterfaceFeatureFlags) {
  const [featureFlags, setFeatureFlags] =
    useState<InterfaceFlags>(defaultFeatureFlags);

  function updateFeatureFlags(newFeatureFlags: InterfaceFlags) {
    setFeatureFlags(newFeatureFlags);
  }

  return (
    <FeatureFlagsContext.Provider value={{ featureFlags, updateFeatureFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

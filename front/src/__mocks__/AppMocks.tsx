import * as React from "react";
import { SiretContext } from "../dashboard/Dashboard";

interface AppMocksProps {
  siret: string;
  children: React.ReactNode;
}

export function AppMocks({ siret, children }: AppMocksProps) {
  return (
    <SiretContext.Provider value={{ siret }}>{children}</SiretContext.Provider>
  );
}

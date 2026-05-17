"use client";

import { createContext, type ReactNode, useContext } from "react";

import { siteConfig } from "../siteConfig";
import type { RuntimeSiteConfig } from "../lib/contentSource";

const RuntimeConfigContext = createContext<RuntimeSiteConfig>(siteConfig as RuntimeSiteConfig);

export function RuntimeConfigProvider({
  config,
  children,
}: {
  config: RuntimeSiteConfig;
  children: ReactNode;
}) {
  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeSiteConfig() {
  return useContext(RuntimeConfigContext);
}

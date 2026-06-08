import { useTranslationsStore } from "@/lib/i18n/store";
import LoadingScreen from "@/views/loading/LoadingScreen";
import React from "react";

interface Props {
  children?: React.ReactNode;
}

export function I18nBoundary(props: Props) {
  const { isI18nextInitialized } = useTranslationsStore();
  if (!isI18nextInitialized) {
    return <LoadingScreen />;
  } else {
    return <>{props.children}</>;
  }
}

import { useState } from "react";

import PageContainer from "@/components/common/PageContainer";
import Hero from "./Hero";
import Welcome from "./Welcome";
import WhatsNew from "./WhatsNew";

export default function HomeView() {
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  return (
    <PageContainer noMargin>
      <Hero />
      {showWhatsNew ? (
        <WhatsNew onGoBackClick={() => setShowWhatsNew(false)} />
      ) : (
        <Welcome onWhatsNewClick={() => setShowWhatsNew(true)} />
      )}
    </PageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = HomeView;
Component.displayName = "HomeView";

import ResourceTable from "./ResourceTable";
import ToolRow from "./ToolRow";
import { useResourceListModals } from "./modals/useResourceListModals";
import { useMappedResources } from "./useMappedResources";

export default function ResourceListTab() {
  const { mappedResources, setMappedResources } = useMappedResources();
  useResourceListModals();
  return (
    <>
      <ToolRow />
      <ResourceTable
        resources={mappedResources}
        setResources={setMappedResources}
      />
    </>
  );
}

import { useRouteError } from "react-router-dom";

/** This is a hack to force react-router to propagate the error to the outer ErrorBoundary. */
export default function PropagateError(): never {
  throw useRouteError();
}

// Stub for React Router v6
export const Component: React.FC = PropagateError;
Component.displayName = "PropagateError";

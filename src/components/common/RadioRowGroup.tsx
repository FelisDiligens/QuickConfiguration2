import { createContext } from "react";

interface RadioRowGroupContextData {
  name: string;
  value?: string;
  onChange?: (id: string) => void;
}

export const RadioRowGroupContext = createContext(
  {} as RadioRowGroupContextData,
);

interface Props {
  name: string;
  value?: string;
  onChange?: (id: string) => void;
  children: React.ReactNode;
}

export default function RadioRowGroup({
  children,
  name,
  value,
  onChange,
}: Props) {
  return (
    <RadioRowGroupContext
      value={{
        name,
        value,
        onChange,
      }}
    >
      {children}
    </RadioRowGroupContext>
  );
}

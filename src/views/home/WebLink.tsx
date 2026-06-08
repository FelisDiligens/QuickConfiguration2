import { css } from "@emotion/react";
import { open } from "@tauri-apps/plugin-shell";
import * as React from "react";

interface Props {
  children: React.ReactNode;
  href: string;
}

const linkStyle = css`
  display: flex;
  align-items: center;
  min-width: 200px;
  padding: 0 4px;
  border-radius: 3px;
  transition: background-color ease 0.15s;
  font-size: 11pt;
  & > span {
    padding: 0 12px;
  }
  &:hover {
    background-color: rgba(128, 128, 128, 0.5);
    cursor: pointer;
  }
`;

export default function WebLink(props: Props) {
  return (
    <div css={linkStyle} onClick={() => open(props.href)}>
      {props.children}
    </div>
  );
}

import { css } from "@emotion/react";

/** Separator for `ColorOrb`s */
export default function Separator() {
  return (
    <div
      css={css`
        width: 1px;
        height: 32px;
        background-color: gray;
        margin-right: 10px;
        display: inline-block;
      `}
    ></div>
  );
}

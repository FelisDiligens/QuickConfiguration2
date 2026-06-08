import { css } from "@emotion/react";

interface Line {
  num: number;
  code: string;
  error: string | null;
}

interface Props {
  fileName: string;
  lines: Line[];
}

export default function CodeError(props: Props) {
  return (
    <div>
      <span
        css={css`
          padding-left: 10px;
          color: var(--bs-secondary-text-emphasis);
        `}
      >
        {props.fileName}
      </span>
      <table
        css={css`
        border-spacing: 0;
        border-collapse: separate;
        width: 100%;

        td {
          border-left: 1px solid var(--bs-secondary-border-subtle);
          padding: 0 5px 0 10px; 
          font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background-color: var(--bs-secondary-bg-subtle);
          color: var(--bs-secondary-text-emphasis);
        }

        td:last-of-type { width: 100%; border-right: 1px solid var(--bs-secondary-border-subtle); }
        tr:first-of-type > td { border-top: 1px solid var(--bs-secondary-border-subtle); }
        tr:last-of-type > td { border-bottom: 1px solid var(--bs-secondary-border-subtle); }
                        
        tr:first-of-type > td:first-of-type { border-top-left-radius: var(--bs-border-radius); }
        tr:first-of-type > td:last-of-type { border-top-right-radius: var(--bs-border-radius); }
        tr:last-of-type > td:first-of-type { border-bottom-left-radius: var(--bs-border-radius); }
        tr:last-of-type > td:last-of-type { border-bottom-right-radius: var(--bs-border-radius); }

        tr.error > td {
          background-color: var(--bs-danger-bg-subtle);
          color: var(--bs-danger-text-emphasis);
        }
        tr.error > td:last-of-type {
          border-left: 1px solid var(--bs-danger-border-subtle);
        }

        tr.error-description > td {
          color: var(--bs-danger-text-emphasis);
        }
      `}
      >
        <tbody>
          {props.lines.map((line, index) => {
            if (line.error) {
              return (
                <>
                  <tr key={"err" + index} className="error">
                    <td>{line.num}</td>
                    <td css={css`white-space: pre;`}>{line.code}</td>
                  </tr>
                  <tr key={"msg" + index} className="error-description">
                    <td></td>
                    <td>{line.error}</td>
                  </tr>
                </>
              );
            } else {
              return (
                <tr key={"line" + index}>
                  <td>{line.num}</td>
                  <td>{line.code}</td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
}

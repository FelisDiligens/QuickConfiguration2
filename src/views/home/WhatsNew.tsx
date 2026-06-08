import { FlexCol } from "@/components/common/Flex";
import { urls } from "@/info";
import { css } from "@emotion/react";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { open } from "@tauri-apps/plugin-shell";
import MarkdownIt from "markdown-it";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onGoBackClick: () => void;
}

export default function WhatsNew(props: Props) {
  const { t } = useTranslation();
  const wnContent = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fetch "What's new" markdown content and render it into `wnContent` ref:
    async function fetchWhatsNew() {
      if (!wnContent.current) {
        console.error(`wnContent is ${wnContent.current}`);
        return;
      }

      // Fetch "What's new" markdown:
      const resp = await tauriFetch(urls.changelog, {
        credentials: "omit",
      });
      const text = await resp.text();

      // Render markdown:
      const md = new MarkdownIt({
        html: true,
      });
      wnContent.current.innerHTML = md.render(text);

      // Handle links so they open in the user's default browser:
      wnContent.current.querySelectorAll("a").forEach((el) =>
        el.addEventListener("click", (e: MouseEvent) => {
          open((e.target as HTMLAnchorElement).href).catch((reason) => {
            console.error(`Couldn't open link: ${reason}`);
          });
          e.preventDefault();
        }),
      );
    }

    // Call async function and handle errors (e.g. network timeout etc.):
    fetchWhatsNew().catch((reason) => {
      console.error(`What's new couldn't be retrieved: ${reason}`);
      if (wnContent.current) {
        wnContent.current.innerHTML = ""; // Clear contents
        // Append a paragraph with error text:
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(t("errors.whatsNewFetchFailed")));
        p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode(`${reason}`));
        wnContent.current.appendChild(p);
      }
    });
  }, []);

  return (
    <>
      <FlexCol
        css={css`
          padding: 10px 10px 10px 20px;
          overflow: hidden;
        `}
      >
        <a href="#/" onClick={props.onGoBackClick}>
          <FontAwesomeIcon icon={faArrowLeft} />
          &nbsp; {t("home.goBack")}
        </a>
      </FlexCol>
      <div
        css={css`
          width: 100%;
          padding: 10px 20px;
          overflow-y: auto;
          flex-shrink: 99;
        `}
        ref={wnContent}
      ></div>
    </>
  );
}

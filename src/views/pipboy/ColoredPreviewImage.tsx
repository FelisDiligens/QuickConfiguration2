import { css } from "@emotion/react";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { activeTabAtom } from "./PipBoyView";

/** Represents a *.png that was imported in JavaScript */
export type ImportedImage = string;

interface Props {
  color: string;
  mask: ImportedImage;
  screen: ImportedImage;
}

export default function ColoredPreviewImage(props: Props) {
  const { t } = useTranslation();

  const activeTab = useAtomValue(activeTabAtom); // workaround: rerender when tab is switched
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgMask, setImgMask] = useState<HTMLImageElement | null>(null);
  const [imgScreen, setImgScreen] = useState<HTMLImageElement | null>(null);
  const [maskLoaded, setMaskLoaded] = useState(false);
  const [screenLoaded, setScreenLoaded] = useState(false);

  useEffect(() => {
    function loadImages() {
      // Get mask and screen images:
      const imgMask = new Image();
      imgMask.onload = () => setMaskLoaded(true);
      imgMask.src = props.mask;
      setImgMask(imgMask);

      const imgScreen = new Image();
      imgScreen.onload = () => setScreenLoaded(true);
      imgScreen.src = props.screen;
      setImgScreen(imgScreen);
    }

    function drawCanvas() {
      // https://stackoverflow.com/a/39176075
      const canvas = canvasRef.current;
      // Get canvas context:
      const context = canvas?.getContext("2d");
      if (canvas && context && imgScreen && imgMask) {
        // Draw the grayscale Pip-Boy screen:
        context.drawImage(imgScreen, 0, 0);

        // Set compositing to multiply (changes hue with new overwriting colors):
        context.globalCompositeOperation = "multiply"; // "color" - https://html.spec.whatwg.org/multipage/canvas.html#current-compositing-and-blending-operator

        // Paint the screen (and the entire image) with the given color:
        context.fillStyle = props.color;
        context.fillRect(0, 0, imgScreen.width, imgScreen.height);

        // Restore compositing to draw over:
        context.globalCompositeOperation = "source-over";

        // Draw the Pip-Boy mask (everything except the screen) on top:
        context.drawImage(imgMask, 0, 0);
      }
    }

    if (!maskLoaded && !screenLoaded) loadImages();
    if (maskLoaded && screenLoaded) drawCanvas();
  }, [props.color, maskLoaded, screenLoaded, activeTab]);

  return (
    <>
      <h4
        css={css`
          margin-top: 5px;
        `}
      >
        {t("pipboy.preview")}
      </h4>
      <p
        css={css`
          color: gray;
          line-height: 1.1;
          font-size: 10pt;
          margin: 0 0 10px 0;
        `}
      >
        <Trans t={t} i18nKey="pipboy.previewSubtitle" />
      </p>
      <canvas
        ref={canvasRef}
        width="400px"
        height="225px"
        css={css`
          border-radius: 8px;
        `}
      ></canvas>
    </>
  );
}

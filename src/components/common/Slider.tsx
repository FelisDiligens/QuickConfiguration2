/* eslint-disable react/prop-types */

import { clamp } from "@/utils/math";
import { css, SerializedStyles } from "@emotion/react";
import { useCallback, useMemo } from "react";
import { getTrackBackground, Range } from "react-range";
import { AppTheme } from "../MyThemeProvider";

interface Props {
  value: number;
  max: number;
  min: number;
  step?: number;
  onChange?: (value: number) => void;
  className?: string;
  css?: SerializedStyles;
}

function getSliderValues(
  value: number,
  min: number,
  max: number,
  step?: number,
) {
  // Clamp value to avoid error on `checkBoundaries`: https://github.com/tajo/react-range/blob/e13a6adcfb7be7f6a9ddc7c006244bfa0dc2fea3/src/utils.ts#L70
  const clampedValue = clamp(value, min, max);

  // Round to nearest "step" to avoid warning on `isStepDivisible`: https://github.com/tajo/react-range/blob/e13a6adcfb7be7f6a9ddc7c006244bfa0dc2fea3/src/utils.ts#L17
  /*
    Error cases:
      isStepDivisible(1, 90000, 1000)
      isStepDivisible(1, 90000, 1000)
      isStepDivisible(0, 0.6667, 0.001)
      isStepDivisible(0, 0.6667, 0.001)
      isStepDivisible(0, 0.6667, 0.001)
      isStepDivisible(0, 0.6667, 0.001)
  */
  step = step || 1; // Default is 1
  const roundedStep = parseInt(((clampedValue - min) / step).toFixed(8), 10);
  const roundedValue = roundedStep * step + min;

  return [roundedValue];
}

export default function Slider({ step, min, max, className, ...props }: Props) {
  const values = useMemo(
    () => getSliderValues(props.value, min, max, step),
    [props.value],
  );
  const setValues = useCallback(
    (values: number[]) => {
      if (props.onChange) props.onChange(values.at(0) || min);
    },
    [props.onChange],
  );
  return (
    <Range
      values={values}
      step={step}
      min={min}
      max={max}
      onChange={setValues}
      renderTrack={({ props, children }) => (
        <div
          onMouseDown={props.onMouseDown}
          onTouchStart={props.onTouchStart}
          style={props.style}
          className={className}
          css={css`
            height: 24px;
            display: flex;
            width: 100%;
          `}
        >
          <div
            ref={props.ref}
            css={(theme: AppTheme) => css`
              height: 6px;
              width: 100%;
              border-radius: 2px;
              background: ${getTrackBackground({
                values,
                colors: [
                  theme.components.slider.trackLeftColor,
                  theme.components.slider.trackRightColor,
                ],
                min,
                max,
              })};
              align-self: center;
            `}
          >
            {children}
          </div>
        </div>
      )}
      renderThumb={({ props, isDragged }) => (
        <div
          {...props}
          key={props.key}
          style={props.style}
          css={(theme: AppTheme) => css`
            height: 20px;
            width: 10px;
            border-radius: 1px;
            background-color: ${theme.components.slider.thumbColor};
            ${
              isDragged &&
              css`box-shadow: 0 0 2px 2px ${theme.components.slider.thumbHighlightColor};`
            }
          `}
        />
      )}
    />
  );
}

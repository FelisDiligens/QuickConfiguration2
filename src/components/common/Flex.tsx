import { type SerializedStyles } from "@emotion/react";
import _ from "lodash";
import { type CSSProperties } from "react";

interface Props<As extends React.ElementType> {
  /** Equivalent to `flex-direction: row` */
  row?: boolean;
  /** Equivalent to `flex-direction: col` */
  col?: boolean;
  /** Equivalent to `flex-grow`. If set to `true`, then `flex-grow` is set to 1. Default is 0. */
  grow?: boolean | CSSProperties["flexGrow"];
  /** Equivalent to `flex-grow: 0`. Overrides grow. */
  noGrow?: boolean;
  /** Equivalent to `flex-shrink`. If set to `true`, then `flex-shrink` is set to 1. Default is 1. */
  shrink?: boolean | CSSProperties["flexShrink"];
  /** Equivalent to `flex-shrink: 0`. Overrides shrink. */
  noShrink?: boolean;
  /** Equivalent to `flex-basis`. Default is "auto". */
  basis?: CSSProperties["flexBasis"];
  /** Equivalent to `flex: auto`, causing the item to grow and shrink. */
  auto?: boolean;
  /** Equivalent to `flex: none`, causing the item to not grow nor shrink. */
  none?: boolean;
  /** Equivalent to `flex-wrap: wrap`, causing items to wrap if they don't fit. Default is "nowrap". */
  wrap?: boolean | CSSProperties["flexWrap"];
  /** Equivalent to `gap` */
  gap?: CSSProperties["gap"];
  /** Equivalent to `align-items: center`, causing items to be center aligned on the cross axis. */
  center?: boolean;
  /** Equivalent to `width: 100%` */
  fullWidth?: boolean;
  /** Equivalent to `height: 100%` */
  fullHeight?: boolean;
  /** Enabled `& > * { flex-shrink: 0; }` css rule, causing items to not shrink. */
  noChildShrink?: boolean;

  as?: As;
  ref?: React.ComponentProps<As>["ref"];
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  css?: SerializedStyles;
}

const knownProps = [
  "row",
  "col",
  "grow",
  "noGrow",
  "shrink",
  "noShrink",
  "basis",
  "auto",
  "none",
  "wrap",
  "gap",
  "center",
  "fullWidth",
  "fullHeight",
  "noChildShrink",
  "as",
  "children",
];

/**
 * If the value is a boolean, transforms it to a trueValue or falseValue, otherwise returns the original value.
 */
function boolToVal<T>(
  value: boolean | T | undefined,
  trueValue: T,
  falseValue: T,
): T | undefined {
  return value === true ? trueValue : value === false ? falseValue : value;
}

/**
 * Returns the first value that isn't undefined or a boolean.
 */
function chain<T>(...values: (T | boolean | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== true && value !== false) return value;
  }
  return undefined;
}

/**
 * A flexbox utility component for convenient styling.
 * If no props are set, defaults to `<div style="display: flex">`.
 */
export function Flex<As extends React.ElementType = "div">(props: Props<As>) {
  const Tag = props.as || "div";
  return (
    <Tag
      css={{
        display: "flex",
        flexDirection: props.row ? "row" : props.col ? "column" : undefined,
        flexGrow: chain(
          props.noGrow && 0,
          props.auto && 1,
          props.none && 0,
          boolToVal(props.grow, 1, 0),
        ),
        flexShrink: chain(
          props.noShrink && 0,
          props.auto && 1,
          props.none && 0,
          boolToVal(props.shrink, 1, 0),
        ),
        flexBasis: props.basis,
        flexWrap: props.wrap ? "wrap" : undefined,
        gap: props.gap,
        alignItems: props.center ? "center" : undefined,
        width: props.fullWidth ? "100%" : undefined,
        height: props.fullHeight ? "100%" : undefined,
        "& > *": props.noChildShrink ? { flexShrink: 0 } : undefined,
      }}
      style={props.style}
      className={props.className}
      ref={props.ref}
      {..._.omit(props, knownProps)}
    >
      {props.children}
    </Tag>
  );
}

/**
 * A flexbox utility component for convenient styling.
 * If no props are set, defaults to `<div style="display: flex; flex-direction: row">`.
 */
export function FlexRow<As extends React.ElementType = "div">(
  props: Omit<Props<As>, "col" | "row">,
) {
  return <Flex row {...props} />;
}

/**
 * A flexbox utility component for convenient styling.
 * If no props are set, defaults to `<div style="display: flex; flex-direction: column">`.
 */
export function FlexCol<As extends React.ElementType = "div">(
  props: Omit<Props<As>, "col" | "row">,
) {
  return <Flex col {...props} />;
}

/**
 * A flexbox utility component for convenient styling.
 * If no props are set, defaults to a `<div">` with the following styles:
 * - Horizontal flow: `flex-direction: column`
 * - Full size: `width: 100%` and `height: 100%`
 * - Horizontally centered: `margin-left: auto` and `margin-right: auto`
 *
 * All props are overwritable.
 * You can use this as a basis to build a container, e.g. with a fixed width.
 */
export function FlexContainer<As extends React.ElementType = "div">(
  props: Props<As>,
) {
  return (
    <Flex
      col={!props.row}
      fullWidth
      fullHeight
      {...props}
      style={{
        marginRight: "auto",
        marginLeft: "auto",
        ...props.style,
      }}
    />
  );
}

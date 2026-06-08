export function clamp(num: number, min: number, max: number): number {
  return num <= min ? min : num >= max ? max : num;
}

/**
 * Compare two numbers and return true if they are *approximately* equal.
 * Since there can be inaccuracies introduced by floating point numbers,
 * we only check if the difference of those numbers is smaller than a fixed number ("epsilon").
 */
export function approxEq(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export function rgbToHex(color: RGBColor): string {
  function componentToHex(c: number) {
    const hex = clamp(Math.round(c * 255), 0, 255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  return (
    "#" +
    componentToHex(color.r) +
    componentToHex(color.g) +
    componentToHex(color.b)
  ).toUpperCase();
}

export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result.length == 4) {
    return {
      r: parseInt(result[1] as string, 16) / 255,
      g: parseInt(result[2] as string, 16) / 255,
      b: parseInt(result[3] as string, 16) / 255,
    };
  } else {
    throw new Error("Couldn't parse hex string: " + hex);
  }
}

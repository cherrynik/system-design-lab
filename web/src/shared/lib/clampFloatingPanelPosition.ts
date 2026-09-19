export type FloatingPanelPoint = {
  x: number;
  y: number;
};

export type FloatingPanelSize = {
  width: number;
  height: number;
};

export type FloatingPanelBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type ClampFloatingPanelOptions = {
  inset?: number;
};

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(Math.max(value, minimum), maximum)
);

/**
 * Keeps the top-left corner of a floating panel inside viewport or canvas bounds.
 * The preferred position and bounds must use the same coordinate space.
 */
export function clampFloatingPanelPosition(
  preferredPosition: FloatingPanelPoint,
  panelSize: FloatingPanelSize,
  bounds: FloatingPanelBounds,
  options: ClampFloatingPanelOptions = {},
): FloatingPanelPoint {
  const inset = Math.max(0, options.inset ?? 0);
  const width = Math.max(0, panelSize.width);
  const height = Math.max(0, panelSize.height);
  const minimumX = bounds.left + inset;
  const minimumY = bounds.top + inset;
  const maximumX = Math.max(minimumX, bounds.right - inset - width);
  const maximumY = Math.max(minimumY, bounds.bottom - inset - height);

  return {
    x: clamp(preferredPosition.x, minimumX, maximumX),
    y: clamp(preferredPosition.y, minimumY, maximumY),
  };
}

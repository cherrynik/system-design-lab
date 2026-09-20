import {
  ArrowShapeKindStyle,
  arrowShapeProps,
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  StyleProp,
  type Editor,
} from 'tldraw';

export function setArchitectureArrowStyles(editor: Editor) {
  editor.setStyleForNextShapes(ArrowShapeKindStyle, 'arc');
  editor.setStyleForNextShapes(DefaultColorStyle, 'light-blue');
  const labelColor = arrowShapeProps.labelColor;
  if (labelColor instanceof StyleProp) editor.setStyleForNextShapes(labelColor, 'light-blue');
  editor.setStyleForNextShapes(DefaultDashStyle, 'solid');
  editor.setStyleForNextShapes(DefaultFillStyle, 'none');
  editor.setStyleForNextShapes(DefaultFontStyle, 'mono');
  editor.setStyleForNextShapes(DefaultSizeStyle, 's');
}

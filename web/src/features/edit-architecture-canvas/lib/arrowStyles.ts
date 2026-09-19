import {
  ArrowShapeKindStyle,
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  type Editor,
} from 'tldraw';

export function setArchitectureArrowStyles(editor: Editor) {
  editor.setStyleForNextShapes(ArrowShapeKindStyle, 'arc');
  editor.setStyleForNextShapes(DefaultColorStyle, 'light-blue');
  editor.setStyleForNextShapes(DefaultDashStyle, 'solid');
  editor.setStyleForNextShapes(DefaultFillStyle, 'none');
  editor.setStyleForNextShapes(DefaultFontStyle, 'mono');
  editor.setStyleForNextShapes(DefaultSizeStyle, 's');
}

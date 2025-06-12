import type {CssStyle, Position} from '../types';

export function convertPositionToStyle(position: Position): CssStyle {
  const style: CssStyle = {};
  Object.entries(position).forEach(([key, value]) => {
    style[key as keyof Position] = `${value}px`;
  });

  return style;
}
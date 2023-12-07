export default function countDrawingDivs(depth: number, breadth: number): number {
  if (depth <= 0) return 1;
  return 1 + breadth * countDrawingDivs(depth - 1, breadth - 1);
}

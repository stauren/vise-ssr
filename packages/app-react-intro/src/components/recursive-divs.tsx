type RecursiveDivsProps = {
  depth: number,
  breadth: number,
  layer?: number,
};
function RecursiveDivs({ depth = 1, breadth = 1, layer = 1 }: RecursiveDivsProps) {
  if (depth <= 0) {
    return <div>abcdefghij</div>;
  }

  const children = [];

  for (let i = 0; i < breadth; i += 1) {
    children.push(
      <RecursiveDivs
        key={i}
        layer={i + 1}
        depth={depth - 1}
        breadth={breadth - 1}
      />,
    );
  }

  return (
    <div id={`${depth}-${breadth}-${layer}`}>
      {children}
    </div>
  );
}

RecursiveDivs.defaultProps = {
  layer: 1,
};

export default RecursiveDivs;

import { useState, useEffect } from 'react';
import RecursiveDivs from '@/components/recursive-divs';
import SsrTime from '@/components/ssr-time';
import BenchmarkNav from '@/components/benchmark-nav';
import countDrawingDivs from '@/utils/count-drawing-divs';

const depth = 5;
const breadth = 11;

export default function Benchmark() {
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => {
    setRenderCount(document.querySelectorAll('.benchmark-container div').length);
  }, []);
  return (
    <div className="benchmark-page">
      <h1 style={{ color: 'green' }}>Render with react function components</h1>
      <p>
        Plan to render:
        { countDrawingDivs(depth, breadth) }
        divs
      </p>
      <p>
        Rendered:
        { renderCount }
        divs
      </p>
      <SsrTime />
      <BenchmarkNav active="React" />
      <div className="benchmark-container">
        <RecursiveDivs
          depth={depth}
          breadth={breadth}
        />
      </div>
    </div>
  );
}

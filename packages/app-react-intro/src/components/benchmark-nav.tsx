import React from 'react';

type BenchmarkNavProps = {
  active?: string,
};

const list = [{
  link: '/vanilla',
  name: 'Vanilla JS',
}, {
  link: '/benchmark?functional=true',
  name: 'Vue3 FC',
}, {
  link: '/benchmark',
  name: 'Vue3',
}, {
  link: '/react/benchmark',
  name: 'React',
}];

export default function BenchmarkNav({ active }: BenchmarkNavProps) {
  return (
    <nav className="benchmark-nav">
      Benchmark Tests:
      <span className="benchmark-list">
        {
          list.map((item, idx) => (
            <React.Fragment key={item.name}>
              { item.name === active
                ? <span>{item.name}</span>
                : <>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      { item.name }
                    </a>
                  </>
              }
              { idx === list.length - 1 ? undefined : '|'}
            </React.Fragment>
          ))
        }
      </span>
    </nav>
  );
}

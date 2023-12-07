import React from 'react';
import { Link } from 'react-router-dom';

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
  inner: false,
}];

type MyLinkProps = {
  to: string,
  inner: boolean,
  name: string,
};

function MyLink({ to, inner, name }: MyLinkProps) {
  return inner
    ? <Link to={to}>{ name }</Link>
    : (
      <a
        href={to}
        target="_blank"
        rel="noreferrer"
      >
        { name }
      </a>
    );
}

function BenchmarkNav({ active }: BenchmarkNavProps) {
  return (
    <nav className="benchmark-nav">
      Benchmark Tests:
      <span className="benchmark-list">
        {
          list.map((item, idx) => (
            <React.Fragment key={item.name}>
              { item.name === active
                ? <span>{item.name}</span>
                : (
                  <MyLink
                    to={item.link}
                    name={item.name}
                    inner={!!item.inner}
                  />
                )}
              { idx === list.length - 1 ? undefined : '|'}
            </React.Fragment>
          ))
        }
      </span>
    </nav>
  );
}

BenchmarkNav.defaultProps = {
  active: '',
};

export default BenchmarkNav;

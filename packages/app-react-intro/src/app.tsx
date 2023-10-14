import React from 'react';
import SiteHeader from '@/components/site-header';
import SiteSidebar from '@/components/site-sidebar';
import './styles/index.scss';

function App({ RouterView }: { RouterView: () => JSX.Element }) {
  return (
    <div className="theme-container">
      <SiteHeader />
      <main className="page">
        <RouterView />
        <footer>
          Proudly served with Vise express server.
        </footer>
      </main>
      <SiteSidebar />
    </div>
  );
}

export default App;

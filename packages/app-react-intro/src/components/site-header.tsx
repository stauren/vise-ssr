import useSidebar  from '@/hooks/use-sidebar';
import useTheme, { ThemeName } from '@/hooks/use-theme';

const lightPaths = [
  'M16 12.005a4 4 0 1 1-4 4a4.005 4.005 0 0 1 4-4m0-2a6 6 0 1 0 6 6a6 6 0 0 0-6-6z',
  'M5.394 6.813l1.414-1.415l3.506 3.506L8.9 10.318z',
  'M2 15.005h5v2H2z',
  'M5.394 25.197L8.9 21.691l1.414 1.415l-3.506 3.505z',
  'M15 25.005h2v5h-2z',
  'M21.687 23.106l1.414-1.415l3.506 3.506l-1.414 1.414z',
  'M25 15.005h5v2h-5z',
  'M21.687 8.904l3.506-3.506l1.414 1.415l-3.506 3.505z',
  'M15 2.005h2v5h-2z',
];
const darkPath = 'M13.502 5.414a15.075 15.075 0 0 0 11.594 18.194a11.113 11.113 0 0 1-7.975 3.39c-.138 0-.278.005-.418 0a11.094 11.094 0 0 1-3.2-21.584M14.98 3a1.002 1.002 0 0 0-.175.016a13.096 13.096 0 0 0 1.825 25.981c.164.006.328 0 .49 0a13.072 13.072 0 0 0 10.703-5.555a1.01 1.01 0 0 0-.783-1.565A13.08 13.08 0 0 1 15.89 4.38A1.015 1.015 0 0 0 14.98 3z';
const gitPath = 'M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z';

export default function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const {
    toggleTheme,
    currentTheme,
  } = useTheme();

  return (
    <header className="navbar">
      <div
        className="toggle-sidebar-button"
        title="toggle sidebar"
        role="button"
        tabIndex={0}
        onClick={ toggleSidebar }
      >
        <div
          className="icon"
          aria-hidden="true"
        >
          <span /><span /><span />
        </div>
      </div>
      <div
        className="toggle-sidebar-button"
        title="toggle sidebar"
        aria-expanded="false"
        tabIndex={0}
      />
      <span><a
        href="/"
        className=""
      ><img
        className="logo"
        src="./logo.svg"
        alt="Vise"
      /><span className="site-name can-hide">Vise</span></a>
      </span>
      <div
        className="navbar-links-wrapper"
        style={{ maxWidth: '1051px' }}
      >
        <nav className="navbar-links can-hide">
          <div className="navbar-links-item">
            <a
              href="/"
              className="nav-link router-link-active"
            >
              Guide
            </a>
          </div>
          <div className="navbar-links-item">
            <div className="dropdown-wrapper">
              <button
                className="dropdown-title"
                type="button"
              >
                <span className="title">Reference</span><span className="arrow down" />
              </button>
              <ul
                className="nav-dropdown"
                style={{ display: 'none' }}
              >
                <li className="dropdown-item">
                  <ul className="dropdown-subitem-wrapper">
                    <li className="dropdown-subitem">
                      <a
                        href="https://www.npmjs.com/package/vise-ssr"
                        className="nav-link"
                      > Vise npm </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://github.com/stauren/vise-ssr/blob/main/CHANGELOG.md"
                        className="nav-link"
                      > CHANGELOG </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://github.com/stauren/vise-ssr/issues"
                        className="nav-link"
                      > Issues </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://vitejs.dev/"
                        className="nav-link"
                      > Vite </a>
                    </li>
                  </ul>
                </li>
                <li className="dropdown-item">
                  <h4 className="dropdown-subtitle">
                    <span>Related packages</span>
                  </h4>
                  <ul className="dropdown-subitem-wrapper">
                    <li className="dropdown-subitem">
                      <a
                        href="https://www.npmjs.com/package/@vise-ssr/express-server"
                        className="nav-link"
                      > @vise-ssr/express-server </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://www.npmjs.com/package/@vise-ssr/plugin-foot-note"
                        className="nav-link"
                      > @vise-ssr/plugin-foot-note </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://www.npmjs.com/package/@vise-ssr/plugin-render-error"
                        className="nav-link"
                      > @vise-ssr/plugin-render-error </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://www.npmjs.com/package/@vise-ssr/plugin-ssr-render"
                        className="nav-link"
                      > @vise-ssr/plugin-ssr-render </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://www.npmjs.com/package/@vise-ssr/vite-plugin-visecss"
                        className="nav-link"
                      > @vise-ssr/vite-plugin-visecss </a>
                    </li>
                    <li className="dropdown-subitem">
                      <a
                        href="https://www.npmjs.com/package/@vise-ssr/vite-plugin-inline-entry-css"
                        className="nav-link"
                      > @vise-ssr/vite-plugin-inline-entry-css </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className="navbar-links-item">
            <a
              className="nav-link external"
              href="https://github.com/stauren/vise-ssr"
              target="_blank"
              rel="noreferrer"
              aria-label="Git Source"
            > Git Source <span><svg
              className="icon outbound"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
              x="0px"
              y="0px"
              viewBox="0 0 100 100"
              width="15"
              height="15"
            ><path
              fill="currentColor"
              d={ gitPath }
            /><polygon
              fill="currentColor"
              points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
            /></svg><span className="sr-only">open in new window</span></span></a>
          </div>
        </nav>
        <button
          className="toggle-dark-button"
          title="toggle dark mode"
          onClick={ toggleTheme }
        >
          {
            currentTheme === ThemeName.dark
              ?  <svg
                   v-show=""
                   className="icon"
                   focusable="false"
                   viewBox="0 0 32 32"
                 >
              {
                lightPaths.map((currentPath: string) => (<path
                    key={ currentPath }
                    d={ currentPath }
                    fill="currentColor"
                  />))
              }
              </svg> : null
          }
          {
            currentTheme === ThemeName.light
              ?  <svg
                   className="icon"
                   focusable="false"
                   viewBox="0 0 32 32"
                 ><path
                   d={ darkPath }
                   fill="currentColor"
                 /></svg> : null
          }
        </button>
      </div>
    </header>
  );
}

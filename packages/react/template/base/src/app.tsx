import './styles/index.scss';

function App({ RouterView }: { RouterView: () => JSX.Element }) {
  return (
    <div className="theme-container">
      <main className="page">
        <RouterView />
        <footer>
          Proudly served with Vise express server.
        </footer>
      </main>
    </div>
  );
}

export default App;

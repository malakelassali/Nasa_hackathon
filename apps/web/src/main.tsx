import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@agrix/ui/styles.css';
import App from './App';
import './app.css';

class ShowcaseBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep sample inputs out of logs and error reporting. No telemetry is configured.
  }
  render() {
    return this.state.failed ? (
      <main className="showcase-recovery">
        <h1>AgriX showcase</h1>
        <p>This sample could not be displayed. Reload to start a fresh session.</p>
        <button type="button" onClick={() => window.location.reload()}>Restart showcase</button>
      </main>
    ) : this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Showcase root is missing');
createRoot(root).render(<StrictMode><ShowcaseBoundary><App /></ShowcaseBoundary></StrictMode>);

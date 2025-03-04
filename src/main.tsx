import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add error boundary
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Error in app:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Something went wrong</h1>
        <p>Please try refreshing the page</p>
      </div>
    );
  }
};

// Render without strict mode
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-fg)' }}>
      <Sidebar />
      <main className="lg:ml-60 min-h-screen p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

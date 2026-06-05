import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, House, FileText, ClipboardText, MagnifyingGlass, GasPump, Lightning, Siren, Drop, CloudSun, Newspaper, Robot, List, X, Package } from '@phosphor-icons/react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', icon: House, label: 'Home', emoji: '🏠', color: '#00e5b0' },
  { to: '/complaint', icon: FileText, label: 'Shikayat', emoji: '📋', color: '#ffd166' },
  { to: '/records', icon: ClipboardText, label: 'Records', emoji: '📊', color: '#4fc3f7' },
  { to: '/track', icon: MagnifyingGlass, label: 'Track ID', emoji: '🔍', color: '#a29bfe' },
  { to: '/fuel', icon: GasPump, label: 'Fuel', emoji: '⛽', color: '#ff7b54' },
  { to: '/electricity', icon: Lightning, label: 'Bill Calc', emoji: '⚡', color: '#fd79a8' },
  { to: '/emergency', icon: Siren, label: 'Emergency', emoji: '🚨', color: '#ff4757' },
  { to: '/blood', icon: Drop, label: 'Blood Bank', emoji: '🩸', color: '#ff6b9d' },
  { to: '/weather', icon: CloudSun, label: 'Mausam', emoji: '🌤️', color: '#4fc3f7' },
  { to: '/prayer', icon: Moon, label: 'Namaz', emoji: '🕌', color: '#00e5b0' },
  { to: '/news', icon: Newspaper, label: 'Khabar', emoji: '📰', color: '#ffd166' },
  { to: '/bot', icon: Robot, label: 'Help Bot', emoji: '🤖', color: '#a29bfe' },
  { to: '/lost-found', icon: Package, label: 'Lost & Found', emoji: '📦', color: '#ff8a80' },
];

export default function Sidebar() {
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #080d18 0%, #0d1524 100%)' }}>
      {/* Brand */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
        <div className="text-xl font-extrabold" style={{
          background: 'linear-gradient(135deg, #00e5b0, #4fc3f7, #a29bfe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          AWAAZ360 Pro
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--color-fg2)' }}>
          Pakistan ka Civic Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
          >
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? '' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
                style={isActive ? {
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                  color: item.color,
                  boxShadow: `0 0 20px ${item.color}10`,
                } : {}}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{
                  background: isActive ? `${item.color}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? `${item.color}30` : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <item.icon size={18} weight="duotone" color={isActive ? item.color : 'rgba(255,255,255,0.4)'} />
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle & footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-200"
        >
          {isDark ? <Sun size={18} weight="fill" /> : <Moon size={18} weight="fill" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="text-xs mt-3 text-center" style={{ color: 'var(--color-fg2)' }}>
          Built with ❤️ for Pakistan
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl lg:hidden"
        style={{
          background: 'var(--color-glass)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--color-glass-border)',
          color: 'var(--color-fg)',
        }}
      >
        {mobileOpen ? <X size={20} /> : <List size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-60 z-30">
        {sidebarContent}
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-64 z-50 transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}

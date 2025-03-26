import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, isAdmin, signOut } = useAuth();
  
  const menuItems = [
    { name: 'Dashboard', icon: '📊', href: '#', default: true },
    { name: 'Companies', icon: '🏢', href: '#' },
    { name: 'Products', icon: '🧩', href: '#' },
  ];
  
  // Add admin-only menu items
  const adminMenuItems = isAdmin ? [
    { name: 'Add Company', icon: '➕', href: '#', admin: true },
    { name: 'Manage Users', icon: '👥', href: '#', admin: true },
  ] : [];
  
  const allMenuItems = [...menuItems, ...adminMenuItems];
  
  const [activeItem, setActiveItem] = useState(
    allMenuItems.find(item => item.default)?.name || allMenuItems[0]?.name
  );
  
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [toggleSidebar]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>AI Infra Companies</h3>
          <button 
            className="sidebar-close" 
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {allMenuItems.map((item) => (
              <li 
                key={item.name}
                className={activeItem === item.name ? 'active' : ''}
              >
                <a 
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem(item.name);
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span>{item.name}</span>
                  {item.admin && <span className="admin-badge">Admin</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        {user && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <p className="user-email">{user.email || 'User'}</p>
                <p className="user-role">{isAdmin ? 'Admin' : 'User'}</p>
              </div>
            </div>
            <button 
              className="sidebar-logout" 
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

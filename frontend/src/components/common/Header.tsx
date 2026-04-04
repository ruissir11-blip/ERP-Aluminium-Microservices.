import React, { useState } from 'react';
import { Search, User, Menu } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getUserName = () => {
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
    }
    return 'Utilisateur';
  };

  return (
    <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] shadow-lg border-b border-[#0d9488]/30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Page Title & Menu */}
          <div className="flex items-center">
            {/* Menu Button - always visible */}
            <button 
              onClick={onMenuClick}
              className="mr-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-blue-200 mt-0.5 font-medium">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans l'application..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:bg-white/20 transition-all"
              />
            </div>
          </div>

          {/* Right Section - Notifications & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Profile */}
            <div className="flex items-center space-x-3 pl-2 border-l border-white/20">
              {/* User Info */}
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-white">
                  {getUserName()}
                </p>
                <p className="text-xs text-blue-200">
                  {user?.email || 'utilisateur@alutech.com'}
                </p>
              </div>
              
              {/* User Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-[#0d9488] to-[#0f766e] rounded-full flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                <span className="text-sm font-bold text-white">
                  {getUserInitials()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search (visible only on small screens) */}
        <div className="mt-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:bg-white/20 transition-all"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

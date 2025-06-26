import React from 'react';
import { Button } from '../ui/button.jsx';
import { Menu, Bell, User, Home, FileText, Calendar, Search } from 'lucide-react';
import { Badge } from '../ui/badge.jsx';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils.js';

const dashboardOptions = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'My Deliveries', path: '/deliveries' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: Search, label: 'Search Orders', path: '/search' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function DeliveryBoyHeader({ onMenuClick }) {
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      {/* Top row with user info and notifications */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Delivery Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, John Driver</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <Badge variant="outline" className="text-green-700 border-green-300">
              Available
            </Badge>
          </div>

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-semibold">3</span>
            </div>
          </Button>

          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Dashboard options navigation bar */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {dashboardOptions.map((option) => {
            const isActive = location.pathname === option.path;
            const Icon = option.icon;
            return (
              <Button
                key={option.label}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap',
                  isActive && 'bg-blue-600 text-white hover:bg-blue-700'
                )}
                asChild
              >
                <Link to={option.path}>
                  <Icon className="h-4 w-4" />
                  {option.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
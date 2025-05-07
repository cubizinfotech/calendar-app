import { NavLink } from 'react-router-dom';
import { Calendar, LayoutDashboard, FileText, Settings, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
const Sidebar = () => {
  const navItems = [{
    path: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: 'Dashboard'
  }, {
    path: '/calendar',
    icon: <Calendar className="h-5 w-5" />,
    label: 'Calendar'
  }, {
    path: '/new-event',
    icon: <PlusCircle className="h-5 w-5" />,
    label: 'New Event'
  }, {
    path: '/reports',
    icon: <FileText className="h-5 w-5" />,
    label: 'Reports'
  }, {
    path: '/admin',
    icon: <Settings className="h-5 w-5" />,
    label: 'Admin'
  }];
  return <aside className="bg-white border-r border-gray-200 w-full md:w-64 md:min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">         Events Management Hub</h1>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map(item => <li key={item.path}>
              <NavLink to={item.path} className={({
            isActive
          }) => cn('flex items-center px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100 transition-colors', isActive && 'bg-gray-100 text-primary font-medium')}>
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </NavLink>
            </li>)}
        </ul>
      </nav>
    </aside>;
};
export default Sidebar;
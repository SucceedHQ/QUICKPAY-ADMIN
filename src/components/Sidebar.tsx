import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, ArrowLeftRight, Landmark, LogOut } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: UsersIcon },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Withdrawals', path: '/withdrawals', icon: Landmark },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-black text-primary tracking-tight">QuickPay <span className="font-light">Admin</span></h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {links.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.name} to={link.path} className={`flex items-center gap-3 px-4 py-3 flex-shrink-0 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
              <Icon size={20} className={isActive ? 'text-primary' : 'text-gray-400'} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

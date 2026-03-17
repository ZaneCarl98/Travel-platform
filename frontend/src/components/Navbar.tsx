import { Link, useNavigate } from 'react-router-dom';
import { Search, User, PlusCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { isAuthenticated, logout } from '@/services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const loggedIn = isAuthenticated();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/city/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="text-2xl font-bold text-primary"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Tourism Mutual Assistance
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city..."
                className="w-48 md:w-64"
              />
              <Button type="submit" size="icon" variant="ghost">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Search cities"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/create')}
            aria-label="Create post"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(loggedIn ? '/profile?tab=footprint' : '/login')}
            aria-label="Check-in Footprint"
          >
            <span className="text-sm font-bold">F</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(loggedIn ? '/profile' : '/login')}
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </Button>

          {loggedIn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
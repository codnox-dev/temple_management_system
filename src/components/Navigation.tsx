import { useState, useEffect } from 'react';
import { Menu, X, Flame } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Temple Details', path: '/temple' },
    { label: 'Ritual Booking', path: '/rituals' },
    { label: 'Events', path: '/events' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ];

  // Function to handle the scroll event
  const handleScroll = () => {
    if (window.scrollY > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  // Add and remove the scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  // Conditional classes for the navigation bar background and transition
  const navClass = `fixed top-0 md:top-4 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-auto z-50 transition-all duration-500 rounded-none md:rounded-full ${
    isScrolled || location.pathname !== '/'
      ? 'bg-[#FFC83D] shadow-lg backdrop-blur-sm' // Transitions to divine yellow
      : 'bg-white/80 shadow-lg backdrop-blur-sm' // Starts as white with a blur
  }`;

  return (
    <nav className={navClass}>
      {/* Container div with new "Dynamic Island" styling */}
      <div className="px-4 md:px-8 sm:px-10 lg:px-12 max-w-fit mx-auto">
        {/* The height has been adjusted for the new style */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-[#d9954d] rounded-full group-hover:scale-110 transition-transform duration-300">
              <Flame className="h-6 w-6 text-white pulse-divine" />
            </div>
            <span className="text-xl font-playfair font-bold text-[#d9954d]">
              Vamanan Temple
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link text-black hover:text-[#b37c40] transition-colors ${
                  isActive(item.path) ? 'text-[#d9954d]' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button className="bg-[#d9954d] text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-[#b37c40] transition-colors">
              Book Now
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#f3ead8] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-black" />
            ) : (
              <Menu className="h-6 w-6 text-black" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-border/50 bg-[#fbf7ef]/80 backdrop-blur-sm">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link text-black hover:text-[#b37c40] block py-2 ${
                    isActive(item.path) ? 'text-[#d9954d]' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button className="bg-[#d9954d] text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-[#b37c40] transition-colors w-full mt-4">
                Book Now
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

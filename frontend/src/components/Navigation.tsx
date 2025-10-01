import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import lotusFooter from '../assets/lotusfooter.png';
import { useNavigate } from 'react-router-dom';

/**
 * A responsive navigation bar inspired by the Parassinikadavu temple website.
 * It's transparent at the top, becomes solid white on scroll, and features centered navigation links.
 */
const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '#home' },
    { label: 'About', path: '#about' },
    { label: 'Rituals', path: '#rituals' },
    { label: 'Events', path: '#events' },
    { label: 'Gallery', path: '#gallery' },
    { label: 'Committee', path: '#committee' },
    { label: 'Contact', path: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      let currentSection = '';
      navItems.forEach(item => {
        if (item.path.startsWith('#')) {
          const section = document.querySelector(item.path);
          if (section instanceof HTMLElement) {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 150) { // Adjusted offset for centered nav
              currentSection = item.path.substring(1);
            }
          }
        }
      });
      setActiveSection(currentSection || 'home');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Removed navItems from dependency array as it's constant

  const handleNavClick = (e, path) => {
    e.preventDefault();
    if (path.startsWith('#')) {
      const targetId = path.substring(1);
      if (window.location.pathname === '/') {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/', { state: { scrollTo: targetId } });
      }
    } else {
      navigate(path);
    }
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Dynamic styles based on scroll state
  const textColor = isScrolled ? 'text-gray-800' : 'text-white';
  const activeLinkColor = isScrolled ? 'text-orange-600' : 'text-orange-500';
  const logoTextColor = isScrolled ? 'text-gray-900' : 'text-white';

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ease-in-out ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand Name (Left) */}
        <div className="flex-shrink-0">
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center space-x-3">
            <div className="rounded-full bg-transparent">
              <img src={lotusFooter} alt="lotus" className="h-12 w-12 object-contain" />
            </div>
            <span className={`text-xl font-playfair font-bold whitespace-nowrap ${logoTextColor} transition-colors duration-300`}>
              Vamanan Temple
            </span>
          </a>
        </div>

        {/* Desktop Navigation Links (Centered) */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform md:flex md:items-center md:space-x-8">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => handleNavClick(e, item.path)}
              className={`font-semibold ${textColor} hover:text-orange-500 transition-colors duration-300 ${
                activeSection === item.path.substring(1) ? `font-bold ${activeLinkColor}` : ''
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Buttons (Right) */}
        <div className="hidden items-center space-x-2 md:flex">
          <button
            type="button"
            onClick={() => navigate('/ritual-booking')}
            className="bg-orange-500 text-white py-2 px-5 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors duration-300 whitespace-nowrap"
          >
            Book Now
          </button>
          <button
            type="button"
            onClick={() => navigate('/donation')} // Added donation button
            className={`border-2 font-semibold py-2 px-5 rounded-full transition-colors duration-300 whitespace-nowrap ${
                isScrolled ? 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white' : 'border-white text-white hover:bg-white hover:text-orange-500'
            }`}
          >
            Donate
          </button>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md inline-flex items-center justify-center focus:outline-none"
            aria-label="Main menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className={`h-6 w-6 text-gray-200`} /> // Icon color is fixed for dark menu
            ) : (
              <Menu className={`h-6 w-6 ${textColor}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu (Dark Theme) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900/95 backdrop-blur-sm text-white shadow-xl">
          <div className="px-2 pt-2 pb-6 space-y-2 sm:px-3">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-gray-700 ${
                  activeSection === item.path.substring(1) ? 'font-bold text-orange-400 bg-gray-800' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col space-y-3 px-2 pt-4 border-t border-gray-700">
               <button
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/ritual-booking'); }}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors"
              >
                Book Now
              </button>
              <button
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/donation'); }}
                className="w-full border-2 border-orange-400 text-orange-400 py-2 px-4 rounded-full font-semibold shadow-md hover:bg-orange-400 hover:text-white transition-colors"
              >
                Donate
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
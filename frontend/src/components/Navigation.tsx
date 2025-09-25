import { useState, useEffect } from 'react';
import { Menu, X, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * A traditional, responsive navigation bar component.
 * It's transparent at the top of the page and gains a solid background on scroll.
 * It features smooth scrolling to sections and highlights the active section.
 */
const Navigation = () => {
  // State for toggling the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State to track if the page has been scrolled
  const [isScrolled, setIsScrolled] = useState(false);
  // State to track the currently active section in the viewport
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '#home' },
    { label: 'About', path: '#about' },
    { label: 'Rituals', path: '#rituals' },
    { label: 'Events', path: '#events' },
    { label: 'Gallery', path: '#gallery' }, // This will now scroll to the gallery preview section
    { label: 'Contact', path: '#contact' },
  ];

  // Effect to handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Set scrolled state to true if user has scrolled more than 10px
      setIsScrolled(window.scrollY > 10);

      // Determine which section is currently active
      let currentSection = '';
      navItems.forEach(item => {
        if (item.path.startsWith('#')) {
          const section = document.querySelector(item.path);
          // Type guard to ensure section is an HTMLElement and has offsetTop
          if (section instanceof HTMLElement) {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 100) { // Offset for better accuracy
              currentSection = item.path.substring(1);
            }
          }
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    // Cleanup function to remove the event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);

  // Handles clicks on navigation links
  const handleNavClick = (e, path) => {
    e.preventDefault();
    if (path.startsWith('#')) {
      // Smooth scroll for internal links
      document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Use react-router for external links
      navigate(path);
    }
    // Close mobile menu after a click
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Dynamically set text color based on scroll state for better visibility
  const textColor = isScrolled ? 'text-gray-800' : 'text-white';
  const activeLinkColor = isScrolled ? 'text-orange-600' : 'text-orange-400';
  const logoTextColor = isScrolled ? 'text-gray-900' : 'text-white';

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ease-in-out ${
        isScrolled ? 'bg-white/90 backdrop-blur-sm shadow-lg' : 'bg-black/20 backdrop-blur-md'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand Name */}
          <div className="flex-shrink-0">
            <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-full">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <span className={`text-xl font-playfair font-bold whitespace-nowrap ${logoTextColor} transition-colors duration-300`}>
                Vamanan Temple
              </span>
            </a>
          </div>

          {/* Desktop Navigation Links & Button */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`font-semibold ${textColor} hover:text-orange-400 transition-colors duration-300 ${
                  activeSection === item.path.substring(1) ? `font-bold ${activeLinkColor}` : ''
                }`}
              >
                {item.label}
              </a>
            ))}
            <button className="bg-orange-500 text-white py-2 px-5 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors duration-300 whitespace-nowrap">
              Book Now
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
                <X className={`h-6 w-6 ${textColor}`} />
              ) : (
                <Menu className={`h-6 w-6 ${textColor}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 ${
                  activeSection === item.path.substring(1) ? 'font-bold text-orange-600 bg-orange-50' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 px-2">
              <button className="w-full bg-orange-500 text-white py-2 px-4 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

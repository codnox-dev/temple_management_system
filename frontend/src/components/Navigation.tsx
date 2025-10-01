import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import lotusFooter from '../assets/lotusfooter.png';
import { useNavigate } from 'react-router-dom';

/**
 * A responsive navigation bar that is a trapezoid on desktop and a rectangle on mobile.
 * It has a guaranteed centered logo, and side items are evenly spaced.
 * It becomes opaque and shrinks on scroll.
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

  const splitIndex = Math.ceil(navItems.length / 2);
  const leftNavItems = navItems.slice(0, splitIndex);
  const rightNavItems = navItems.slice(splitIndex);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      let currentSection = '';
      navItems.forEach(item => {
        if (item.path.startsWith('#')) {
          const section = document.querySelector(item.path);
          if (section instanceof HTMLElement) {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 100) {
              currentSection = item.path.substring(1);
            }
          }
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);

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

  const textColor = 'text-white';
  const activeLinkColor = 'text-orange-400';
  const logoTextColor = 'text-white';

  const NavLink = ({ item }) => (
    <a
      key={item.path}
      href={item.path}
      onClick={(e) => handleNavClick(e, item.path)}
      className={`font-semibold ${textColor} hover:text-orange-400 transition-colors duration-300 whitespace-nowrap ${
        activeSection === item.path.substring(1) ? `font-bold ${activeLinkColor}` : ''
      }`}
    >
      {item.label}
    </a>
  );
  
  const Logo = () => (
     <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center space-x-3">
        <div className="p-1 rounded-full bg-transparent">
          {/* Responsive image size: smaller on mobile, larger on desktop */}
          <img src={lotusFooter} alt="lotus" className="h-10 w-10 md:h-14 md:w-14 object-contain transition-all" />
        </div>
        {/* Responsive text size: smaller on mobile, larger on desktop */}
        <span className={`text-xl md:text-2xl font-playfair font-bold whitespace-nowrap ${logoTextColor} transition-colors duration-300`}>
          Vamanan Temple
        </span>
      </a>
  );

  return (
    <>
      {/* This style tag applies the trapezoid shape only on desktop screens */}
      <style>
        {`
          @media (min-width: 768px) {
            .desktop-trapezoid {
              clip-path: polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%);
            }
          }
        `}
      </style>
      <header className="fixed top-0 z-50 w-full p-2 sm:p-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <nav
          className={`desktop-trapezoid max-w-7xl mx-auto transition-all duration-300 ease-in-out rounded-lg md:rounded-none overflow-hidden ${
            isScrolled ? 'bg-yellow-950 shadow-lg' : 'bg-yellow-950/60 backdrop-blur-md'
          }`}
        >
          {/* Padding is now responsive: smaller on mobile, larger on desktop */}
          <div className={`relative flex items-center justify-between w-full px-4 md:px-20 transition-all duration-300 ${isScrolled ? 'h-16' : 'h-20'}`}>

              {/* --- Desktop Layout (CSS Grid for guaranteed centering) --- */}
              <div className="hidden md:grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-6">
                {/* Left Items (spaced out) */}
                <div className="flex items-center justify-around">
                  {leftNavItems.map((item) => <NavLink item={item} key={item.path}/>)}
                </div>
                
                {/* Center Logo */}
                <div className="flex-shrink-0">
                  <Logo />
                </div>

                {/* Right Items (spaced out with an added left margin) */}
                <div className="flex items-center justify-around gap-x-4 ml-8">
                  {rightNavItems.map((item) => <NavLink item={item} key={item.path}/>)}
                  <button
                    type="button"
                    onClick={() => navigate('/ritual-booking')}
                    className="bg-orange-500 text-white py-2 px-5 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors duration-300 whitespace-nowrap"
                  >
                    Book Now
                  </button>
                </div>
              </div>

              {/* --- Mobile Layout --- */}
              <div className="flex-shrink-0 md:hidden w-full flex justify-between items-center">
                  <Logo/>
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

          {/* The mobile menu dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-yellow-950/95 backdrop-blur-sm shadow-xl">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className={`block px-3 py-2 rounded-md text-base font-medium text-stone-100 hover:text-white hover:bg-yellow-900/50 ${
                      activeSection === item.path.substring(1) ? 'font-bold text-orange-400 bg-yellow-900/50' : ''
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-4 px-2">
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/ritual-booking'); }}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
};

export default Navigation;

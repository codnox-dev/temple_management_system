import { useState, useEffect } from 'react';
import { Menu, X, Flame } from 'lucide-react';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navItems = [
    { label: 'Home', path: '#home' },
    { label: 'About', path: '#about' },
    { label: 'Rituals', path: '#rituals' },
    { label: 'Events', path: '#events' },
    { label: 'Gallery', path: '#gallery' },
    { label: 'Contact', path: '#contact' },
  ];

  const handleScroll = () => {
    setIsScrolled(window.scrollY > 50);

    const sections = navItems.map(item => document.querySelector(item.path));
    const scrollPosition = window.scrollY + window.innerHeight / 2;

    for (const section of sections) {
      if (section instanceof HTMLElement && section.offsetTop <= scrollPosition && section.offsetTop + section.offsetHeight > scrollPosition) {
        setActiveSection(section.id);
        break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, path) => {
    e.preventDefault();
    document.querySelector(path).scrollIntoView({ behavior: 'smooth' });
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 cursor-pointer group
      transition-all duration-[2500ms] ease-in-out overflow-hidden
      md:w-[15%] md:hover:w-[80%] hover:bg-white/10 backdrop-blur-xl hover:shadow-2xl md:rounded-full
      bg-white/30 backdrop-blur-xl`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop and Tablet Navbar */}
      <div className="flex items-center justify-between h-16 px-4 md:px-8 w-full relative">
        {/* Logo and Brand Name */}
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center space-x-2 shrink-0">
          <div className="p-2 bg-[hsl(var(--primary))] rounded-full transition-transform duration-[2000ms] group-hover:scale-110">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center space-x-2 transition-all duration-2000 shrink-0">
            <span className="text-xl font-playfair font-bold text-[hsl(var(--primary))] whitespace-nowrap transition-colors duration-2000">
              Vamanan Temple
            </span>
            {/* Animated Arrow (Desktop Only) */}
            <div className={`arrow-indicator relative w-10 h-6 hidden md:flex items-center justify-start transition-transform duration-[2000ms] group-hover:rotate-180 group-hover:translate-x-1 ${isScrolled ? 'text-orange-500' : 'text-white'}`}>
            </div>
          </div>
        </a>

        {/* Navigation Links - Hidden initially, shown on hover (Desktop Only) */}
        <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-all duration-[3000ms] absolute left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-8 transition-opacity duration-[3000ms] whitespace-nowrap">
            {navItems.map((item, index) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`nav-link text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors duration-700
                group-hover:animate-fade-in
                ${activeSection === item.path.substring(1) ? 'font-bold text-[hsl(var(--secondary))]' : ''}`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Book Now Button */}
        <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-[3000ms] shrink-0 ml-auto">
          <button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-2 px-4 rounded-full font-semibold shadow-md hover:bg-[hsl(var(--secondary))] transition-colors duration-700 whitespace-nowrap">
            Book Now
          </button>
        </div>

        {/* Mobile Hamburger Menu (Mobile Only) */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-[hsl(var(--muted))] transition-colors shrink-0"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6 text-black" /> : <Menu className="h-6 w-6 text-black" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu - No pill shape for mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden py-6 border-t border-border/50 bg-[hsl(var(--background))]/80 backdrop-blur-sm mt-2 mx-2">
          {/* Aligned content to center */}
          <div className="flex flex-col space-y-4 items-center shrink-0">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`nav-link text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] block py-2 ${
                  activeSection === item.path.substring(1) ? 'font-bold text-[hsl(var(--secondary))]' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
            <button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-2 px-4 rounded-full font-semibold shadow-md hover:bg-[hsl(var(--secondary))] transition-colors w-full mt-4">
              Book Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;


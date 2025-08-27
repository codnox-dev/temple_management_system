import { useState, useEffect } from 'react';
import { Menu, X, Flame } from 'lucide-react';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      if (section && section.offsetTop <= scrollPosition && section.offsetTop + section.offsetHeight > scrollPosition) {
        setActiveSection(section.id);
        break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = `fixed top-0 md:top-4 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-auto z-50 transition-all duration-500 rounded-none md:rounded-full ${
    isScrolled ? 'bg-[#FFC83D] shadow-lg backdrop-blur-sm' : 'bg-white/80 shadow-lg backdrop-blur-sm'
  }`;
  
  const handleNavClick = (e, path) => {
    e.preventDefault();
    document.querySelector(path).scrollIntoView({ behavior: 'smooth' });
    if(isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <nav className={navClass}>
      <div className="px-4 md:px-8 sm:px-10 lg:px-12 max-w-fit mx-auto">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center space-x-2 group">
            <div className="p-2 bg-[#d9954d] rounded-full group-hover:scale-110 transition-transform duration-300">
              <Flame className="h-6 w-6 text-white pulse-divine" />
            </div>
            <span className="text-xl font-playfair font-bold text-[#d9954d]">
              Vamanan Temple
            </span>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`nav-link text-black hover:text-[#b37c40] transition-colors ${
                  activeSection === item.path.substring(1) ? 'text-[#d9954d] active' : ''
                }`}
              >
                {item.label}
              </a>
            ))}
            <button className="bg-[#d9954d] text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-[#b37c40] transition-colors">
              Book Now
            </button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#f3ead8] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6 text-black" /> : <Menu className="h-6 w-6 text-black" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-border/50 bg-[#fbf7ef]/80 backdrop-blur-sm">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  className={`nav-link text-black hover:text-[#b37c40] block py-2 ${
                    activeSection === item.path.substring(1) ? 'text-[#d9954d] active' : ''
                  }`}
                >
                  {item.label}
                </a>
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

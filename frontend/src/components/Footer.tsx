import { Phone, Mail, MapPin, Heart, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-divine text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Temple Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Heart className="h-6 w-6" />
              </div>
              <span className="text-xl font-playfair font-bold">Divine Temple</span>
            </div>
            <p className="text-white/80 leading-relaxed">
              A sacred sanctuary where devotees find peace, spiritual guidance, 
              and divine blessings through traditional rituals and ceremonies.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-playfair font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {['About Temple', 'Ritual Booking', 'Events', 'Gallery', 'Donations', 'Contact'].map((link) => (
                <li key={link}>
                  <a
                    href={link === 'Gallery' ? '/gallery' : '#'}
                    className="text-white/80 hover:text-white hover:underline transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-playfair font-semibold mb-6">Services</h3>
            <ul className="space-y-3">
              {['Daily Aarti', 'Special Pujas', 'Wedding Ceremonies', 'Festival Celebrations', 'Spiritual Counseling', 'Meditation Classes'].map((service) => (
                <li key={service}>
                  <a href="#" className="text-white/80 hover:text-white hover:underline transition-colors">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-playfair font-semibold mb-6">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 mt-0.5 text-white/80" />
                <div className="text-white/80">
                  <div>123 Sacred Street</div>
                  <div>Divine City, DC 12345</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-white/80" />
                <span className="text-white/80">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-white/80" />
                <span className="text-white/80">info@divinetemple.com</span>
              </div>
            </div>

            {/* Temple Timings */}
            <div className="mt-6 p-4 bg-white/10 rounded-lg">
              <h4 className="font-playfair font-semibold mb-2">Temple Timings</h4>
              <div className="text-sm text-white/80 space-y-1">
                <div>Morning: 5:00 AM - 12:00 PM</div>
                <div>Evening: 4:00 PM - 9:00 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-white/80">
            © 2024 Divine Temple. All rights reserved. Made with{' '}
            <Heart className="h-4 w-4 inline text-red-300" /> for spiritual devotion.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
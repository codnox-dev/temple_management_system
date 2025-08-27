import { Phone, Mail, MapPin } from 'lucide-react';

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
            Contact <span className="text-primary">Us</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We would love to hear from you. Whether you have a question, a suggestion, or need assistance, please feel free to reach out.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Contact Form */}
          <div className="card-divine">
            <h3 className="text-2xl font-playfair font-semibold mb-6">Send us a Message</h3>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                <input type="text" id="name" className="w-full px-4 py-3 rounded-lg bg-muted border-border focus:ring-primary focus:border-primary transition" placeholder="Your Name" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
                <input type="email" id="email" className="w-full px-4 py-3 rounded-lg bg-muted border-border focus:ring-primary focus:border-primary transition" placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-2">Message</label>
                <textarea id="message" rows={5} className="w-full px-4 py-3 rounded-lg bg-muted border-border focus:ring-primary focus:border-primary transition" placeholder="Your message..."></textarea>
              </div>
              <div className="text-right">
                <button type="submit" className="btn-divine">
                  Send Message
                </button>
              </div>
            </form>
          </div>

          {/* Contact Details */}
          <div className="space-y-8">
             <div className="flex items-start space-x-4 group">
                <div className="p-3 bg-gradient-divine rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-playfair font-semibold mb-1 text-foreground">Address</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">123 Sacred Street, Divine City, DC 12345</p>
                </div>
            </div>
            <div className="flex items-start space-x-4 group">
                <div className="p-3 bg-gradient-divine rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-playfair font-semibold mb-1 text-foreground">Phone</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">+1 (555) 123-4567</p>
                </div>
            </div>
            <div className="flex items-start space-x-4 group">
                <div className="p-3 bg-gradient-divine rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-playfair font-semibold mb-1 text-foreground">Email</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">info@divinetemple.com</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

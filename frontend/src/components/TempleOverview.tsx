import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';

const TempleOverview = () => {
  const navigate = useNavigate();
  const { ref: contentRef, isVisible: isContentVisible } = useScrollAnimation();
  const { ref: imageRef, isVisible: isImageVisible } = useScrollAnimation();

  return (
    // Changed py-20 to py-10 to reduce vertical space
    <section className="py-10 px-6">
      <div className="max-w-screen-2xl mx-auto bg-transparent border-2 border-red-500 rounded-xl p-6 sm:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div 
              ref={contentRef}
              className={`space-y-8 transition-all ease-in-out duration-1000 ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-foreground">
                  About Our <span className="text-primary">Sacred Temple</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                  For over a century, our temple has been a beacon of spiritual light, 
                  guiding devotees on their journey of faith, devotion, and inner peace. 
                  We honor ancient traditions while embracing modern conveniences to serve our community.
                </p>
              </div>
              <button className="btn-divine" onClick={() => navigate('/about')}>
                Learn More About Our Temple
              </button>
            </div>
            <div 
              ref={imageRef}
              className={`relative transition-all ease-in-out duration-1000 delay-300 ${isImageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className="relative rounded-2xl overflow-hidden card-divine">
                <img
                  src=""
                  alt="Temple Interior"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TempleOverview;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom hook to handle scroll animations
const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};


const TempleOverview = () => {
  const navigate = useNavigate();
  const { ref: contentRef, isVisible: isContentVisible } = useScrollAnimation();
  const { ref: imageRef, isVisible: isImageVisible } = useScrollAnimation();

  return (
    // Main section container
    <section className="py-10 px-6">
      {/* This is the div where the scroll styling has been applied */}
      <div className="relative max-w-screen-2xl mx-auto bg-yellow-100 border-4 border-yellow-700 p-6 sm:p-8 lg:p-12 
                   rounded-lg shadow-md
                   before:content-[''] before:absolute before:-top-4 before:left-0 
                   before:w-8 before:h-8 before:bg-yellow-200 before:rounded-full before:border-4 before:border-yellow-700
                   after:content-[''] after:absolute after:-bottom-4 after:right-0 
                   after:w-8 after:h-8 after:bg-yellow-200 after:rounded-full after:border-4 after:border-yellow-700">
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side content */}
            <div 
              ref={contentRef}
              className={`space-y-8 transition-all ease-in-out duration-1000 ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-yellow-800">
                  About Our <span className="text-yellow-900">Sacred Temple</span>
                </h2>
                <p className="text-xl text-yellow-900 leading-relaxed mb-8">
                  For over a century, our temple has been a beacon of spiritual light, 
                  guiding devotees on their journey of faith, devotion, and inner peace. 
                  We honor ancient traditions while embracing modern conveniences to serve our community.
                </p>
              </div>
              <button className="bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-800 transition-colors duration-300" onClick={() => navigate('/about')}>
                Learn More About Our Temple
              </button>
            </div>
            {/* Right side image */}
            <div 
              ref={imageRef}
              className={`relative transition-all ease-in-out duration-1000 delay-300 ${isImageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-yellow-600/50">
                <img
                  src=""
                  alt="Temple Interior"
                  className="w-full h-[500px] object-cover bg-yellow-50"
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


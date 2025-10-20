import React, { useEffect, useState } from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const ImageWithBlur: React.FC<Props> = ({ src, className = '', alt = '', ...rest }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${loaded ? 'blur-0 scale-100 opacity-100' : 'blur-md scale-105 opacity-80'}`}
        {...rest}
      />
    </div>
  );
};

export default ImageWithBlur;

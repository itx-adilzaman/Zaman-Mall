import React, { useState, useEffect } from 'react';

interface ProductImageSliderProps {
  images: string[];
  name: string;
}

export const ProductImageSlider: React.FC<ProductImageSliderProps> = ({ images, name }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderImages = images.slice(0, 3); // Only first 3 images as requested

  useEffect(() => {
    if (sliderImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {sliderImages.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`${name} - ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          }`}
        />
      ))}
      
      {/* Indicators */}
      {sliderImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {sliderImages.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentIndex ? 'w-4 bg-yellow-500' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

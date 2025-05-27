"use client";

import React, { useState } from 'react';

interface RatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || value;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isHalfFilled = starValue - 0.5 <= displayRating && starValue > displayRating;

          return (
            <button
              key={index}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              className={`
                ${sizeClasses[size]} transition-colors duration-150
                ${readonly 
                  ? 'cursor-default' 
                  : 'cursor-pointer hover:scale-110 transform transition-transform'
                }
                ${isFilled || isHalfFilled
                  ? 'text-yellow-400' 
                  : 'text-gray-300 dark:text-gray-600'
                }
              `}
              title={readonly ? `评分: ${value.toFixed(1)}` : `评分: ${starValue} 星`}
            >
              <i className={`bi bi-star${isFilled ? '-fill' : ''}`} />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}; 
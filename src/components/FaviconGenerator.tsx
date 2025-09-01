import React, { useEffect } from 'react';

const FaviconGenerator: React.FC = () => {
  useEffect(() => {
    const generateFavicon = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      const size = 32;
      const centerX = size / 2;
      const centerY = size / 2;
      
      // Background circle
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Eye shape (ellipse)
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, size * 0.375, size * 0.25, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Eye border
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Inner eye
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, size * 0.25, size * 0.15625, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.09375, 0, 2 * Math.PI);
      ctx.fill();
      
      // Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX + 1, centerY - 1, 1, 0, 2 * Math.PI);
      ctx.fill();
      
      // Convert to data URL and set as favicon
      const dataURL = canvas.toDataURL('image/png');
      
      // Remove existing favicon
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }
      
      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = dataURL;
      document.head.appendChild(link);
    };
    
    generateFavicon();
  }, []);
  
  return null;
};

export default FaviconGenerator;

'use client';

import Image from 'next/image';

interface UpdateImageProps {
  imageUrl: string;
  caption: string | null;
  updatePictureId: number;
  allPhotos: any[];
}

export default function UpdateImage({ imageUrl, caption, updatePictureId, allPhotos }: UpdateImageProps) {
  const handleClick = () => {
    // Find the index of this image in the gallery
    const imageIndex = allPhotos.findIndex(
      photo => photo.updatePictureId === updatePictureId
    );
    
    if (imageIndex !== -1) {
      // Scroll to gallery
      const gallery = document.getElementById('photo-gallery');
      if (gallery) {
        gallery.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Trigger the gallery lightbox after a short delay to allow scroll
      setTimeout(() => {
        const galleryImage = document.querySelector(`[data-photo-index="${imageIndex}"]`);
        if (galleryImage) {
          (galleryImage as HTMLElement).click();
        }
      }, 500);
    }
  };

  return (
    <div 
      className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
      onClick={handleClick}
    >
      <Image
        src={imageUrl}
        alt={caption || 'Update photo'}
        fill
        className="object-cover"
      />
    </div>
  );
}

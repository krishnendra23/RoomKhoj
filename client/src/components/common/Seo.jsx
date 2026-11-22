import { useEffect } from 'react';

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function Seo({
  title,
  description = 'Discover affordable rental rooms, 1BHK, 2BHK, flats and PGs directly from property owners in Prayagraj. Zero brokerage.',
  ogImage,
}) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | RoomKhoj`
      : 'RoomKhoj — Find Your Perfect Room Without Roaming Around';
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
    }
  }, [title, description, ogImage]);

  return null;
}

export const fetchImages = async (keywords = []) => {
  if (!process.env.UNSPLASH_ACCESS_KEY || !keywords.length) return [];
  try {
    const query = keywords.slice(0, 2).join(' ');
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((photo) => ({
      url: photo.urls.regular,
      thumb: photo.urls.thumb,
      alt: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
    }));
  } catch {
    return [];
  }
};

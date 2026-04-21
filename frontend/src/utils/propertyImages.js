export const PROPERTY_TYPE_DEFAULT_IMAGES = {
  Flat: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
  Office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
  Shop: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80",
  Home: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
};

export const getDefaultPropertyImage = (propertyType) =>
  PROPERTY_TYPE_DEFAULT_IMAGES[propertyType] ||
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";

export const toAssetUrl = (pathOrUrl, apiOrigin) => {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${apiOrigin}${pathOrUrl}`;
};

export const resolvePropertyCoverImage = (property, apiOrigin) => {
  const firstPhoto = property?.photoUrls?.[0] || "";
  if (firstPhoto) return toAssetUrl(firstPhoto, apiOrigin);
  return getDefaultPropertyImage(property?.propertyType);
};

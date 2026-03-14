export function renderStars(rating?: number) {
  //still in working progress
  if (!rating) return "N/A";
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return (
    <>
      {"★".repeat(fullStars)}
      {"☆".repeat(halfStar)}
      {"✩".repeat(emptyStars)}
    </>
  );
}

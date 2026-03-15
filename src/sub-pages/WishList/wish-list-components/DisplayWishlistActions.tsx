import DisplaySortingButtons from "./DisplaySortingButtons";
import SearchShareWishlist from "./SearchShareWishlist";

interface DisplayWishlistActionsProps {
  visible: boolean;
}

export default function DisplayWishlistActions({
  visible,
}: DisplayWishlistActionsProps) {
  return (
    <>
      {/* Search + Share row */}
      <SearchShareWishlist visible={visible} />

      {/* Sort & Filter bar — frosted glass pill row */}
      <DisplaySortingButtons visible={visible} />
    </>
  );
}

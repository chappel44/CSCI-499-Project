import DisplaySortingButtons from "./DisplaySortingButtons";
import SearchShareWishlist from "./SearchShareWishlist";
import WatchlistSummary from "./WatchlistSummary";

interface DisplayWishlistActionsProps {
  visible: boolean;
}

export default function DisplayWishlistActions({
  visible,
}: DisplayWishlistActionsProps) {
  return (
    <>
      <WatchlistSummary visible={visible} />

      {/* Search + Share row */}
      <SearchShareWishlist visible={visible} />

      {/* Sort & Filter bar — frosted glass pill row */}
      <DisplaySortingButtons visible={visible} />
    </>
  );
}

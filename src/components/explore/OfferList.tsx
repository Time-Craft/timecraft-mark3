
import { useExploreOffers } from "@/hooks/useExploreOffers"
import OfferCard from "./OfferCard"
import { Suspense } from "react"

const OfferListSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
    ))}
  </div>
)

const OfferList = () => {
  const { offers, isLoading } = useExploreOffers()

  console.log("OfferList - offers:", offers)
  console.log("OfferList - loading:", isLoading)

  if (isLoading) {
    return <OfferListSkeleton />
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No offers found</p>
        <p className="text-sm mt-2">Check back later for new opportunities</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard 
          key={offer.id} 
          offer={offer}
        />
      ))}
    </div>
  )
}

export default OfferList

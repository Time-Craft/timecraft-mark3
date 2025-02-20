
import OfferList from './OfferList'
import MapView from './MapView'

interface ExploreContentProps {
  view: 'list' | 'map'
  offers: any[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  acceptOffer: (offerId: string) => void
}

const ExploreContent = ({ view, ...exploreData }: ExploreContentProps) => {
  return (
    <div className="w-full h-[calc(100vh-12rem)]">
      {view === 'list' ? <OfferList {...exploreData} /> : <MapView />}
    </div>
  )
}

export default ExploreContent

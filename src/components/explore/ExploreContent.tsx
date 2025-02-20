
import OfferList from './OfferList'
import MapView from './MapView'
import { useExploreOffers } from '@/hooks/useExploreOffers'

interface ExploreContentProps {
  view: 'list' | 'map'
}

const ExploreContent = ({ view }: ExploreContentProps) => {
  const { offers, isLoading } = useExploreOffers()
  
  console.log("ExploreContent - offers:", offers)
  console.log("ExploreContent - loading:", isLoading)

  return (
    <div className="w-full h-[calc(100vh-12rem)]">
      {view === 'list' ? <OfferList /> : <MapView />}
    </div>
  )
}

export default ExploreContent

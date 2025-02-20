
import { useState } from "react"
import ExploreHeader from "@/components/explore/ExploreHeader"
import ExploreContent from "@/components/explore/ExploreContent"
import { useExploreOffers } from "@/hooks/useExploreOffers"

const Explore = () => {
  const [view, setView] = useState<'list' | 'map'>('list')
  const exploreData = useExploreOffers()

  return (
    <div className="container mx-auto p-6">
      <ExploreHeader view={view} onViewChange={setView} />
      <ExploreContent view={view} {...exploreData} />
    </div>
  )
}

export default Explore

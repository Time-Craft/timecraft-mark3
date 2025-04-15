
import HomeHeader from "@/components/home/HomeHeader"
import QuickStats from "@/components/home/QuickStats"
import PendingOffers from "@/components/home/PendingOffers"
import StatsCards from "@/components/home/StatsCards"

const Home = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <HomeHeader />
      <QuickStats />
      <div className="space-y-6">
        <PendingOffers />
        <StatsCards />
      </div>
    </div>
  )
}

export default Home

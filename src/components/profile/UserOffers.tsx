
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import OfferCard from "@/components/explore/OfferCard"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useEffect } from "react"

interface UserOffersProps {
  profile: {
    id: string
    username?: string | null
    avatar_url?: string | null
  } | undefined
}

const UserOffers = ({ profile }: UserOffersProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: userOffers } = useQuery({
    queryKey: ['user-offers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5
  })

  useEffect(() => {
    const channel = supabase
      .channel('user-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `profile_id=eq.${profile?.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['user-offers'], (old: any[]) => 
              old?.filter(offer => offer.id !== payload.old.id)
            )
          } else if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['user-offers'], (old: any[]) => 
              [payload.new, ...(old || [])]
            )
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(['user-offers'], (old: any[]) => 
              old?.map(offer => offer.id === payload.new.id ? payload.new : offer)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Offers</CardTitle>
          <Button size="sm" onClick={() => navigate('/offer')}>
            <Plus className="h-4 w-4 mr-1" />
            New Offer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userOffers?.length === 0 ? (
            <p className="text-center text-muted-foreground">
              You haven't created any offers yet
            </p>
          ) : (
            userOffers?.map((offer) => (
              <OfferCard 
                key={offer.id} 
                offer={{
                  ...offer,
                  user: {
                    id: offer.profile_id,
                    name: profile?.username || 'Unknown',
                    avatar: profile?.avatar_url || '/placeholder.svg'
                  }
                }}
                showApplications={true}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default UserOffers


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import OfferCard from "@/components/explore/OfferCard"
import { useEffect } from "react"

const Profile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Profile subscription
  useEffect(() => {
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile update received:', payload)
          queryClient.invalidateQueries({ queryKey: ['profile'] })
        }
      )
      .subscribe()

    // Add subscription to time_balances table
    const timeBalanceChannel = supabase
      .channel('profile-time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances'
        },
        (payload) => {
          console.log('Time balance update received on profile page:', payload)
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalanceChannel)
    }
  }, [queryClient])

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    }
  })

  // Add query to fetch time balance
  const { data: timeBalance, isLoading: timeBalanceLoading } = useQuery({
    queryKey: ['time-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      console.log('Fetching time balance for user on Profile page:', user.id)
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching time balance on Profile page:', error)
        throw error
      }
      
      console.log('Time balance data on Profile page:', data)
      return data
    }
  })

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
    }
  })

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      queryClient.clear()
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error.message,
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
        <div className="flex items-center gap-4">
          {!timeBalanceLoading && (
            <div className="text-sm font-medium">
              <span className="text-teal">{timeBalance?.balance || 0}</span> credits available
            </div>
          )}
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {profile?.username?.substring(0, 2).toUpperCase() || 'UN'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl md:text-2xl">
                {profile?.username || 'Username not set'}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.services?.map((service: string) => (
                  <span
                    key={service}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Requests</CardTitle>
            <Button size="sm" onClick={() => navigate('/offer')}>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userOffers?.length === 0 ? (
              <p className="text-center text-muted-foreground">
                You haven't created any requests yet
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
    </div>
  )
}

export default Profile

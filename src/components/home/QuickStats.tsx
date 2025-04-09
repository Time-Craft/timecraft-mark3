
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ChartBar, List } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"

const QuickStats = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Set up real-time listener for time balances changes
    const timeBalanceChannel = supabase
      .channel('time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances'
        },
        (payload) => {
          console.log('Time balance update received:', payload)
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    // Set up real-time listener for offers changes to update stats
    const offersChannel = supabase
      .channel('offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Offers update received:', payload)
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    // Also subscribe to user_stats changes
    const userStatsChannel = supabase
      .channel('user-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(timeBalanceChannel)
      supabase.removeChannel(offersChannel)
      supabase.removeChannel(userStatsChannel)
    }
  }, [queryClient])

  // Get user stats from the database
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    }
  })

  // Get time balance from the time_balances table
  const { data: timeBalance, isLoading: timeBalanceLoading } = useQuery({
    queryKey: ['time-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      console.log('Fetching time balance for user:', user.id)
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching time balance:', error)
        throw error
      }
      
      console.log('Time balance data:', data)
      return data
    }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="gradient-border card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-navy">Time Balance</CardTitle>
          <Clock className="h-4 w-4 text-teal" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-navy">
              {timeBalanceLoading ? "Loading..." : `${timeBalance?.balance || 0} credits`}
            </div>
            <Badge variant="outline" className="bg-teal/10 text-teal">Available</Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card className="gradient-border card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-navy">Active Requests</CardTitle>
          <List className="h-4 w-4 text-teal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-navy">{stats?.active_offers || 0}</div>
        </CardContent>
      </Card>
      
      <Card className="gradient-border card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-navy">Hours Exchanged</CardTitle>
          <ChartBar className="h-4 w-4 text-teal" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-navy">{stats?.hours_exchanged || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuickStats

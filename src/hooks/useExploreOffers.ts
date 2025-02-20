
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface Offer {
  id: string
  title: string
  description: string
  hours: number
  user: {
    id: string
    name: string
    avatar: string
  }
  status: string
  relevance_score?: number
}

export const useExploreOffers = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  // Enhanced query with recommendations and real-time invalidation
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers', searchQuery],
    queryFn: async () => {
      let query;
      
      if (!searchQuery) {
        // Use recommended offers when no search query
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error('User not authenticated')

        const { data, error } = await supabase
          .rpc('get_recommended_offers', {
            user_id: user.user.id
          })

        if (error) throw error

        // Map the recommended offers to match our interface
        return data.map(offer => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          hours: offer.hours,
          status: offer.status,
          relevance_score: offer.relevance_score,
          user: {
            id: offer.profile_id,
            name: 'Loading...', // We'll fetch this in a second query
            avatar: '/placeholder.svg'
          }
        }))
      } else {
        // Use regular search when there's a query
        const { data, error } = await supabase
          .from('offers')
          .select(`
            id,
            title,
            description,
            hours,
            status,
            profiles!offers_profile_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .eq('status', 'available')
          .ilike('title', `%${searchQuery}%`)
        
        if (error) throw error

        return data.map(offer => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          hours: offer.hours,
          status: offer.status,
          user: {
            id: offer.profiles?.id || '',
            name: offer.profiles?.username || 'Unknown User',
            avatar: offer.profiles?.avatar_url || '/placeholder.svg'
          }
        }))
      }
    },
  })

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Real-time update received:', payload)
          queryClient.invalidateQueries({ queryKey: ['offers'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // Fetch user details for recommended offers
  useEffect(() => {
    if (offers && !searchQuery) {
      offers.forEach(async (offer) => {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', offer.user.id)
          .single()

        if (!error && profileData) {
          queryClient.setQueryData(['offers', searchQuery], (oldData: any) =>
            oldData.map((o: Offer) =>
              o.id === offer.id
                ? {
                    ...o,
                    user: {
                      ...o.user,
                      name: profileData.username || 'Unknown User',
                      avatar: profileData.avatar_url || '/placeholder.svg'
                    }
                  }
                : o
            )
          )
        }
      })
    }
  }, [offers, searchQuery, queryClient])

  const acceptOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'pending' })
        .eq('id', offerId)
      
      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer accepted successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to accept offer: ${error.message}`,
      })
    }
  })

  return {
    offers,
    isLoading,
    searchQuery,
    setSearchQuery,
    acceptOffer: acceptOffer.mutate
  }
}


import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'

export const useApplicationManagement = (offerId?: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase
      .channel('application-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_applications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['offer-applications'] })
          queryClient.invalidateQueries({ queryKey: ['user-application'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['offer-applications', offerId],
    queryFn: async () => {
      if (!offerId) return []
      
      const { data, error } = await supabase
        .from('offer_applications')
        .select(`
          *,
          profiles:applicant_id (
            username,
            avatar_url
          )
        `)
        .eq('offer_id', offerId)
      
      if (error) throw error
      return data
    },
    enabled: !!offerId
  })

  const { data: userApplication } = useQuery({
    queryKey: ['user-application', offerId],
    queryFn: async () => {
      if (!offerId) return null
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('offer_applications')
        .select('*')
        .eq('offer_id', offerId)
        .eq('applicant_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!offerId
  })

  const updateApplicationStatus = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string, status: 'accepted' | 'rejected' }) => {
      // First update the application status
      const { error: applicationError } = await supabase
        .from('offer_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
      
      if (applicationError) throw applicationError

      // If accepting, update the offer status to booked
      if (status === 'accepted') {
        const { data: application } = await supabase
          .from('offer_applications')
          .select('offer_id')
          .eq('id', applicationId)
          .single()

        if (application) {
          // Update other applications to rejected
          await supabase
            .from('offer_applications')
            .update({ 
              status: 'rejected',
              updated_at: new Date().toISOString()
            })
            .eq('offer_id', application.offer_id)
            .neq('id', applicationId)

          // Update offer status to booked
          const { error: offerError } = await supabase
            .from('offers')
            .update({ 
              status: 'booked',
              updated_at: new Date().toISOString()
            })
            .eq('id', application.offer_id)

          if (offerError) throw offerError
        }
      }
    },
    onMutate: async ({ applicationId, status }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['offer-applications', offerId] })

      // Snapshot the previous value
      const previousApplications = queryClient.getQueryData(['offer-applications', offerId])

      // Optimistically update to the new value
      queryClient.setQueryData(['offer-applications', offerId], (old: any[] = []) => {
        return old.map(app => {
          if (app.id === applicationId) {
            return { ...app, status }
          }
          // If accepting, reject all other applications
          if (status === 'accepted') {
            return { ...app, status: 'rejected' }
          }
          return app
        })
      })

      return { previousApplications }
    },
    onError: (error, variables, context) => {
      // Revert back to the previous state if there's an error
      queryClient.setQueryData(['offer-applications', offerId], context?.previousApplications)
      toast({
        title: "Error",
        description: "Failed to update application status: " + error.message,
        variant: "destructive",
      })
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['offer-applications', offerId] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast({
        title: "Success",
        description: "Application status updated successfully",
      })
    }
  })

  return {
    applications,
    userApplication,
    isLoadingApplications,
    updateApplicationStatus: updateApplicationStatus.mutate,
    isUpdating: updateApplicationStatus.isPending
  }
}

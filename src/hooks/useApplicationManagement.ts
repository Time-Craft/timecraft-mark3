
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['profile'] })
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
      const { error: applicationError } = await supabase
        .from('offer_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
      
      if (applicationError) throw applicationError

      if (status === 'accepted') {
        const { data: application } = await supabase
          .from('offer_applications')
          .select('offer_id')
          .eq('id', applicationId)
          .single()

        if (application) {
          const { error: offerError } = await supabase
            .from('offers')
            .update({ status: 'booked' })
            .eq('id', application.offer_id)

          if (offerError) throw offerError
        }
      }
    },
    onMutate: async ({ applicationId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['offer-applications'] })
      const previousApplications = queryClient.getQueryData(['offer-applications'])

      // Optimistically update the application status
      queryClient.setQueryData(['offer-applications'], (old: any[]) => 
        old?.map(app => app.id === applicationId ? { ...app, status } : app)
      )

      return { previousApplications }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['offer-applications'], context?.previousApplications)
      toast({
        title: "Error",
        description: "Failed to update application status: " + error.message,
        variant: "destructive",
      })
    },
    onSuccess: () => {
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

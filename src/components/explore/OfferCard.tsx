
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import OfferHeader from "./OfferHeader"
import OfferStatus from "./OfferStatus"
import { Check, Hourglass, X, Trash2 } from "lucide-react"
import { useApplicationManagement } from "@/hooks/useApplicationManagement"
import { useQuery, useMutation } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface OfferCardProps {
  offer: {
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
  }
  showApplications?: boolean
  onDelete?: () => void
}

const OfferCard = ({ offer, showApplications = false, onDelete }: OfferCardProps) => {
  const { toast } = useToast()
  const { 
    applications, 
    updateApplicationStatus,
    userApplication 
  } = useApplicationManagement(offer.id)

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    }
  })

  const applyToOffer = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('offer_applications')
        .insert({
          offer_id: offer.id,
          applicant_id: user.id,
          status: 'pending'
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application submitted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit application: " + error.message,
        variant: "destructive",
      })
    }
  })

  const isOwner = currentUser?.id === offer.user.id

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offer.id)
        .eq('profile_id', currentUser?.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Offer deleted successfully",
      })

      if (onDelete) {
        onDelete()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete offer: " + error.message,
      })
    }
  }

  const renderApplyButton = () => {
    if (userApplication) {
      return (
        <Button 
          disabled 
          variant="secondary"
          className="w-full md:w-auto mt-4 md:mt-0"
        >
          <Hourglass className="h-4 w-4 mr-1" />
          {userApplication.status === 'pending' ? 'Application Pending' : 
            userApplication.status === 'accepted' ? 'Application Accepted' : 
            'Application Rejected'}
        </Button>
      )
    }

    return (
      <Button 
        onClick={() => applyToOffer.mutate()}
        disabled={offer.status !== 'available' || applyToOffer.isPending}
        className="w-full md:w-auto mt-4 md:mt-0 bg-teal hover:bg-teal/90 text-cream"
      >
        <Check className="h-4 w-4 mr-1" />
        {offer.status === 'available' ? 'Apply' : 'Not Available'}
      </Button>
    )
  }

  return (
    <Card className="gradient-border card-hover">
      <CardContent className="p-6">
        <OfferHeader user={offer.user} title={offer.title} hours={offer.hours} />
        <p className="mt-2 text-navy/80">{offer.description}</p>
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <OfferStatus status={offer.status} />
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            {isOwner && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="icon"
                className="w-full md:w-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {!isOwner && renderApplyButton()}
          </div>
        </div>

        {showApplications && applications && applications.length > 0 && (
          <div className="mt-4 border-t border-mint/20 pt-4">
            <h4 className="font-semibold mb-2 text-navy">Applications</h4>
            <div className="space-y-2">
              {applications.map((application: any) => (
                <div key={application.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-mint/10 p-3 rounded-lg">
                  <span className="text-navy">{application.profiles.username}</span>
                  {application.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => updateApplicationStatus({ 
                          applicationId: application.id, 
                          status: 'accepted' 
                        })}
                        className="bg-teal hover:bg-teal/90 text-cream"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateApplicationStatus({ 
                          applicationId: application.id, 
                          status: 'rejected' 
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {application.status !== 'pending' && (
                    <span className={`capitalize ${
                      application.status === 'accepted' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {application.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OfferCard

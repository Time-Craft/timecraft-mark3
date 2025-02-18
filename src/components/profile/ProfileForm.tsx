
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface ProfileFormProps {
  profile: {
    username?: string | null
    avatar_url?: string | null
    services?: string[] | null
  } | undefined
}

const ProfileForm = ({ profile }: ProfileFormProps) => {
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [services, setServices] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const updateProfileMutation = useMutation({
    mutationFn: async ({ username, services }: { username: string, services: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          services,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
    },
    onMutate: async ({ username, services }) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      const previousProfile = queryClient.getQueryData(['profile'])

      queryClient.setQueryData(['profile'], (old: any) => ({
        ...old,
        username,
        services
      }))

      return { previousProfile }
    },
    onError: (err, newProfile, context) => {
      queryClient.setQueryData(['profile'], context?.previousProfile)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateProfileMutation.mutateAsync({
        username,
        services: services.split(',').map(s => s.trim())
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>
              {username?.substring(0, 2).toUpperCase() || 'UN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl md:text-2xl">User Profile</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Services Offered</label>
            <Input 
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="e.g., Programming, Teaching, Gardening" 
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple services with commas
            </p>
          </div>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProfileForm

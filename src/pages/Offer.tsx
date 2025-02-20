
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useOfferManagement } from "@/hooks/useOfferManagement"
import ServiceTypeSelect from "@/components/offer/ServiceTypeSelect"
import DateDurationSelect from "@/components/offer/DateDurationSelect"

const Offer = () => {
  const navigate = useNavigate()
  const { createOffer, isCreating } = useOfferManagement()
  const [description, setDescription] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [otherServiceType, setOtherServiceType] = useState("")
  const [date, setDate] = useState<Date>()
  const [duration, setDuration] = useState("")
  const [timeCredits, setTimeCredits] = useState([1])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalServiceType = serviceType === "Others" ? otherServiceType : serviceType
    
    await createOffer({
      title: finalServiceType,
      description,
      hours: timeCredits[0],
      serviceType: finalServiceType,
      date: date?.toISOString(),
      duration: Number(duration)
    })

    navigate('/profile')
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl md:text-4xl font-bold mb-6">Create New Offer</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <ServiceTypeSelect
              value={serviceType}
              onValueChange={setServiceType}
              otherServiceType={otherServiceType}
              onOtherServiceTypeChange={setOtherServiceType}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your service offer in detail..."
                required
              />
            </div>

            <DateDurationSelect
              date={date}
              onDateChange={setDate}
              duration={duration}
              onDurationChange={setDuration}
              timeCredits={timeCredits}
              onTimeCreditsChange={setTimeCredits}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
                className="bg-teal hover:bg-teal/90 text-cream"
              >
                {isCreating ? "Creating..." : "Create Offer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Offer


import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface OfferActionsProps {
  offerId: string
  onAccept: () => void
}

const OfferActions = ({ onAccept }: OfferActionsProps) => {
  return (
    <div className="flex space-x-2">
      <Button 
        size="sm"
        onClick={onAccept}
      >
        <Check className="h-4 w-4 mr-1" />
        Accept
      </Button>
    </div>
  )
}

export default OfferActions

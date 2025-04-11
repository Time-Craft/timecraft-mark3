
import { Button } from "@/components/ui/button"
import { CheckCircle2, Trash2 } from "lucide-react"

interface OfferOwnerActionsProps {
  offerId: string
  status: string
  hasAcceptedApplication: boolean
  onDelete: () => void
  onComplete: () => void
  isDeleting: boolean
  isCompleting: boolean
}

const OfferOwnerActions = ({
  offerId,
  status,
  hasAcceptedApplication,
  onDelete,
  onComplete,
  isDeleting,
  isCompleting
}: OfferOwnerActionsProps) => {
  // Following the user's requirements: if an offer has an accepted application,
  // show the Mark as Done button; otherwise show the Delete button
  if (hasAcceptedApplication && status !== 'completed') {
    return (
      <Button
        onClick={onComplete}
        variant="default"
        disabled={isCompleting}
        className="w-full md:w-auto flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Mark as Done
      </Button>
    )
  }

  if (!hasAcceptedApplication && status !== 'completed') {
    return (
      <Button
        onClick={onDelete}
        variant="destructive"
        disabled={isDeleting}
        className="w-full md:w-auto flex items-center justify-center"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    )
  }

  return null
}

export default OfferOwnerActions

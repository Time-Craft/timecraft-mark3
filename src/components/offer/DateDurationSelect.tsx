
import { format } from "date-fns"
import { Calendar as CalendarIcon, CreditCard } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface DateDurationSelectProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  duration: string
  onDurationChange: (duration: string) => void
  timeCredits: number[]
  onTimeCreditsChange: (credits: number[]) => void
}

const DateDurationSelect = ({
  date,
  onDateChange,
  duration,
  onDurationChange,
  timeCredits,
  onTimeCreditsChange
}: DateDurationSelectProps) => {
  return (
    <div className="flex gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium">Duration (hours)</label>
        <Input 
          type="number"
          min="0.5"
          step="0.5"
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
          placeholder="e.g., 1.5"
          required
        />
      </div>
      
      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium">Time Credits</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start font-normal"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {timeCredits[0]} Credit{timeCredits[0] !== 1 ? 's' : ''}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Select Time Credits</h4>
              <Slider
                value={timeCredits}
                onValueChange={onTimeCreditsChange}
                min={1}
                max={5}
                step={1}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 Credit</span>
                <span>5 Credits</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export default DateDurationSelect

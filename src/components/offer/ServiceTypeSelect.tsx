
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface ServiceTypeSelectProps {
  value: string
  onValueChange: (value: string) => void
  otherServiceType: string
  onOtherServiceTypeChange: (value: string) => void
}

const serviceCategories = [
  "Elderly Care",
  "Pet Care",
  "Child Care",
  "Handyman",
  "Tech Support",
  "Cooking",
  "Housekeeping",
  "Design & Arts",
  "Teaching/Coaching",
  "Companionship"
]

const ServiceTypeSelect = ({
  value,
  onValueChange,
  otherServiceType,
  onOtherServiceTypeChange
}: ServiceTypeSelectProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Service Type</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a service type" />
        </SelectTrigger>
        <SelectContent>
          {serviceCategories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value === "Others" && (
        <Input
          value={otherServiceType}
          onChange={(e) => onOtherServiceTypeChange(e.target.value)}
          placeholder="Please specify the service type"
          className="mt-2"
          required
        />
      )}
    </div>
  )
}

export default ServiceTypeSelect

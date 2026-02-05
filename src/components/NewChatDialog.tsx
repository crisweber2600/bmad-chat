import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NewChatDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (domain: string, service: string, feature: string, title: string) => void
  existingDomains: string[]
  existingServices: string[]
  existingFeatures: string[]
}

export function NewChatDialog({
  open,
  onClose,
  onCreate,
  existingDomains,
  existingServices,
  existingFeatures,
}: NewChatDialogProps) {
  const [domain, setDomain] = useState('')
  const [service, setService] = useState('')
  const [feature, setFeature] = useState('')
  const [title, setTitle] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [customService, setCustomService] = useState('')
  const [customFeature, setCustomFeature] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalDomain = domain === 'new' ? customDomain : domain
    const finalService = service === 'new' ? customService : service
    const finalFeature = feature === 'new' ? customFeature : feature

    if (!finalDomain || !finalService || !finalFeature || !title) return

    onCreate(finalDomain, finalService, finalFeature, title)
    handleClose()
  }

  const handleClose = () => {
    setDomain('')
    setService('')
    setFeature('')
    setTitle('')
    setCustomDomain('')
    setCustomService('')
    setCustomFeature('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Decision Thread</DialogTitle>
            <DialogDescription>
              Organize your decisions by Domain, Service, and Feature to maintain clarity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger id="domain">
                  <SelectValue placeholder="Select or create domain..." />
                </SelectTrigger>
                <SelectContent>
                  {existingDomains.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Create New Domain</SelectItem>
                </SelectContent>
              </Select>
              {domain === 'new' && (
                <Input
                  placeholder="Enter new domain name..."
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select value={service} onValueChange={setService} disabled={!domain}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select or create service..." />
                </SelectTrigger>
                <SelectContent>
                  {existingServices.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Create New Service</SelectItem>
                </SelectContent>
              </Select>
              {service === 'new' && (
                <Input
                  placeholder="Enter new service name..."
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feature">Feature</Label>
              <Select value={feature} onValueChange={setFeature} disabled={!service}>
                <SelectTrigger id="feature">
                  <SelectValue placeholder="Select or create feature..." />
                </SelectTrigger>
                <SelectContent>
                  {existingFeatures.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Create New Feature</SelectItem>
                </SelectContent>
              </Select>
              {feature === 'new' && (
                <Input
                  placeholder="Enter new feature name..."
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Decision Title</Label>
              <Input
                id="title"
                placeholder="e.g., 'Define user authentication strategy'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Start Conversation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

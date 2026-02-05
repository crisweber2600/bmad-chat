import { useState } from 'react'
import { FileChange } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileDiffViewer } from './FileDiffViewer'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CreatePRDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (title: string, description: string) => void
  fileChanges: FileChange[]
}

export function CreatePRDialog({
  open,
  onClose,
  onCreate,
  fileChanges,
}: CreatePRDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (title.trim()) {
      onCreate(title.trim(), description.trim())
      setTitle('')
      setDescription('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Create Pull Request</DialogTitle>
          <DialogDescription className="text-sm">
            Review your changes and create a pull request for approval
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2 sm:pr-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pr-title" className="text-sm">Title</Label>
              <Input
                id="pr-title"
                placeholder="Summarize your changes..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pr-description" className="text-sm">Description</Label>
              <Textarea
                id="pr-description"
                placeholder="Describe the changes in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">File Changes ({fileChanges.length})</Label>
              <FileDiffViewer fileChanges={fileChanges} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto" size="sm">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim()} className="w-full sm:w-auto" size="sm">
            Create Pull Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

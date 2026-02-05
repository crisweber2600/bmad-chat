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
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Pull Request</DialogTitle>
          <DialogDescription>
            Review your changes and create a pull request for approval
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pr-title">Title</Label>
              <Input
                id="pr-title"
                placeholder="Summarize your changes..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pr-description">Description</Label>
              <Textarea
                id="pr-description"
                placeholder="Describe the changes in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>File Changes ({fileChanges.length})</Label>
              <FileDiffViewer fileChanges={fileChanges} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>
            Create Pull Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

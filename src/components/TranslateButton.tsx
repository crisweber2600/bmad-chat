import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Translate, UserGear, Briefcase } from '@phosphor-icons/react'
import { UserRole } from '@/lib/types'
import { toast } from 'sonner'

interface TranslateButtonProps {
  userRole: UserRole
  onTranslate: () => Promise<void>
  isTranslated: boolean
  disabled?: boolean
}

export function TranslateButton({ userRole, onTranslate, isTranslated, disabled }: TranslateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onTranslate()
    } catch (error) {
      toast.error('Failed to translate content')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isTranslated ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Translating...
        </>
      ) : (
        <>
          <Translate size={16} weight={isTranslated ? 'fill' : 'regular'} />
          {isTranslated ? 'Translated' : 'Translate'} for{' '}
          {userRole === 'business' ? (
            <>
              <Briefcase size={14} />
              Business
            </>
          ) : (
            <>
              <UserGear size={14} />
              Technical
            </>
          )}
        </>
      )}
    </Button>
  )
}

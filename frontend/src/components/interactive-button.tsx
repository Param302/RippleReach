'use client'

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function InteractiveButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button onClick={() => console.log("Clicked!")}>
      Click me
    </Button>
  )
} 
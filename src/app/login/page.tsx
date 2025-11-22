'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

type Step = 'PHONE' | 'OTP'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('PHONE')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "OTP Sent",
          description: "Check your console for the mock OTP (1234)",
        })
        setStep('OTP')
      } else {
        throw new Error(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast({
        title: "Error",
        description: "Please enter the OTP code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otpCode: otp }),
      })

      const data = await response.json()

      if (data.success && data.token) {
        // Save token to localStorage
        localStorage.setItem('token', data.token)

        toast({
          title: "Login Successful",
          description: "Welcome to Charlotte Loyalty!",
        })

        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        throw new Error(data.error || 'Failed to verify OTP')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setStep('PHONE')
    setOtp('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Charlotte Loyalty
          </CardTitle>
          <CardDescription>
            {step === 'PHONE'
              ? 'Enter your phone number to get started'
              : 'Enter the OTP sent to your phone'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'PHONE' ? (
            <>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0812345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSendOTP}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Get OTP'
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                    OTP Code
                  </label>
                  <button
                    onClick={handleBackToPhone}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    disabled={isLoading}
                  >
                    Change phone number
                  </button>
                </div>
                <Input
                  id="otp"
                  type="text"
                  placeholder="1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className="text-xs text-gray-500">
                  Hint: Mock OTP is always 1234
                </p>
              </div>
              <Button
                onClick={handleVerifyOTP}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
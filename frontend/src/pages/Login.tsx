import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const FuturisticTempleLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { sendOTP: authSendOTP, verifyOTP: authVerifyOTP } = useAuth() as any;
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!mobileNumber) {
      toast.error('Please enter your mobile number');
      return;
    }

    // Basic validation
    const cleanMobile = mobileNumber.replace(/\s/g, '');
    if (!cleanMobile.match(/^\+\d{10,15}$/)) {
      toast.error('Please enter a valid mobile number with country code (e.g., +911234567890)');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authSendOTP(cleanMobile);
      setOtpSent(true);
      setStep('otp');
      toast.success(`OTP sent to ${data.mobile_number}. Check the backend terminal for the code.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const success = await authVerifyOTP(mobileNumber.replace(/\s/g, ''), otp);
      if (success) {
        toast.success('Login successful! Redirecting...');
        // Navigation will be handled by the auth context
      } else {
        toast.error('Login failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToMobile = () => {
    setStep('mobile');
    setOtp('');
    setOtpSent(false);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full bg-gray-900 text-white p-4"
      style={{
        backgroundImage:
          `url('https://www.transparenttextures.com/patterns/az-subtle.png'), linear-gradient(to right bottom, #1a202c, #2d3748, #4a5568)`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-2xl shadow-purple-500/10 z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-400"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Sanctum Access
          </CardTitle>
          <CardDescription className="text-gray-400">
            {step === 'mobile' ? 'Enter your mobile number to receive OTP' : 'Enter the OTP sent to your mobile'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {step === 'mobile' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-gray-300">
                    Mobile Number
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+911234567890"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500"
                    disabled={isLoading}
                  />
                  <div className="text-xs text-gray-400">
                    Enter your mobile number with country code (e.g., +91 for India)
                  </div>
                </div>
                <Button
                  onClick={handleSendOTP}
                  disabled={isLoading || !mobileNumber}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-300">
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400 focus:border-purple-500 text-center text-2xl tracking-widest"
                    disabled={isLoading}
                    maxLength={6}
                  />
                  <div className="text-xs text-gray-400">
                    Enter the 6-digit OTP sent to {mobileNumber}
                  </div>
                  <div className="text-xs text-yellow-400">
                    Check the backend terminal for the OTP (debug mode)
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying OTP...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                  <Button
                    onClick={handleBackToMobile}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-slate-600 text-gray-300 hover:bg-slate-800"
                  >
                    ← Back to Mobile Number
                  </Button>
                </div>
              </>
            )}
            
            <div className="text-center text-xs text-gray-500">
              Having trouble? Contact your administrator to ensure your mobile number is registered.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuturisticTempleLogin;

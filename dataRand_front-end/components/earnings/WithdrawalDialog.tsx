"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, Smartphone, Building2, CreditCard } from "lucide-react";

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  profileId: string;
  onSuccess: () => void;
}

const paymentMethods = [
  { id: "mpesa", name: "M-Pesa", icon: Smartphone, description: "Kenya, Tanzania, DRC" },
  { id: "moniepoint", name: "Moniepoint", icon: CreditCard, description: "Nigeria" },
  { id: "chipper", name: "Chipper Cash", icon: Wallet, description: "Multi-country Africa" },
  { id: "bank", name: "Bank Transfer", icon: Building2, description: "International" },
];

const MIN_WITHDRAWAL = 5;
const MAX_WITHDRAWAL = 500;

export function WithdrawalDialog({
  open,
  onOpenChange,
  availableBalance,
  profileId,
  onSuccess,
}: WithdrawalDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const parsedAmount = parseFloat(amount) || 0;
  const maxAmount = Math.min(availableBalance, MAX_WITHDRAWAL);

  const isValid =
    parsedAmount >= MIN_WITHDRAWAL &&
    parsedAmount <= maxAmount &&
    paymentMethod &&
    (paymentMethod === "bank" || phoneNumber);

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("withdrawal_requests").insert({
        profile_id: profileId,
        amount: parsedAmount,
        payment_method: paymentMethod,
        phone_number: paymentMethod !== "bank" ? phoneNumber : null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted! 🎉",
        description: `Your request for $${parsedAmount.toFixed(2)} is being processed.`,
      });

      onSuccess();
      onOpenChange(false);
      setAmount("");
      setPaymentMethod("");
      setPhoneNumber("");
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Withdraw Earnings
          </DialogTitle>
          <DialogDescription>
            Minimum ${MIN_WITHDRAWAL}, maximum ${MAX_WITHDRAWAL} per week
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Available balance */}
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-3xl font-display font-bold text-primary">
              ${availableBalance.toFixed(2)}
            </p>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                placeholder={MIN_WITHDRAWAL.toString()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                min={MIN_WITHDRAWAL}
                max={maxAmount}
              />
            </div>
            {parsedAmount > 0 && parsedAmount < MIN_WITHDRAWAL && (
              <p className="text-xs text-destructive">
                Minimum withdrawal is ${MIN_WITHDRAWAL}
              </p>
            )}
            {parsedAmount > maxAmount && (
              <p className="text-xs text-destructive">
                Maximum withdrawal is ${maxAmount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-2">
                      <method.icon className="h-4 w-4" />
                      <span>{method.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({method.description})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone number for mobile money */}
          {paymentMethod && paymentMethod !== "bank" && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your {paymentMethods.find((m) => m.id === paymentMethod)?.name} registered number
              </p>
            </div>
          )}

          {/* Bank transfer note */}
          {paymentMethod === "bank" && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">Bank Transfer</p>
              <p className="text-muted-foreground">
                Our team will contact you to collect bank details securely.
              </p>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full gradient-primary text-primary-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Request Withdrawal
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Withdrawals are processed within 24-48 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

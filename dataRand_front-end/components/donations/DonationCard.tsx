"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Users, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const COST_PER_CHILD = 15; // $15 per child

interface DonationOption {
  children: number;
  label: string;
  highlight?: boolean;
}

const donationOptions: DonationOption[] = [
  { children: 1, label: "1 child" },
  { children: 5, label: "5 children", highlight: true },
  { children: 10, label: "10 children" },
];

export function DonationCard() {
  const [selectedOption, setSelectedOption] = useState<number | null>(5);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getChildrenCount = (): number => {
    if (customAmount) {
      const amount = parseFloat(customAmount);
      return Math.floor(amount / COST_PER_CHILD);
    }
    return selectedOption || 0;
  };

  const getTotalAmount = (): number => {
    if (customAmount) {
      return Math.max(parseFloat(customAmount) || 0, COST_PER_CHILD);
    }
    return (selectedOption || 0) * COST_PER_CHILD;
  };

  const handleDonate = async () => {
    const amountDollars = getTotalAmount();
    const childrenCount = getChildrenCount();

    if (amountDollars < COST_PER_CHILD) {
      toast({
        title: "Minimum donation",
        description: `Minimum donation is $${COST_PER_CHILD} (1 child's education)`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: {
          amount: Math.round(amountDollars * 100), // Convert to cents
          childrenCount,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Donation error:", err);
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const childrenCount = getChildrenCount();
  const totalAmount = getTotalAmount();

  return (
    <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 to-primary/5 overflow-hidden">
      <CardContent className="py-6 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/20 mb-4">
            <Heart className="h-8 w-8 text-secondary" />
          </div>
          <h3 className="text-2xl font-display font-bold">Donate to Education</h3>
          <p className="text-muted-foreground mt-1">
            $15 provides one year of education for a child
          </p>
        </div>

        {/* Quick options */}
        <div className="grid grid-cols-3 gap-3">
          {donationOptions.map((option) => (
            <button
              key={option.children}
              onClick={() => {
                setSelectedOption(option.children);
                setCustomAmount("");
              }}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                selectedOption === option.children && !customAmount
                  ? "border-secondary bg-secondary/10"
                  : "border-border/50 hover:border-secondary/50"
              } ${option.highlight ? "ring-2 ring-secondary/20" : ""}`}
            >
              <Users className={`h-5 w-5 mx-auto mb-1 ${
                selectedOption === option.children && !customAmount
                  ? "text-secondary"
                  : "text-muted-foreground"
              }`} />
              <p className="font-bold">${option.children * COST_PER_CHILD}</p>
              <p className="text-xs text-muted-foreground">{option.label}</p>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Or enter custom amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              placeholder={COST_PER_CHILD.toString()}
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedOption(null);
              }}
              className="pl-8"
              min={COST_PER_CHILD}
            />
          </div>
          {customAmount && childrenCount > 0 && (
            <p className="text-sm text-muted-foreground">
              This will fund education for <span className="font-bold text-secondary">{childrenCount}</span> {childrenCount === 1 ? 'child' : 'children'}
            </p>
          )}
        </div>

        {/* Donate button */}
        <Button
          onClick={handleDonate}
          disabled={loading || totalAmount < COST_PER_CHILD}
          className="w-full gradient-secondary text-secondary-foreground font-semibold text-lg py-6"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Heart className="mr-2 h-5 w-5" />
              Donate ${totalAmount} - Fund {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          100% of donations go directly to education programs in Africa & India
        </p>
      </CardContent>
    </Card>
  );
}

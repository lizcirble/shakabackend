import { usePrivy } from "@privy-io/react-auth";
import { Button } from "./button";
import { ArrowRightIcon } from "../icons/DataRandIcons";


interface SignUpButtonProps {
  selectedRole: "worker" | "client" | null;
}

export default function SignUpButton({ selectedRole }: SignUpButtonProps) {
  const { login } = usePrivy();

  return (
    <Button onClick={login} disabled={!selectedRole} className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base group">
      Sign Up
      <ArrowRightIcon size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
    </Button>
  );
}

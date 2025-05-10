import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

interface AvatarPlaceholderProps {
  src?: string;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const AvatarPlaceholder = ({
  src,
  name = "User",
  className = "",
  size = "md",
}: AvatarPlaceholderProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default AvatarPlaceholder;

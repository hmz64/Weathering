import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface WeatherIconProps extends LucideProps {
  name: string;
}

export function WeatherIcon({ name, ...props }: WeatherIconProps) {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Cloud {...props} />;
  return <IconComponent {...props} />;
}

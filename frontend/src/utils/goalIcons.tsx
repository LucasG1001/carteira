import type { ComponentType } from 'react';
import {
  Plane,
  Shield,
  Laptop,
  Home,
  Car,
  GraduationCap,
  Heart,
  Gift,
  PiggyBank,
  Smartphone,
  Baby,
  Dumbbell,
} from 'lucide-react';

type IconComponent = ComponentType<{ size?: number | string; className?: string }>;

export const GOAL_ICONS: { key: string; label: string; Icon: IconComponent }[] = [
  { key: 'piggy-bank', label: 'Cofrinho', Icon: PiggyBank },
  { key: 'plane', label: 'Viagem', Icon: Plane },
  { key: 'shield', label: 'Reserva', Icon: Shield },
  { key: 'laptop', label: 'Eletrônicos', Icon: Laptop },
  { key: 'home', label: 'Casa', Icon: Home },
  { key: 'car', label: 'Carro', Icon: Car },
  { key: 'graduation-cap', label: 'Estudos', Icon: GraduationCap },
  { key: 'heart', label: 'Saúde', Icon: Heart },
  { key: 'gift', label: 'Presente', Icon: Gift },
  { key: 'smartphone', label: 'Celular', Icon: Smartphone },
  { key: 'baby', label: 'Filhos', Icon: Baby },
  { key: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
];

const ICON_MAP = new Map(GOAL_ICONS.map((item) => [item.key, item.Icon]));

export function resolveGoalIcon(key: string | null): IconComponent {
  return (key && ICON_MAP.get(key)) || PiggyBank;
}

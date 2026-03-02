import { Utensils, Car, ShoppingBag, Zap, Home as HomeIcon, Film, DollarSign } from 'lucide-react-native';

export const getCategoryIcon = (categoryName: string) => {
  switch(categoryName.toLowerCase()) {
    case 'food':
    case 'food & dining': return Utensils;
    case 'transport': return Car;
    case 'shopping': return ShoppingBag;
    case 'utilities': return Zap;
    case 'home': return HomeIcon;
    case 'entertainment': return Film;
    case 'demo':
    case 'dummy': return Zap;
    default: return DollarSign;
  }
};

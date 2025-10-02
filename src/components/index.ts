/**
 * Component Library Index
 *
 * This file provides a centralized export point for all UI components
 * organized by category for better maintainability and consistency.
 */

// ===== CORE UI COMPONENTS (shadcn/ui based) =====
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Label } from './ui/label';
export { Textarea } from './ui/textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
export { Checkbox } from './ui/checkbox';
export { Slider } from './ui/slider';

// ===== LAYOUT COMPONENTS =====
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
export { Separator } from './ui/separator';

// ===== FEEDBACK COMPONENTS =====
export { Badge } from './ui/badge';
export { Skeleton } from './ui/skeleton';
export { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose, ToastAction } from './ui/toast';
export { Toaster } from './ui/toaster';

// ===== NAVIGATION COMPONENTS =====
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

// ===== MEDIA COMPONENTS =====
export { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

// ===== FORM COMPONENTS =====
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';

// ===== ADVANCED COMPONENTS =====
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

// ===== APARTMENT-SPECIFIC COMPONENTS =====
export { SearchBar } from './SearchBar';
export { ApartmentCard } from './ApartmentCard';
export { ResultsList } from './ResultsList';
export { GlossaryTooltip } from './GlossaryTooltip';

// ===== LAYOUT COMPONENTS =====
export { Header } from './Header';
export { Footer } from './Footer';

// ===== COMPONENT TYPES =====
export type { Apartment, SearchFilters, PopularArea, Facility } from '../types/apartment';
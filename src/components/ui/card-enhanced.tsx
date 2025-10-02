/**
 * Enhanced Card Component
 *
 * Extends the base shadcn Card with apartment-specific variants,
 * interactive states, and specialized layouts for property listings.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border",
        apartment: "border hover:shadow-lg hover:border-primary/30 cursor-pointer",
        featured: "border-primary/50 bg-primary/5 shadow-md",
        premium: "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-md",
        comparison: "border-blue-200 bg-blue-50/50",
        outline: "border-2 border-dashed border-border hover:border-primary/50",
        ghost: "border-transparent shadow-none bg-transparent",
        elevated: "shadow-lg border-border",
      },
      size: {
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
      },
      interactive: {
        none: "",
        hover: "hover:shadow-md hover:-translate-y-1",
        click: "hover:shadow-md hover:-translate-y-1 active:translate-y-0 active:shadow-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: "none",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, interactive, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }
>(({ className, as: Component = "h3", ...props }, ref) => (
  <Component
    ref={ref as any}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Apartment-Specific Card Components

export interface ApartmentCardWrapperProps extends Omit<CardProps, 'interactive'> {
  featured?: boolean
  premium?: boolean
  interactive?: boolean
}

const ApartmentCardWrapper = React.forwardRef<HTMLDivElement, ApartmentCardWrapperProps>(
  ({ featured, premium, interactive = true, className, ...props }, ref) => {
    let variant: "default" | "apartment" | "featured" | "premium" = "apartment";

    if (premium) variant = "premium";
    else if (featured) variant = "featured";

    return (
      <Card
        ref={ref}
        variant={variant}
        interactive={interactive ? "hover" : "none"}
        className={className}
        {...props}
      />
    );
  }
)
ApartmentCardWrapper.displayName = "ApartmentCardWrapper"

const ComparisonCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="comparison"
      size="default"
      className={className}
      {...props}
    />
  )
)
ComparisonCard.displayName = "ComparisonCard"

const FeatureCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="elevated"
      interactive="hover"
      className={cn("text-center", className)}
      {...props}
    />
  )
)
FeatureCard.displayName = "FeatureCard"

const StatsCard = React.forwardRef<
  HTMLDivElement,
  CardProps & { value: string | number; label: string; trend?: "up" | "down" | "neutral" }
>(({ className, value, label, trend, ...props }, ref) => (
  <Card
    ref={ref}
    variant="default"
    size="default"
    className={cn("text-center", className)}
    {...props}
  >
    <CardContent className="pt-6">
      <div className="flex flex-col items-center space-y-2">
        <div className={cn(
          "text-2xl font-bold",
          trend === "up" && "text-green-600",
          trend === "down" && "text-red-600",
          trend === "neutral" && "text-blue-600"
        )}>
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
))
StatsCard.displayName = "StatsCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  ApartmentCardWrapper,
  ComparisonCard,
  FeatureCard,
  StatsCard,
  cardVariants,
}
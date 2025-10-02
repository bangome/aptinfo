/**
 * Enhanced Input Component
 *
 * Extends the base shadcn Input with apartment-specific variants,
 * icons, validation states, and search functionality.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Search, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"

const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        search: "border-primary/30 focus-visible:ring-primary pl-10",
        filter: "border-border focus-visible:ring-primary/50"
      },
      size: {
        default: "h-9 px-3 py-1",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-11 px-4 py-2 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  helperText?: string
  errorText?: string
  successText?: string
  isPassword?: boolean
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    type,
    icon,
    iconPosition = "left",
    helperText,
    errorText,
    successText,
    isPassword = false,
    showPasswordToggle = false,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    // Determine actual type and variant based on state
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;
    const actualVariant = errorText ? "error" : successText ? "success" : variant;

    // Auto-detect search functionality
    const isSearchInput = variant === "search" || type === "search" || props.placeholder?.includes("검색");
    const hasLeftIcon = icon || isSearchInput;
    const hasRightIcon = iconPosition === "right" || (isPassword && showPasswordToggle) || errorText || successText;

    return (
      <div className="relative w-full">
        {/* Left Icon */}
        {hasLeftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon || (isSearchInput && <Search className="h-4 w-4" />)}
          </div>
        )}

        {/* Input Field */}
        <input
          type={actualType}
          className={cn(
            inputVariants({ variant: actualVariant, size }),
            hasLeftIcon && "pl-10",
            hasRightIcon && "pr-10",
            isFocused && "ring-1 ring-ring",
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {/* Right Icon */}
        {hasRightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            {errorText && <AlertCircle className="h-4 w-4 text-destructive" />}
            {successText && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {iconPosition === "right" && !isPassword && !errorText && !successText && icon}
          </div>
        )}

        {/* Helper/Error/Success Text */}
        {(helperText || errorText || successText) && (
          <div className="mt-1 text-xs">
            {errorText && (
              <span className="text-destructive flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errorText}
              </span>
            )}
            {successText && !errorText && (
              <span className="text-green-600 flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {successText}
              </span>
            )}
            {helperText && !errorText && !successText && (
              <span className="text-muted-foreground">{helperText}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
import React from "react";
import { cn } from "../../utils/cn";

// Button Component
export const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      children,
      disabled,
      loading,
      icon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
      primary:
        "bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg focus:ring-primary-500",
      secondary:
        "bg-secondary-600 hover:bg-secondary-700 text-white shadow-md hover:shadow-lg focus:ring-secondary-500",
      outline:
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
      ghost: "text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500",
      success:
        "bg-success-600 hover:bg-success-700 text-white shadow-md hover:shadow-lg focus:ring-success-500",
      danger:
        "bg-danger-600 hover:bg-danger-700 text-white shadow-md hover:shadow-lg focus:ring-danger-500",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm h-9",
      md: "px-4 py-2.5 text-base h-11",
      lg: "px-6 py-3 text-lg h-12",
      xl: "px-8 py-4 text-xl h-14",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="w-4 h-4 mr-2 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Card Component
export const Card = React.forwardRef(
  ({ className, children, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-2xl shadow-card border border-neutral-200/50 transition-all duration-200",
          hover && "hover:shadow-card-hover hover:-translate-y-1",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Input Component
export const Input = React.forwardRef(
  ({ className, type = "text", label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-400 text-sm">{icon}</span>
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full px-4 py-3 text-base border border-neutral-300 rounded-xl bg-white/80 backdrop-blur-sm placeholder-neutral-400 transition-all duration-200",
              "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-10",
              error &&
                "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// Badge Component
export const Badge = ({
  children,
  variant = "default",
  className,
  ...props
}) => {
  const variants = {
    default: "bg-neutral-100 text-neutral-800",
    primary: "bg-primary-100 text-primary-800",
    secondary: "bg-secondary-100 text-secondary-800",
    success: "bg-success-100 text-success-800",
    danger: "bg-danger-100 text-danger-800",
    warning: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Loading Skeleton Component
export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200", className)}
      {...props}
    />
  );
};

// Price Change Component
export const PriceChange = ({ value, className, ...props }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-lg text-sm font-semibold",
        isPositive && "text-success-700 bg-success-50",
        isNegative && "text-danger-700 bg-danger-50",
        value === 0 && "text-neutral-700 bg-neutral-50",
        className
      )}
      {...props}
    >
      {isPositive && "+"}
      {value.toFixed(2)}%
    </span>
  );
};

// Bottom Sheet Component for mobile and modal for desktop
export const BottomSheet = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Mobile Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 transform transition-transform duration-200 md:hidden">
        <div className="p-4">
          <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
          {title && (
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 text-center">
              {title}
            </h3>
          )}
          {children}
        </div>
      </div>

      {/* Desktop Modal */}
      <div
        className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {title && (
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">
                {title}
              </h3>
            )}
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

// Mobile Tab Bar Item
export const TabBarItem = ({ icon, label, isActive, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 relative",
        isActive
          ? "text-primary-600 bg-primary-50"
          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
      )}
    >
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger-500 rounded-full" />
        )}
      </div>
      <span className="text-xs font-medium mt-1">{label}</span>
    </button>
  );
};

// Glass effect container
export const GlassCard = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-white/80 border border-white/20 rounded-2xl shadow-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  isSameDay,
} from "date-fns";
import { Calendar as CalendarIcon, X, Check } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  align?: "start" | "center" | "end";
}

interface Preset {
  label: string;
  getRange: () => DateRange | undefined;
}

const PRESETS: Preset[] = [
  {
    label: "All Time",
    getRange: () => undefined,
  },
  {
    label: "Today",
    getRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    },
  },
  {
    label: "Last 7 Days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 Days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This Month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last Month",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "This Year",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
  placeholder = "Filter by date...",
  align = "start",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(value);

  // Sync draftRange whenever popover opens or external value changes
  useEffect(() => {
    if (isOpen) {
      setDraftRange(value);
    }
  }, [isOpen, value]);

  const isPresetActive = (preset: Preset) => {
    const range = preset.getRange();
    if (!range && !value?.from && !value?.to) return true;
    if (!range || !value?.from || !value?.to) return false;
    return (
      isSameDay(range.from!, value.from) &&
      range.to &&
      value.to &&
      isSameDay(range.to, value.to)
    );
  };

  const handleSelectPreset = (preset: Preset) => {
    const range = preset.getRange();
    onChange?.(range);
    setIsOpen(false);
  };

  const handleApplyDraft = () => {
    if (!draftRange?.from) {
      onChange?.(undefined);
    } else {
      const from = startOfDay(draftRange.from);
      const to = draftRange.to ? endOfDay(draftRange.to) : endOfDay(draftRange.from);
      onChange?.({ from, to });
    }
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDraftRange(undefined);
    onChange?.(undefined);
    setIsOpen(false);
  };

  const hasValue = Boolean(value?.from || value?.to);

  return (
    <div className={cn("inline-flex items-center", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 justify-between text-left font-normal text-xs rounded-xl px-3 border-slate-200 dark:border-slate-800 bg-background hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-xs group w-full",
              !hasValue && "text-muted-foreground",
              hasValue && "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 font-medium text-foreground"
            )}
          >
            <div className="flex items-center truncate mr-1.5">
              <CalendarIcon className="mr-2 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[260px]">
                {value?.from ? (
                  value.to ? (
                    isSameDay(value.from, value.to) ? (
                      format(value.from, "MMM d, yyyy")
                    ) : (
                      <>
                        {format(value.from, "MMM d, yyyy")} –{" "}
                        {format(value.to, "MMM d, yyyy")}
                      </>
                    )
                  ) : (
                    format(value.from, "MMM d, yyyy")
                  )
                ) : (
                  placeholder
                )}
              </span>
            </div>

            {/* Embedded clear icon */}
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date range"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear();
                  }
                }}
                className="ml-auto -mr-1 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground hover:text-rose-600 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
                title="Clear date range"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-popover overflow-hidden z-50"
          align={align}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Presets Sidebar */}
            <div className="flex flex-row sm:flex-col gap-1 p-2.5 sm:w-36 bg-slate-50/70 dark:bg-slate-900/60 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 overflow-x-auto sm:overflow-x-visible">
              <div className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Presets
              </div>
              {PRESETS.map((preset) => {
                const active = isPresetActive(preset);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      "text-xs px-2.5 py-1.5 rounded-lg text-left whitespace-nowrap transition-colors font-medium shrink-0 cursor-pointer",
                      active
                        ? "bg-emerald-600 text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Calendar & Custom Selection */}
            <div className="flex flex-col p-2 sm:p-3">
              <Calendar
                mode="range"
                defaultMonth={draftRange?.from || value?.from || new Date()}
                selected={draftRange}
                onSelect={(range) => setDraftRange(range)}
                numberOfMonths={1}
              />

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between pt-2.5 px-1 border-t border-slate-100 dark:border-slate-800 gap-2">
                <div className="text-[11px] text-muted-foreground truncate max-w-[150px] sm:max-w-[180px]">
                  {draftRange?.from ? (
                    draftRange.to ? (
                      isSameDay(draftRange.from, draftRange.to) ? (
                        format(draftRange.from, "MMM d, yyyy")
                      ) : (
                        `${format(draftRange.from, "MMM d")} - ${format(draftRange.to, "MMM d, yyyy")}`
                      )
                    ) : (
                      `${format(draftRange.from, "MMM d")} (choose end)`
                    )
                  ) : (
                    "Select range"
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(draftRange?.from || hasValue) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClear()}
                      className="h-7 text-xs px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraftRange(value);
                      setIsOpen(false);
                    }}
                    className="h-7 text-xs px-2 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!draftRange?.from}
                    onClick={handleApplyDraft}
                    className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

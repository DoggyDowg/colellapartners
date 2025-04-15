import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';

interface SettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (settlementDate: Date, notes?: string) => void;
  onCancel: () => void;
  // referralId: string; // Not used in this component
}

export function SettlementDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  // referralId, // Not used in this component
}: SettlementDialogProps) {
  const [settlementDate, setSettlementDate] = useState<Date | undefined>(
    // Default to 30 days from now
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleConfirm = () => {
    if (settlementDate) {
      onConfirm(settlementDate, notes.trim() || undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settlement Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="settlement-date" className="font-medium">
              Settlement Date <span className="text-red-500">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="settlement-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !settlementDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {settlementDate ? (
                    format(settlementDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={settlementDate}
                  onSelect={(date) => {
                    setSettlementDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            
            {/* Quick select buttons for common settlement periods */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-1 h-7 text-xs"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 30);
                  setSettlementDate(date);
                }}
              >
                30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-1 h-7 text-xs"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 60);
                  setSettlementDate(date);
                }}
              >
                60 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-1 h-7 text-xs"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 90);
                  setSettlementDate(date);
                }}
              >
                90 days
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes" className="font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any details about the settlement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleConfirm}
            disabled={!settlementDate}
            variant="default"
          >
            Save Settlement Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SetlistDialog({ open, onOpenChange, onSave, setlist = null }) {
  const [name, setName] = useState(setlist?.name || "");
  const [description, setDescription] = useState(setlist?.description || "");
  const [eventDate, setEventDate] = useState(setlist?.event_date || "");
  const [venue, setVenue] = useState(setlist?.venue || "");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a setlist name');
      return;
    }

    if (name.length > 100) {
      toast.error('Setlist name is too long (max 100 characters)');
      return;
    }

    if (description && description.length > 500) {
      toast.error('Description is too long (max 500 characters)');
      return;
    }

    onSave({
      name,
      description,
      event_date: eventDate,
      venue,
      chart_ids: setlist?.chart_ids || []
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>{setlist ? 'Edit Setlist' : 'New Setlist'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Setlist Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sunday Service, Concert, etc."
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white mt-2"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this setlist..."
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white mt-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Date</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white mt-2"
              />
            </div>
            <div>
              <Label>Venue</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Location name"
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white mt-2"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {setlist ? 'Save Changes' : 'Create Setlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
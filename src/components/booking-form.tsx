"use client";

import { useState } from "react";
import { createBooking } from "@/lib/actions/bookings";
import { inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function BookingForm({
  arenas,
  liveries,
}: {
  arenas: { id: string; name: string }[];
  liveries?: { id: string; name: string }[];
}) {
  const [recurring, setRecurring] = useState(false);

  return (
    <form action={createBooking} className="space-y-3">
      {liveries && (
        <label className="block">
          <span className={labelClass}>Book on behalf of</span>
          <select name="liveryId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Select a livery…
            </option>
            {liveries.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className={labelClass}>Arena</span>
        <select name="arenaId" required className={inputClass}>
          {arenas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Date</span>
        <input type="date" name="date" required className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>Start</span>
          <input type="time" name="startTime" required className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>End</span>
          <input type="time" name="endTime" required className={inputClass} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isRecurring"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-600"
        />
        <span>Repeat weekly (needs admin approval)</span>
      </label>

      {recurring && (
        <label className="block">
          <span className={labelClass}>How many weeks?</span>
          <input
            type="number"
            name="recurrenceWeeks"
            min={1}
            max={52}
            defaultValue={4}
            className={inputClass}
          />
        </label>
      )}

      <textarea
        name="notes"
        rows={2}
        placeholder="Notes (optional)"
        className={inputClass}
      />

      <SubmitButton pendingText="Requesting…">Request booking</SubmitButton>
      <p className="text-xs text-gray-400">
        Non-overlapping one-off bookings are confirmed instantly. Clashes and
        recurring bookings wait for admin approval.
      </p>
    </form>
  );
}

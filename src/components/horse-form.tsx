import { Field, TextArea, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type BarnWithBoxes = {
  id: string;
  name: string;
  boxes: { id: string; number: string }[];
};

type HorseDefaults = {
  id?: string;
  name?: string;
  age?: number | null;
  sex?: string | null;
  height?: string | null;
  color?: string | null;
  vetName?: string | null;
  vetPhone?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  notes?: string | null;
  boxId?: string | null;
};

export function HorseForm({
  action,
  barns,
  liveries,
  defaultLiveryId,
  horse,
  submitLabel = "Save horse",
}: {
  action: (formData: FormData) => void;
  barns: BarnWithBoxes[];
  liveries?: { id: string; name: string }[];
  defaultLiveryId?: string;
  horse?: HorseDefaults;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {horse?.id && <input type="hidden" name="id" value={horse.id} />}

      {liveries && (
        <label className="block">
          <span className={labelClass}>
            Owner (livery account) <span className="text-red-500">*</span>
          </span>
          <select
            name="liveryId"
            required
            defaultValue={defaultLiveryId ?? ""}
            className={inputClass}
          >
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

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" name="name" required defaultValue={horse?.name} />
        <Field label="Age (years)" name="age" type="number" defaultValue={horse?.age ?? undefined} />
        <Field label="Sex" name="sex" defaultValue={horse?.sex} placeholder="Mare / Gelding / Stallion" />
        <Field label="Height" name="height" defaultValue={horse?.height} placeholder="e.g. 16.2hh" />
        <Field label="Colour" name="color" defaultValue={horse?.color} />
        <label className="block">
          <span className={labelClass}>Stable / box</span>
          <select name="boxId" defaultValue={horse?.boxId ?? ""} className={inputClass}>
            <option value="">— Unassigned —</option>
            {barns.map((b) => (
              <optgroup key={b.id} label={b.name}>
                {b.boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {b.name} · {box.number}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Vet name" name="vetName" defaultValue={horse?.vetName} />
        <Field label="Vet phone" name="vetPhone" defaultValue={horse?.vetPhone} />
        <Field label="Emergency contact" name="emergencyContact" defaultValue={horse?.emergencyContact} />
        <Field label="Emergency phone" name="emergencyPhone" defaultValue={horse?.emergencyPhone} />
      </div>

      <TextArea label="Notes" name="notes" defaultValue={horse?.notes} rows={4} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

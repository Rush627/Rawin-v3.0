"use client";

import { Group } from "./fields";
import { StringListEditor } from "./ListEditor";
import CardSave from "./CardSave";
import { useSectionEditor } from "./useSectionEditor";

/**
 * Category list for projects or articles. Categories already used by a record stay valid even
 * when removed here; they just stop being offered for new records.
 */
export default function CategoriesCard({ kind, initial, inUse }: { kind: "projectCategories" | "blogCategories"; initial: string[]; inUse: string[] }) {
  const ed = useSectionEditor("taxonomy", { [kind]: initial } as Record<string, string[]>);
  const items = ed.values[kind] as string[];
  const orphans = inUse.filter((c) => !items.some((i) => i.toLowerCase() === c.toLowerCase()));
  return (
    <Group title="Categories" description={kind === "projectCategories" ? "Offered when editing a project and used by the projects filter." : "Offered when editing an article."} defaultOpen={false}>
      <StringListEditor label="Categories" items={items} onChange={(x) => ed.set(kind, x)} max={40} maxLength={50} error={ed.errors[kind]} addLabel="Add category" />
      {orphans.length > 0 && <p className="text-[12.5px] text-fg-subtle">Also in use (not listed): {orphans.join(", ")}</p>}
      <CardSave state={ed.state} message={ed.message} onSave={ed.save} onDiscard={ed.discard} />
    </Group>
  );
}

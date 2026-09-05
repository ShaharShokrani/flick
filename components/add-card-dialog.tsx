"use client";

import { CardFormDialog } from "@/components/card-form-dialog";

type AddCardDialogProps = {
  triggerClassName?: string;
  triggerLabel?: string;
};

export function AddCardDialog({
  triggerClassName,
  triggerLabel = "Add a word",
}: AddCardDialogProps) {
  return (
    <CardFormDialog
      triggerClassName={triggerClassName}
      triggerLabel={triggerLabel}
    />
  );
}

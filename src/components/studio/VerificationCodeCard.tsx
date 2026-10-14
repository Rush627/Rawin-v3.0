"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, Group } from "./fields";
import { updateOrbitVerificationCodeAction, type ContentActionState } from "@/app/saint-denis/content/actions";

/**
 * Rotates the code Orbit asks for before treating someone as the owner. The code is hashed on
 * the server and never shown again; the form clears itself after a successful change.
 */
export default function VerificationCodeCard({ isSet }: { isSet: boolean }) {
  const [state, action, pending] = useActionState<ContentActionState, FormData>(updateOrbitVerificationCodeAction, {});
  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);
  const field =
    "w-full min-h-11 rounded-xl bg-surface border border-line-strong px-3.5 text-[15px] text-fg focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)]";
  return (
    <Group
      title="Owner verification code"
      description={isSet ? "A code is set. Orbit asks for it when someone claims to be you." : "No code is set: Orbit cannot verify you yet."}
      defaultOpen={false}
    >
      <form ref={formRef} action={action} className="flex flex-col gap-4 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vc-new" className="text-[13px] font-medium text-fg">
              New code
            </label>
            <input id="vc-new" name="newCode" type={show ? "text" : "password"} autoComplete="new-password" minLength={4} maxLength={32} required aria-describedby="vc-hint" className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vc-confirm" className="text-[13px] font-medium text-fg">
              Repeat code
            </label>
            <input id="vc-confirm" name="confirmCode" type={show ? "text" : "password"} autoComplete="new-password" minLength={4} maxLength={32} required className={field} />
          </div>
        </div>
        <p id="vc-hint" className="-mt-2 text-[12.5px] text-fg-subtle">
          4 to 32 characters. It is stored only as a hash and cannot be displayed later.
        </p>
        <button type="button" aria-pressed={show} onClick={() => setShow((s) => !s)} className="self-start inline-flex items-center gap-2 min-h-11 text-[13.5px] text-fg-muted hover:text-fg">
          {show ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
          {show ? "Hide" : "Show while typing"}
        </button>
        {state?.error && (
          <p role="alert" className="text-[13px] text-danger">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p role="status" className="text-[13px] text-success">
            {state.message}
          </p>
        )}
        <div className="flex justify-end pt-2 border-t border-line">
          <Button type="submit" tone="primary" busy={pending}>
            {isSet ? "Change code" : "Set code"}
          </Button>
        </div>
      </form>
    </Group>
  );
}

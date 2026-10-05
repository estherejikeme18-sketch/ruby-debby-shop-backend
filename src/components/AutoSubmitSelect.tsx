"use client";

/**
 * A dropdown that submits its own form as soon as the choice changes, so the
 * delivery fee updates without the customer hunting for a "save" button.
 *
 * `e.currentTarget.form?.requestSubmit()` is the built-in way to do this. A
 * visible Update button sits next to it as well, so the page still works if
 * JavaScript is switched off.
 */
export default function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  id,
  ariaDescribedBy,
  invalid,
}: {
  name: string;
  defaultValue: string;
  options: readonly string[];
  id: string;
  ariaDescribedBy?: string;
  invalid?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      aria-describedby={ariaDescribedBy}
      aria-invalid={invalid ? true : undefined}
      onChange={(event) => {
        event.currentTarget.form?.requestSubmit();
      }}
      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8a1538]/30 ${
        invalid ? "border-red-400 bg-red-50" : "border-gray-300"
      }`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
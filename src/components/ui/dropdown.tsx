import {
	Combobox,
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { cn } from "@/lib/utils";

export const dropdownOptionSchema = z.object({
	value: z.string(),
	label: z.string(),
});

export type DropdownOption = z.infer<typeof dropdownOptionSchema>;

interface DropdownProps {
	name: string;
	value: DropdownOption | null;
	onChange: (val: DropdownOption | null) => void;
	options: DropdownOption[];
	placeholder?: string;
	className?: string;
}

export function Dropdown({
	name,
	value,
	onChange,
	options,
	placeholder,
	className,
}: DropdownProps) {
	const [query, setQuery] = useState("");

	const filteredOptions =
		query === ""
			? options
			: options.filter((option) => {
					return option.label.toLowerCase().includes(query.toLowerCase());
				});

	return (
		<Combobox
			value={value}
			virtual={{ options: filteredOptions }}
			onChange={onChange}
			onClose={() => setQuery("")}
		>
			<div className="relative">
				<ComboboxInput
					aria-label={name}
					displayValue={(option: DropdownOption) => option?.label}
					onChange={(event) => setQuery(event.target.value)}
					placeholder={placeholder}
					className={cn(
						"flex h-9 w-full overflow-ellipsis rounded-md border border-gray-400 bg-white px-3 py-1 pr-10 text-base text-black outline-none transition-[color,box-shadow] focus-visible:border-mcmaster-yellow focus-visible:shadow-[0_0_0_3px_rgba(253,191,87,0.3)] md:text-sm",
						className,
					)}
				/>
				<ComboboxButton className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-2">
					<ChevronDown className="rounded-md text-mcmaster-maroon" />
				</ComboboxButton>
			</div>
			<ComboboxOptions
				anchor="bottom"
				className="no-scrollbar mt-2 max-h-60 w-(--input-width) overflow-y-auto rounded-md border bg-white p-2 empty:invisible"
			>
				{({ option }) => (
					<ComboboxOption
						value={option}
						key={option.value}
						className="w-full cursor-pointer rounded-md p-2 data-focus:bg-blue-100"
					>
						{option.label}
					</ComboboxOption>
				)}
			</ComboboxOptions>
		</Combobox>
	);
}

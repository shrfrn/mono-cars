import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

export type SortBy<T> = {
	sortField?: T,
	sortDir: 1 | -1,
}

export type ColumnDef<T extends string> = {
	field: T,
	label: string,
	sortable?: boolean, // false for columns you don't want clickable
}


export type ColumnHeadingsProps<T extends string> = {
	columns: ColumnDef<T>[],
	sortBy: SortBy<T>,
	onSort: (field: T) => void,
}

export function ColumnHeadings<T extends string>({ columns, sortBy, onSort }: ColumnHeadingsProps<T>) {
	return (
		<>
			{columns.map(column => 
				<ColumnHeading 
					key={column.field}
					field={column.field}
					label={column.label}
					sortField={sortBy.sortField}
					sortDir={sortBy.sortDir}
					onSort={onSort} />)}	
		</>
	)
}

export type ColumnHeadingProps<T> = {
	field: T,
	label: string,
	sortField?: T,
	sortDir: 1 | -1,
	onSort: (field: T) => void,
	sortable?: boolean,
}

export function ColumnHeading<T extends string>({field, label, sortField, sortDir, onSort, sortable = true }: ColumnHeadingProps<T>) {
	const isActive = sortField === field

	return <Button variant="ghost" className="flex justify-start items-center gap-6 cursor-pointer" onClick={() => { return sortable && onSort(field) }}>
		<span>{label}</span>
		{isActive && sortDir === 1 && <ChevronUp size={16} />}
		{isActive && sortDir === -1 && <ChevronDown size={16} />}
		{/* <Separator orientation="vertical"/> */}
	</Button>
}
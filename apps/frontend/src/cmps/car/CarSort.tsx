import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type CarQueryOptions } from '@cars/shared'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { useEffect, useState } from "react";

export type CarFilterProps = {
    queryOptions: CarQueryOptions,
    setQueryOptions: (options: CarQueryOptions) => void,
	label?: string,
}

export function CarSort({ queryOptions, setQueryOptions, label }: CarFilterProps) {
    const [ queryOptionsToEdit, setQueryOptionsToEdit ] = useState<CarQueryOptions>(queryOptions)
    const { sortBy } = queryOptionsToEdit

    useEffect(() => {
        setQueryOptions(queryOptionsToEdit)
    }, [queryOptionsToEdit])

    function onSetSortField(values) {
		const sortField = values[0]

        setQueryOptionsToEdit(prev => { 
            const sortBy = { ...prev.sortBy, sortDir: prev.sortBy?.sortDir || 1, sortField: values[0] }
			if (!sortField) delete sortBy.sortField
            return { ...prev, sortBy }
        })
    }

	function onSetSortDir(values) {
		const sortDir = values[0] ? values[0] : 1

        setQueryOptionsToEdit(prev => {
            const { sortBy } = prev
            return { ...prev, sortBy: { ...sortBy, sortDir }}
		})
	}

    return <div className="query-options flex gap-2 items-center">
		<fieldset>
			{label && <legend>
				<span className="text-xs text-muted-foreground">Sort</span>
			</legend>}
			<div className="sort-by flex gap-2">
				<ToggleGroup 
					variant='outline' 
					spacing={0}
					value={sortBy?.sortField ? [sortBy.sortField] : []}
					onValueChange={onSetSortField}>
						<ToggleGroupItem value='make'>Make</ToggleGroupItem>
						<ToggleGroupItem value='maxSpeed'>Speed</ToggleGroupItem>
				</ToggleGroup>

				<ToggleGroup 
					variant='outline' 
					spacing={0}
					value={sortBy?.sortDir ? [String(sortBy.sortDir)] : []}
					onValueChange={onSetSortDir}>
						<ToggleGroupItem value='1'><ArrowUpNarrowWide /></ToggleGroupItem>
						<ToggleGroupItem value='-1'><ArrowDownWideNarrow /></ToggleGroupItem>
				</ToggleGroup>
			</div>
		</fieldset>
    </div>
}
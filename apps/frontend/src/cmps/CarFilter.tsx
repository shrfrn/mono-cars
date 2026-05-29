import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CarTypeSchema, type CarQueryOptions, type CarType } from '@cars/shared'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { useEffect, useState } from "react";

export type CarFilterProps = {
    queryOptions: CarQueryOptions,
    setQueryOptions: (options: CarQueryOptions) => void,
}

export function CarFilter({ queryOptions, setQueryOptions }: CarFilterProps) {
    const [ queryOptionsToEdit, setQueryOptionsToEdit ] = useState<CarQueryOptions>(queryOptions)
    const { filterBy, sortBy } = queryOptionsToEdit

    useEffect(() => {
        setQueryOptions(queryOptionsToEdit)
    }, [queryOptionsToEdit])

    function onSetQueryOptions({ target }: React.ChangeEvent<HTMLInputElement>) {
        const { type, name, value } = target
        
        setQueryOptionsToEdit(prev => { 
            const filterBy = { ...prev.filterBy, [name]: type === 'text' ? value : +value }
            return { ...prev, filterBy }
        })
    }

    function onSetCarType(value: CarType) {
		setQueryOptionsToEdit(prev => { 
			const filterBy = { ...prev.filterBy, type: value }
			if (!value) delete filterBy.type

            return { ...prev, filterBy }
        })
}

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
        <fieldset className='mr-6'>
			<legend>
				<span className="text-xs text-muted-foreground">Filter</span>
			</legend>
			<div className="filter-by flex gap-2">
				<Input
					value={filterBy?.txt}
					onChange={onSetQueryOptions}
					type="text"
					name="txt"
					placeholder="search by make"/>
				
				<Input
					value={filterBy?.minSpeed || ''}
					onChange={onSetQueryOptions}
					type="number"
					name="minSpeed"
					placeholder="min. speed"/>
				
				<Select
					value={filterBy?.type ?? ''}
					onValueChange={onSetCarType}>
								<SelectTrigger className="w-full max-w-48">
									<SelectValue placeholder="Select Car Type"/>
								</SelectTrigger>
								<SelectContent alignItemWithTrigger={false}>
									<SelectGroup>
										<SelectItem value="">Select Car Type</SelectItem>
										{CarTypeSchema.options.map(type => 
											<SelectItem value={type} key={type}>{type}</SelectItem>)}
									</SelectGroup>
								</SelectContent>
				</Select>
			</div>
		</fieldset>
		<fieldset>
			<legend>
				<span className="text-xs text-muted-foreground">Sort</span>
			</legend>
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
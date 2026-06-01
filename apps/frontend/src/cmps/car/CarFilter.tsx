import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CarTypeSchema, type CarQueryOptions, type CarType } from '@cars/shared'
import { useEffect, useState } from "react";

export type CarFilterProps = {
    queryOptions: CarQueryOptions,
    setQueryOptions: (options: CarQueryOptions) => void,
	label?: string,
}

export function CarFilter({ queryOptions, setQueryOptions, label }: CarFilterProps) {
    const [ queryOptionsToEdit, setQueryOptionsToEdit ] = useState<CarQueryOptions>(queryOptions)
    const { filterBy } = queryOptionsToEdit

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

    return <div className="query-options flex gap-2 items-center">
        <fieldset className='mr-6'>
			{label && <legend>
				<span className="text-xs text-muted-foreground">Filter</span>
			</legend>}
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
    </div>
}
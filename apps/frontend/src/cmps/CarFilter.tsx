import { CarTypeSchema, type CarQueryOptions, type CarSortField, type CarType } from '@cars/shared'
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

    function onSetCarType(ev: React.ChangeEvent<HTMLSelectElement>) {
        const value = ev.target.value ? ev.target.value as CarType : undefined

        setQueryOptionsToEdit(prev => { 
            const filterBy = { ...prev.filterBy, type: value }
            return { ...prev, filterBy }
        })
}

    function onSetSortField(ev: React.ChangeEvent<HTMLSelectElement>) {
        const value = ev.target.value ? ev.target.value as CarSortField : undefined

        setQueryOptionsToEdit(prev => { 
            const sortBy = { ...prev.sortBy, sortDir: prev.sortBy?.sortDir || 1, sortField: value }
            return { ...prev, sortBy }
        })
    }

    function onToggleSortDir() {
        setQueryOptionsToEdit(prev => {
            const { sortBy } = prev
            const sortDir = sortBy?.sortDir === 1 ? -1 : 1
            
            return { ...prev, sortBy: { ...sortBy, sortDir }}
        })
    }

    return <div className="query-options">
        <input 
            value={filterBy?.txt}
            onChange={onSetQueryOptions}
            type="text" 
            name="txt"
            placeholder="search by make"/>
            
        <input 
            value={filterBy?.minSpeed}
            onChange={onSetQueryOptions}
            type="number" 
            name="minSpeed"
            placeholder="min. speed"/>
            
        <select
            value={filterBy?.type}
            onChange={onSetCarType}>

                <option value="">select car type</option>
                {CarTypeSchema.options.map(type => 
                    <option value={type} key={type}>{type}</option>)}
        </select>
            
        <select
            value={sortBy?.sortField}
            onChange={onSetSortField}>

                <option value="">select sort field</option>
                <option value="make">make</option>
                <option value="maxSpeed">maxSpeed</option>
        </select>

        <label htmlFor="sort-dir">Descending</label>
        <input 
            checked={sortBy?.sortDir === -1}
            onChange={onToggleSortDir}
            id="sort-dir"
            name="sortDir"
            type="checkbox" />

    </div>
}
import { useEffect, useState } from "react";
import { type ReviewQueryOptions, type ReviewSort } from '@cars/shared'

export type ReviewFilterProps = {
    queryOptions: ReviewQueryOptions,
    setQueryOptions: (options: ReviewQueryOptions) => void,
}

export function ReviewFilter({ queryOptions, setQueryOptions }: ReviewFilterProps) {
    const [ queryOptionsToEdit, setQueryOptionsToEdit ] = useState<ReviewQueryOptions>(queryOptions)
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

    function onSetSortField(ev: React.ChangeEvent<HTMLSelectElement>) {
        const value = ev.target.value ? ev.target.value as ReviewSort['sortField'] : undefined

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
            value={filterBy?.minRating}
            onChange={onSetQueryOptions}
            type="number" 
            name="minRating"
			min="1" max="5"
            placeholder="min. speed"/>
            
        <select
            value={sortBy?.sortField}
            onChange={onSetSortField}>

                <option value="">select sort field</option>
                <option value="rating">rating</option>
                <option value="fullname">fullname</option>
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
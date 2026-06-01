import { useState } from "react"
import { UserAvatar } from "../UserAvatar"
import { Badge } from "@/components/ui/badge"

import type { CarPublic, UserProfile, UserPublic } from "@cars/shared"
import { CarTypeBadge } from "../car/CarTypeBadge"
import { ColumnHeadings, type ColumnDef, type SortBy } from "../ColumnHeadings"

type SortField = 'make' | 'maxSpeed' | 'type' | 'fullname' | 'role'

const LIKES_COLUMNS: ColumnDef<SortField>[] = [
	{ field: 'make', label: 'Make' },
	{ field: 'maxSpeed', label: 'Speed' },
	{ field: 'type', label: 'Type' },
	{ field: 'fullname', label: 'Owner' },
	{ field: 'role', label: 'Role' },
]

type Props = {
	likedCars: UserProfile['likedCars'],
}

export function UserProfileLikes({ likedCars }: Props) {
	const [ sortBy, setSortBy ] = useState<SortBy<SortField>>({ sortDir: 1 })

	function onSort(sortField: SortField) {
		if (sortField === sortBy.sortField) setSortBy(prev => ({ sortField, sortDir: prev.sortDir === 1 ? -1 : 1 }))
		else setSortBy({ sortField, sortDir: 1 })
	}

	function sort() {
		if (!sortBy.sortField) return likedCars

		switch (sortBy.sortField) {
			case 'make':
			case 'type':
				return likedCars.toSorted((a, b) => (a[sortBy.sortField].localeCompare(b[sortBy.sortField]) * sortBy.sortDir))
		
			case 'fullname':
			case 'role':
				return likedCars.toSorted((a, b) => (a.owner[sortBy.sortField].localeCompare(b.owner[sortBy.sortField]) * sortBy.sortDir))

			case 'maxSpeed':
				return likedCars.toSorted((a, b) => (a.maxSpeed - b.maxSpeed) * sortBy.sortDir)
		}
	}

	const sorted = sort()
	return (
		<div className="liked-cars grid grid-cols-5 content-start gap-x-1 w-5/6 h-[31vh] m-auto overflow-scroll">

			<div className="column-headings sticky top-0 z-10 grid grid-cols-subgrid items-center col-span-5 py-1.5 bg-white border-be">
				<ColumnHeadings 
					columns={LIKES_COLUMNS}
					sortBy={sortBy}
					onSort={onSort}/>
			</div>

			{sorted.map(car => 
				<div key={car._id} className="row grid grid-cols-subgrid col-span-5 items-center py-1.5 border-be first:border-bs hover:bg-muted">
					<p className="make text-xl">{car.make}</p>
					<p className="speed flex gap-3 items-center text-xl">
						<span className="basis-[3ch] text-end">{car.maxSpeed}</span> 
						<span className="self-end mbe-0.5 text-sm text-muted-foreground">Kmh</span>	
					</p>
					<CarTypeBadge car={car as CarPublic} variant="outline"/>
					<UserAvatar user={car.owner as UserPublic} />
					<Badge variant="outline">{car.owner.role}</Badge>
				</div>
			)}
		</div>
	)
}

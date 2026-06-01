import { useLayoutEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from "date-fns"

import type { CarPublic, UserProfile, UserPublic } from "@cars/shared"
import { ColumnHeadings, type ColumnDef, type SortBy } from "../ColumnHeadings"
import { CarTypeBadge } from "../car/CarTypeBadge"
import { UserAvatar } from "../UserAvatar"


type SortField = 'make' | 'maxSpeed' | 'type' | 'fullname' | 'createdAt'

const COMMENTS_COLUMNS: ColumnDef<SortField>[] = [
	{ field: 'make', label: 'Make' },
	{ field: 'maxSpeed', label: 'Speed' },
	{ field: 'type', label: 'Type' },
	{ field: 'fullname', label: 'Owner' },
	{ field: 'createdAt', label: 'Date' },
]

type Props = {
	comments: UserProfile['comments'],
}

export function UserProfileComments({ comments }: Props) {
	const [ sortBy, setSortBy ] = useState<SortBy<SortField>>({ sortDir: 1 })

	function formatDate(ts: number) {
		return formatDistanceToNow(new Date(ts), { addSuffix: true })
	}

	function onSort(sortField: SortField) {
		if (sortField === sortBy.sortField) setSortBy(prev => ({ sortField, sortDir: prev.sortDir === 1 ? -1 : 1 }))
		else setSortBy({ sortField, sortDir: 1 })
	}

	function sort() {
		if (!sortBy.sortField) return comments

		switch (sortBy.sortField) {
			case 'make':
			case 'type':
				return comments.toSorted((a, b) => (a.car[sortBy.sortField].localeCompare(b.car[sortBy.sortField]) * sortBy.sortDir))
		
			case 'fullname':
				return comments.toSorted((a, b) => (a.car.owner[sortBy.sortField].localeCompare(b.car.owner[sortBy.sortField]) * sortBy.sortDir))

			case 'maxSpeed':
				return comments.toSorted((a, b) => (a.car.maxSpeed - b.car.maxSpeed) * sortBy.sortDir)
				
			case 'createdAt':
				return comments.toSorted((a, b) => (a.createdAt - b.createdAt) * sortBy.sortDir)
		}
	}

	const sorted = sort()

	return (
		<div className="liked-cars grid grid-cols-5 gap-1 content-start w-5/6 m-auto h-[31vh] overflow-scroll">
			
			<div className="column-headings sticky top-0 z-10 grid grid-cols-subgrid items-center col-span-5 py-1.5 bg-white border-be">
				<ColumnHeadings 
					columns={COMMENTS_COLUMNS}
					sortBy={sortBy}
					onSort={onSort}/>
			</div>

			{sorted.map(comment => 
				<div key={comment.id} className="row grid grid-cols-subgrid items-center col-span-5 py-1.5 border-be first:border-bs hover:bg-muted">
					<p className="make text-xl">{comment.car.make}</p>
					<p className="speed flex gap-3 items-center text-xl">
						<span className="basis-[3ch] text-end">{comment.car.maxSpeed}</span> 
						<span className="self-end mbe-0.5 text-sm text-muted-foreground">Kmh</span>	
					</p>
					<CarTypeBadge car={comment.car as CarPublic} variant="outline"/>
					<UserAvatar user={comment.car.owner as UserPublic} />
					<p>{formatDate(comment.createdAt)}</p>
					<CommentTxt txt={comment.txt}/>
				</div>
			)}
		</div>
	)
}

type CommentTxtProps = {
	txt: string
}

function CommentTxt({ txt }: CommentTxtProps) {
	const [ isExpanded, setIsExpanded ] = useState(false)
	const [ heights, setHeights ] = useState({ collapsed: 0, expanded: 0 })

	const contentRef = useRef<HTMLParagraphElement>(null)

	useLayoutEffect(() => {
		const el = contentRef.current
		if (!el) return

		const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
		setHeights({ collapsed: lineHeight, expanded: el.scrollHeight })
	}, [txt])

	const isMeasured = heights.expanded > 0
	const maxHeight = isExpanded ? heights.expanded : heights.collapsed

	return (
		<p
			ref={contentRef}
			onClick={() => setIsExpanded(prev => !prev)}
			style={isMeasured ? { maxHeight } : undefined}
			className={[
				'col-span-full overflow-hidden px-2 pbs-1 cursor-pointer',
				'transition-[max-height] duration-300 ease-in-out',
				!isMeasured && !isExpanded ? 'line-clamp-1' : '',
			].join(' ')}
		>
			{txt}
		</p>
	)
}
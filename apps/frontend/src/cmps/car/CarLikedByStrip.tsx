import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar"
import type { Car } from "@cars/shared"

type CarLikedByStripProps = {
	car: Car,
}

export function CarLikedByStrip({ car }: CarLikedByStripProps) {
	const alignmentHelper = "min-h-6 mt-4"

	if (!car.likedBy?.length) return <div className={`${alignmentHelper} + text-xs pt-1`}>
		<p>Be the first to like this car...</p>
	</div>

	function fallback(like) {
		return like.by.fullname.split(' ').map(str => str.at(0)).slice(0, 2)
	}

	return <div className={`interactions flex items-center gap-3 ${alignmentHelper}`}>
		<AvatarGroup>
			{car.likedBy.slice(0, 3).map(like =>
				<Avatar size='sm' key={like.by._id}>
					<AvatarImage src={like.by.imgUrl}/>
					<AvatarFallback>{fallback(like)}</AvatarFallback>
				</Avatar>
			)}
		</AvatarGroup>

		<p className='text-xs'>
			Liked by {car.likedBy[0].by.fullname} 
				{(car.likedBy.length > 1) && <span> and {car.likedBy.length - 1} others..</span>}</p>
	</div>
}
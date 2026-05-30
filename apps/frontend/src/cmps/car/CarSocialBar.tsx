import { authService } from "#services/auth/index.ts"
import type { Car } from "@cars/shared"
import { Heart, MessageCircle } from "lucide-react"

type CarSocialBarProps = {
	car: Car,
	onToggleLike: () => Promise<void>,
}

export function CarSocialBar({ car, onToggleLike }: CarSocialBarProps) {

	function likedByLoggedinUser(car: Car) {
		const loggedinUser = authService.getLoggedInUser()
		if (!loggedinUser) return false

		return car.likedBy?.map(like => like.by._id)?.includes(loggedinUser._id)
	}

	return <div className="actions flex items-center">
		<Heart 
			size={24} 
			onClick={onToggleLike}
			className={`mr-1.5 hover:cursor-pointer ${likedByLoggedinUser(car) && 'fill-red-500 text-red-500 stroke-red-500'}`}/>
		{!!car?.likedBy?.length && <span className='text-xs text-muted-foreground'>{car.comments.length}</span>}
		
		<MessageCircle size={21} className='ml-4 mr-1.5 -scale-x-100'/>
		{!!car?.comments.length && <span className='text-xs text-muted-foreground'>{car.comments.length}</span>}
	</div>
}
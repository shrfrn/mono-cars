import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CarQueryOptions, UserProfile } from "@cars/shared"
import { UserProfileLikes } from "./UserProfileLikes"
import { UserProfileComments } from "./UserProfileComments"
import { CarFilter } from "../car/CarFilter"
import { carService } from "#services/car/index.ts"
import { useState } from "react"

type Props = {
	profile: UserProfile,
}

type ProfileTab = 'likes' | 'comments'

export function UserProfileTabs({ profile }: Props) {
	
	const defualtTab: ProfileTab = 'likes'

    const carQueryOptions  = carService.getEmptyCarOptions()
	const [ queryOptions, setQueryOptions ] = useState<CarQueryOptions>(carQueryOptions)

	const likedCars = filterLikedCars(profile.likedCars, queryOptions.filterBy)
	const comments = filterComments(profile.comments, queryOptions.filterBy)

	return (
		<div className="mbs-4">
			
			<Tabs defaultValue={defualtTab} className="p-4 border rounded-xl">
				<header className="flex justify-between items-end sticky top-0 w-5/6 m-auto">
					<TabsList className='*:px-3'>
						<TabsTrigger value="likes" className="cursor-pointer">Likes</TabsTrigger>
						<TabsTrigger value="comments" className="cursor-pointer">Comments</TabsTrigger>
					</TabsList>
					<CarFilter queryOptions={queryOptions} setQueryOptions={setQueryOptions}/>
				</header>

				<TabsContent value="likes">
					<UserProfileLikes likedCars={likedCars} />
				</TabsContent>

				<TabsContent value="comments">
					<UserProfileComments comments={comments} />
				</TabsContent>
			</Tabs>		
		</div>
	)
}

function filterLikedCars(likedCars: UserProfile['likedCars'], filterBy: CarQueryOptions['filterBy']) {

	if (filterBy.txt) {
		const regex = new RegExp(filterBy.txt, 'i')
		likedCars = likedCars.filter(car => regex.test(car.owner.fullname) || regex.test(car.make))
	}

	if (filterBy.minSpeed) {
		likedCars = likedCars.filter(car => car.maxSpeed >= filterBy.minSpeed)
	}

	if (filterBy.type) {
		likedCars = likedCars.filter(car => car.type === filterBy.type)
	}
	return likedCars
}

function filterComments(comments: UserProfile['comments'], filterBy: CarQueryOptions['filterBy']) {

	if (filterBy.txt) {
		const regex = new RegExp(filterBy.txt, 'i')
		comments = comments.filter(comment => regex.test(comment.car.owner.fullname) || regex.test(comment.car.make))
	}

	if (filterBy.minSpeed) {
		comments = comments.filter(comment => comment.car.maxSpeed >= filterBy.minSpeed)
	}

	if (filterBy.type) {
		comments = comments.filter(comment => comment.car.type === filterBy.type)
	}
	return comments
}
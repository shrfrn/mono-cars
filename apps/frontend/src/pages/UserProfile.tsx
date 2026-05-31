import { useEffect, useState } from "react"
import { useParams } from "react-router"

import type { UserProfile } from "@cars/shared"
import { userService } from "#services/user/user.service.remote.ts"
import { UserProfileHero } from "@/cmps/user-profile/UserProfileHero"
import { UserProfileTabs } from "../cmps/user-profile/UserProfileTabs"

export function UserProfile() {
	const [ profile, setProfile ] = useState<UserProfile>()
	const { userId } = useParams()
	
	useEffect(() => {
		loadProfile()
		
		async function loadProfile() {
			const profile = await userService.getUserProfile(userId)
			setProfile(profile)
		}
	}, [])

	if (!profile) return <div className="">Loading</div>

	return <div className="user-profile">
		<div className="overflow-clip border rounded-xl mbs-6">
			<UserProfileHero profile={profile} />
			{/* <pre>{JSON.stringify(profile, null, 2)}</pre> */}
		</div>

		<UserProfileTabs profile={profile} />


	</div>
}
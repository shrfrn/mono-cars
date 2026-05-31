import type { UserProfile } from "@cars/shared"

type Props = {
	profile: UserProfile,
}

export function UserProfileLikes({ profile }: Props) {
	return (
		<div>
			<pre>{JSON.stringify(profile.likedCars, null, 2)}</pre>
		</div>
	)
}
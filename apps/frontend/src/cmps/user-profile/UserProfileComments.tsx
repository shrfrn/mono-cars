import type { UserProfile } from "@cars/shared"

type Props = {
	profile: UserProfile,
}

export function UserProfileComments({ profile }: Props) {
	return (
		<div>
			<pre>{JSON.stringify(profile.comments, null, 2)}</pre>
		</div>
	)
}
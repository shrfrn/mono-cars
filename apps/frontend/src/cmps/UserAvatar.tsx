import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserPublic } from "@cars/shared"

type Props = {
	user: UserPublic,
	size?: 'sm' | 'default' | 'lg',
}

export function UserAvatar({ user, size = 'default' }: Props) {
	const initials = user.fullname.split(' ').slice(0, 2).map(part => part.at(0)).join('')

	return (
		<a href={`/user-profile/${user._id}`} className='flex gap-2 items-center'>
			<Avatar size={size}>
				<AvatarImage src={user.imgUrl} />
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<p>{user.fullname}</p>
		</a>
	)
}
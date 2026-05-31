import type { UserProfile } from '@cars/shared'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Dot, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

import bgImg from '../../assets/bgc.jpg'
import facebookIcon from '../../assets/facebook.svg'
import xIcon from '../../assets/x.svg'
import youtubeIcon from '../../assets/youtube.svg'
import instagramIcon from '../../assets/instagram.svg'

type Props = {
	profile: UserProfile,
}
export function UserProfileHero({ profile }: Props) {
	const initials = profile.fullname.split(' ').slice(0, 2).map(part => part.at(0)).join('')
	const joined = new Intl.DateTimeFormat('en-US', {
		month: 'long',
		year: 'numeric',
	}).format(profile._createdAt)
	
	return <div className='hero mbe-5'>
		<div className="banner h-40 w-full">
			<img src={bgImg} className="h-full w-full object-cover" />
		</div>
		<main className="flex items-end gap-6 px-10 -mt-12">
			<Avatar className="size-36 border-4 border-background ring-1 ring-border">
				<AvatarImage src={profile.imgUrl} className="bg-gray-50"/>
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>

			<div className="details">
				<h1 className='text-3xl'>{profile.fullname}</h1>
				<p className="text-md text-muted-foreground">{profile.role}</p>

				<div className="profile-stats flex items-center mbs-1 text-sm text-muted-foreground [&_p]:ms-1.5">
					<MapPin size={18}/>
					<p>Kfar Sirkin</p>
					<Dot className='text-muted-foreground' />
					<Calendar size={18}/>
					<p>Joined {joined}</p>
				</div>

			</div>
			<div className="space-x-2 actions ms-auto">
				<Button>Follow</Button>
				<Button variant='outline'>Mesage</Button>
			</div>
		</main>
		<p className='text-muted-foreground mbs-6 ms-10'>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Fuga, vel itaque! Ipsum, labore voluptatum voluptate dolores rerum voluptates perspiciatis quisquam ipsam iste deleniti cupiditate nihil neque unde veritatis dolorum maxime fugiat laborum vitae cumque nemo optio amet incidunt. Deserunt, qui?</p>
		<div className="social-media flex gap-6 h-4 ms-10 my-5 *:opacity-60">
			<img src={instagramIcon} alt="instagram icon" className=' '/>
			<img src={youtubeIcon} alt="youtube icon" />
			<img src={facebookIcon} alt="facebook icon" />
			<img src={xIcon} alt="x icon" />
		</div>
	</div>
}
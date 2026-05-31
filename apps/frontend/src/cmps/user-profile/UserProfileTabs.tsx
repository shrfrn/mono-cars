import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { UserProfile } from "@cars/shared"
import { UserProfileLikes } from "./UserProfileLikes"
import { UserProfileComments } from "./UserProfileComments"

type Props = {
	profile: UserProfile,
}

export function UserProfileTabs({ profile }: Props) {
	return (
		<div className="mbs-4">
			<Tabs defaultValue="likes" className="w-[400px]">
				<TabsList>
					<TabsTrigger value="likes">Likes</TabsTrigger>
					<TabsTrigger value="comments">Comments</TabsTrigger>
				</TabsList>

				<TabsContent value="likes">
					<UserProfileLikes profile={profile} />
				</TabsContent>
				
				<TabsContent value="comments">
					<UserProfileComments profile={profile} />
				</TabsContent>
			</Tabs>		
		</div>
	)
}
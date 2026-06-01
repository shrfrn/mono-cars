import type { Car, UserPublic } from "@cars/shared"

import { CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { CarPreviewBodyRow } from "./CarPreviewBodyRow"
import { CarTypeBadge } from "./CarTypeBadge"
import { CarLikedByStrip } from "./CarLikedByStrip"
import { UserAvatar } from "../UserAvatar"

type CarPreviewBodyProps = {
	car: Car,
}

export function CarPreviewBody({ car }: CarPreviewBodyProps) {
	return <CardContent>
		<div className="inner-container rounded-lg bg-muted/50 px-4 py-2">
			<CarPreviewBodyRow label="Type">
				<CarTypeBadge car={car} />
			</CarPreviewBodyRow>

			<Separator />

			<CarPreviewBodyRow label="Owner">
				<UserAvatar user={car.owner as UserPublic} />
			</CarPreviewBodyRow>

		</div>

		<CarLikedByStrip car={car} />
	</CardContent>
}
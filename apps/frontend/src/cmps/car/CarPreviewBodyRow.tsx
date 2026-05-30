import type { ReactNode } from "react"

type CarPreviewBodyRowProps = {
	label: string,
	children: ReactNode,
}

export function CarPreviewBodyRow({ label, children }: CarPreviewBodyRowProps) {
	const rowClass = 'row flex min-h-11 items-center justify-between py-2'

	return 	<div className={rowClass}>
		<span>{label}</span>
		{children}
	</div>
}
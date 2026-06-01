import { useState } from "react"

type Props = {
	txt: string,
	collapsedLength: number,
}

export function TextExpander({ txt, collapsedLength = 60 }: Props) {
	const [ isCollapsed, setIsCollapsed ] = useState<boolean>(true)

	function onToggleCollapsed() {
		setIsCollapsed(prev => !prev)
	}

	return (
		<p className="text-sm ">{isCollapsed ? txt.slice(0, collapsedLength) : txt} 
			<span onClick={onToggleCollapsed}>{isCollapsed ? 'more...' : 'less...'}</span></p>
	)
}
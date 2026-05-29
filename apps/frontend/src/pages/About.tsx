import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Car } from 'lucide-react'

export function About() {
	return (
		<div className="about">
			<h1>About</h1>
			<p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptates perspiciatis ut, deleniti obcaecati animi inventore! Ipsam corporis nobis enim eum!</p>

			<div className="shadcn-playground mt-12 mx-10 max-w-md space-y-6 rounded-xl border border-border bg-card p-10 hover:shadow-md">
				<div>
					<h2 className="text-lg font-semibold">UI playground</h2>
					<p className="text-sm text-muted-foreground">
						Tailwind utilities + shadcn components
					</p>
				</div>

				{/* Lesson 1: pure Tailwind */}
				<div className="flex gap-2">
					<span className="rounded-md bg-muted px-2 py-1 text-xs">badge</span>
					<span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
						primary
					</span>
				</div>

				{/* Lesson 2: shadcn Button variants */}
				<div className="flex flex-wrap gap-2">
					<Button>Default</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="destructive">Destructive</Button>
				</div>

				{/* Lesson 3: icon + size */}
				<Button size="lg">
					<Car />
					With icon
				</Button>

				<Card>
					<CardHeader>
						<CardTitle>This is a Card</CardTitle>
						<CardDescription>Lorem ipsum, dolor sit amet.</CardDescription>
						<CardAction>
							<Button variant='outline'>x</Button>
						</CardAction>
					</CardHeader>

					<CardContent>
						<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Numquam voluptatibus veritatis ducimus quos ratione dolorum facilis corporis odio fuga nisi!</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Numquam voluptatibus veritatis ducimus quos ratione dolorum facilis corporis odio fuga nisi!</p>
					</CardContent>

					<CardFooter className='justify-end gap-2'>
						<Button>Details</Button>
						<Button>Edit</Button>
					</CardFooter>

				</Card>
			</div>
		</div>
	)
}
import { MongoClient } from 'mongodb'

import type { CarType, MiniUser, UserRoles } from '@cars/shared'
import { CarTypeSchema } from '@cars/shared'

const config = {
	dbURL: process.env.MONGO_URL
		|| 'mongodb://mongo1:27117,mongo2:27118,mongo3:27119/?replicaSet=car',
	dbName: process.env.MONGO_DB_NAME || 'car',
}

const CAR_COUNT = 100
const NO_COMMENTS_CAR_INDEX = 42

const CAR_MAKES = [
	'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Volkswagen',
	'Hyundai', 'Kia', 'Nissan', 'Mazda', 'Subaru', 'Tesla', 'Porsche',
	'Volvo', 'Peugeot', 'Renault', 'Fiat', 'Chevrolet', 'Jeep',
]

const COMMENT_SNIPPETS = [
	'Smooth ride on the highway.',
	'Great fuel economy for daily commuting.',
	'Interior feels a bit dated but reliable.',
	'Handles corners surprisingly well.',
	'Perfect family car with plenty of trunk space.',
	'Engine noise is louder than expected.',
	'Love the electric mode in city traffic.',
	'Maintenance costs have been reasonable so far.',
	'Seats are comfortable on long trips.',
	'Acceleration could be stronger uphill.',
	'Clean design and easy to park.',
	'Infotainment system is intuitive.',
	'Would buy again without hesitation.',
	'Suspension is stiff on rough roads.',
	'Excellent safety features for the price.',
]

const USER_SPECS: { username: string, role: UserRoles }[] = [
	{ username: '1', role: 'Member' },
	{ username: '2', role: 'Member' },
	{ username: '3', role: 'Member' },
	{ username: '4', role: 'Member' },
	{ username: '5', role: 'Member' },
	{ username: '6', role: 'Moderator' },
	{ username: '7', role: 'Moderator' },
	{ username: '8', role: 'Admin' },
]

const OWNER_WEIGHTS = [25, 20, 15, 12, 10, 8, 6, 4]

if (OWNER_WEIGHTS.reduce((sum, n) => sum + n, 0) !== CAR_COUNT) {
	throw new Error('OWNER_WEIGHTS must sum to CAR_COUNT')
}

main()

async function main() {
	const client = new MongoClient(config.dbURL)

	try {
		await client.connect()
		const db = client.db(config.dbName)

		await _clearCollections(db)

		const users = await _insertUsers(db)
		const miniUsers = users.map(toMiniUser)
		const cars = _buildCars(miniUsers)

		await db.collection('car').insertMany(cars)

		_logSummary(users, cars)
	} finally {
		await client.close()
	}
}

async function _clearCollections(db: ReturnType<MongoClient['db']>) {
	await db.collection('user').deleteMany({})
	await db.collection('car').deleteMany({})
}

async function _insertUsers(db: ReturnType<MongoClient['db']>) {
	const now = new Date()
	const users = USER_SPECS.map(({ username, role }) => ({
		username,
		fullname: `User ${username}`,
		password: username,
		imgUrl: userImgUrl(username),
		role,
		_createdAt: now,
		_updatedAt: now,
		_version: 1,
	}))

	const { insertedIds } = await db.collection('user').insertMany(users)

	return users.map((user, index) => ({
		...user,
		_id: insertedIds[index].toHexString(),
	}))
}

function _buildCars(miniUsers: MiniUser[]) {
	const ownerAssignments = _buildOwnerAssignments()
	const carTypes = CarTypeSchema.options

	return ownerAssignments.map((ownerIdx, carIndex) => {
		const owner = miniUsers[ownerIdx]
		const commentCount = carIndex === NO_COMMENTS_CAR_INDEX ? 0 : randomInt(3, 40)
		const comments = _buildComments(commentCount, miniUsers)
		const likedBy = _maybeBuildLikes(miniUsers)

		return {
			make: randomElement(CAR_MAKES),
			maxSpeed: randomInt(80, 320),
			type: randomElement(carTypes) as CarType,
			owner,
			comments,
			...(likedBy.length ? { likedBy } : {}),
			_createdAt: new Date(Date.now() - randomInt(0, 90) * 86_400_000),
			_updatedAt: new Date(),
			_version: 1,
		}
	})
}

function _buildOwnerAssignments() {
	const assignments: number[] = []

	OWNER_WEIGHTS.forEach((count, userIdx) => {
		for (let i = 0; i < count; i++) assignments.push(userIdx)
	})

	return shuffle(assignments)
}

function _buildComments(count: number, miniUsers: MiniUser[]) {
	const comments = []

	for (let i = 0; i < count; i++) {
		const author = randomElement(miniUsers)

		comments.push({
			id: makeId(),
			createdAt: Date.now() - randomInt(0, 60) * 86_400_000,
			txt: randomElement(COMMENT_SNIPPETS),
			author,
		})
	}

	return comments
}

function _maybeBuildLikes(miniUsers: MiniUser[]) {
	if (Math.random() > 0.65) return []

	const likeCount = randomInt(1, 8)
	const likers = shuffle([...miniUsers]).slice(0, likeCount)

	return likers.map(by => ({
		createdAt: Date.now() - randomInt(0, 30) * 86_400_000,
		by,
	}))
}

function toMiniUser(user: { _id: string, fullname: string, imgUrl: string, role: UserRoles }) {
	return {
		_id: user._id,
		fullname: user.fullname,
		imgUrl: user.imgUrl,
		role: user.role,
	}
}

function userImgUrl(username: string) {
	return `https://www.robohash.org/${username}`
}

function _logSummary(
	users: { username: string, role: UserRoles, _id: string }[],
	cars: { owner: MiniUser, comments?: unknown[], likedBy?: unknown[] }[],
) {
	const carsByOwner = users.map(user => ({
		username: user.username,
		role: user.role,
		cars: cars.filter(car => car.owner._id === user._id).length,
	}))

	console.log('\nDemo data seeded successfully\n')
	console.log('Users (password === username):')
	users.forEach(user => console.log(`  ${user.username} — ${user.role}`))
	console.log('\nCars per owner:')
	carsByOwner.forEach(({ username, role, cars: count }) => {
		console.log(`  ${username} (${role}): ${count} cars`)
	})

	const noCommentsCar = cars[NO_COMMENTS_CAR_INDEX]
	const commentCounts = cars.map(car => car.comments?.length ?? 0)

	console.log('\nComments:')
	console.log(`  min ${Math.min(...commentCounts)}, max ${Math.max(...commentCounts)}`)
	console.log(`  car #${NO_COMMENTS_CAR_INDEX + 1} has ${noCommentsCar.comments?.length ?? 0} comments`)
	console.log(`  cars with likes: ${cars.filter(car => car.likedBy?.length).length}`)
}

function makeId(length = 5) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let id = ''

	for (let i = 0; i < length; i++) {
		id += chars.charAt(Math.floor(Math.random() * chars.length))
	}

	return id
}

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(items: T[]) {
	return items[randomInt(0, items.length - 1)]
}

function shuffle<T>(items: T[]) {
	const copy = [...items]

	for (let i = copy.length - 1; i > 0; i--) {
		const j = randomInt(0, i)
		const tmp = copy[i]

		copy[i] = copy[j]
		copy[j] = tmp
	}

	return copy
}

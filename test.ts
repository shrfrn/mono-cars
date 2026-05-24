type MyWorker = { id: number };
type QueueListItem = {
	name: string,
	workerCount: number,
	workers: MyWorker[],
}

const queueList = [
	{
		name: 'user',
		workerCount: 3,
		workers: [] as MyWorker[],
	},
	{
		name: 'notification',
		workerCount: 1,
		workers: [] as MyWorker[],
	},
] as const satisfies QueueListItem[]

queueList[0].workers[0] = { id: 1 };

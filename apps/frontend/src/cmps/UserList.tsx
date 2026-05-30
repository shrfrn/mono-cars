import type { User } from '@cars/shared'

export type UserListProps = {
    users: User[],
    onRemoveUser: (userId: string) => void,
}

export function UserList({ users, onRemoveUser }: UserListProps) {
    if (!users) return <h1>User List</h1>
    return <section className="user-list">
        <ul>
            {users.map(user => <li key={user._id}>
                <pre>{JSON.stringify(user, null, 4)}</pre>
                <button onClick={() => onRemoveUser(user._id)}>x</button>
            </li>)}
        </ul>
    </section>
}
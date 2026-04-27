import { useEffect, useState } from "react"
import type { User } from '../services/user.service'
import { userService } from "../services/user.service"
import { UserList } from "../cmps/UserList"

export function UserIndex() {
    const [users, setUsers ] = useState<User[] | undefined>(undefined)

    useEffect(() => {
        loadUsers()
    }, [])

    async function loadUsers() {
        const users = await userService.getUsers()
        setUsers(users)
    }

    async function onRemoveUser(userId: string) {
        await userService.removeUser(userId)
        setUsers(prev => prev?.filter(user => user.id !== userId))
    }

    if (!users) return <h1>Users</h1>
    return <UserList users={users} onRemoveUser={onRemoveUser}/>
}
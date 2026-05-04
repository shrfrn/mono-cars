import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { LoginCredentialsSchema, type MiniUser, type SignupCredentials, SignupCredentialsSchema } from '@cars/shared'
import { authService } from '../services/auth'

export function Login({ setLoggedInUser }: { setLoggedInUser: (user: MiniUser | null) => void }) {
	const [isSignup, setIsSignup] = useState(false)
    const navigate = useNavigate()
	
	const LoginFormSchema = isSignup ? SignupCredentialsSchema : LoginCredentialsSchema

    const { register, handleSubmit, formState: { errors } } = useForm<SignupCredentials>({
        resolver: zodResolver(LoginFormSchema) as unknown as Resolver<SignupCredentials>,
        defaultValues: authService.getEmptyCredentials(),
    })

    async function onSubmit(credentials: SignupCredentials) {
		const action = isSignup ? authService.signup : authService.login
        try {
			const loggedinUser = await action(credentials)
			setLoggedInUser(loggedinUser)
			navigate('/car')
		} catch (err) {
			console.log('err', err.response.data)
			alert(err.response.data.message)
		}
    }

	function toggleSignup(ev: React.MouseEvent<HTMLAnchorElement>) {
		ev.preventDefault()
		setIsSignup((isSignup: boolean) => !isSignup)
	}

	return (
		<form key={String(isSignup)} onSubmit={handleSubmit(onSubmit)} className="login">

            <section className="username">
			    <input { ... register('username') } placeholder="username"/>
                {errors.username && <p className="error" >{errors.username.message}</p>}
            </section>

            <section className="password">
                <input { ...register('password')} type="password" placeholder="max. speed"/>
                {errors.password && <p className="error" >{errors.password.message}</p>}
            </section>

            {isSignup && <section className="fullname">
                <input { ...register('fullname')} type="text" placeholder="full name"/>
                {errors.fullname && <p className="error" >{errors.fullname.message}</p>}
            </section>}

			<a href="#" onClick={toggleSignup}>
				{isSignup ? 'Login' : 'Signup'}
			</a>

			<Link to="/car">Cancel</Link>
            <button>{isSignup ? 'Signup' : 'Login'}</button>
		</form>
	)
}
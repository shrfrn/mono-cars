import fs from 'fs'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

const LOGS_DIR = './logs'
const LOG_FILE = `${LOGS_DIR}/backend.log`

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR)


export const logger = {
	debug(...args: any[]) { doLog('DEBUG', ...args) },
	info(...args: any[])  { doLog('INFO',  ...args) },
	warn(...args: any[])  { doLog('WARN',  ...args) },
	error(...args: any[]) { doLog('ERROR', ...args) },
}


function doLog(level: LogLevel, ...args: any[]) {
	const line = _formatLine(level, args)

	if (process.env.NODE_ENV !== 'production') {
		const stream = (level === 'ERROR' || level === 'WARN') ? process.stderr : process.stdout
		stream.write(line)
	}

	fs.appendFile(LOG_FILE, line, err => {
		if (err) console.error('FATAL: cannot write to log file', err)
	})
}


function _formatLine(level: LogLevel, args: any[]) {
	const parts = args.map(_stringify)
	return `${_getTime()} - ${level} - ${parts.join(' | ')}\n`
}


function _stringify(arg: any) {
	if (typeof arg === 'string') return arg
	if (arg instanceof Error) return arg.stack || `${arg.name}: ${arg.message}`

	return JSON.stringify(arg, null, 2)
}


function _getTime() {
	return new Date().toLocaleString('he')
}
